import { Entity, EntityType, MarketplaceTransactionEntityDataWithType, RelatedEntityData } from '../../shared/src/types'
import { ddbmapper } from '../../shared/src/service/dynamodb';
import * as AWS from 'aws-sdk';
import { buildOrderEntityGlobalId, createMarketData4CollectionObjects, getCollectionIds, } from '../../shared/src/util';
import { AskOrderStateEntity } from '../../shared/src/entity/order_state/AskOrderStateEntity';
import { BidOrderStateEntity } from '../../shared/src/entity/order_state/BidOrderStateEntity';
import { MarketplaceTransactionEntity } from '../../shared/src/entity/transaction/MarketplaceTransactionEntity'
import { createBidOrderStateEntity, updateBidOrderStateEntity } from './calculator/bid';
import { createAskOrderStateEntity, updateAskOrderStateEntity } from './calculator/ask';
/** For Get Collection Ids */
import { MarketData4CollectionEntity } from '../../shared/src/entity/MarketData4CollectionEntity';
import { sendToQueue } from '../../shared/src/util/aws';

const sqs = new AWS.SQS({apiVersion: '2012-11-05', region: 'us-east-1'});
/** Fetch queue url for relevant sqs queue */
let queueUrlBidAskOS = '';
sqs.getQueueUrl({ QueueName: process.env.BIDS_ASKS_QUEUE_NAME }, function(err, data) {
    if (err) {
        console.error(err, err.stack);
    }
    else {
        queueUrlBidAskOS = data.QueueUrl;
    }
});

let queueUrlCollectionPrice = '';
sqs.getQueueUrl({ QueueName: process.env.PRICE_PROCESSOR_QUEUE_NAME }, function(err, data) {
    if (err) {
        console.error(err, err.stack);
    }
    else {
        queueUrlCollectionPrice = data.QueueUrl;
    }
});

/** Comment to trigger build from changed shared code */

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export const processItem = async (entity: MarketplaceTransactionEntity) => {
    const updatedRelatedEntityDataItems: RelatedEntityData[] = [];
    const promises: Promise<Entity>[] = [];
    const data: MarketplaceTransactionEntityDataWithType = { ...entity.data, type: entity.type };
    console.log(`ACTIVEORDERSPROCESSOR|mint=${entity.primaryEntity}|signature=${entity.id}`);
    switch (data.type) {
        case EntityType.BidTransaction:
        case EntityType.CancelBidTransaction: {
            /** FIXME I know, I know, I know... this is a common routine... & we need to reduce duplicate code! */
            const updatedEntity = await createOrUpdateBidEntity(data);
            if (updatedEntity) {
                /** Create MarketData4Collection Entity objects */
                /** Update those objects with global ids of newly created/updated entities */
                /** Push those to the db! */
                updatedRelatedEntityDataItems.push({ globalId: updatedEntity.globalId, type: EntityType.BidOrderState });
                promises.push(ddbmapper.update(updatedEntity));
            }
            break;
        }
        case EntityType.AskTransaction:
        case EntityType.CancelAskTransaction: {
            const updatedEntity = await createOrUpdateAskEntity(data);
            if (updatedEntity) {
                updatedRelatedEntityDataItems.push({ globalId: updatedEntity.globalId, type: EntityType.AskOrderState });
                promises.push(ddbmapper.update(updatedEntity));
            }
            break;
        }
        case EntityType.ExecuteSaleTransaction: {
            const updatedAskEntity = await createOrUpdateAskEntity(data);
            if (updatedAskEntity) {
                updatedRelatedEntityDataItems.push({ globalId: updatedAskEntity.globalId, type: EntityType.AskOrderState });
                promises.push(ddbmapper.update(updatedAskEntity));
            }
            const updatedBidEntity = await createOrUpdateBidEntity(data);
            if (updatedBidEntity) {
                updatedRelatedEntityDataItems.push({ globalId: updatedBidEntity.globalId, type: EntityType.BidOrderState });
                promises.push(ddbmapper.update(updatedBidEntity));
            }
            break;
        }
        default:
            throw new Error(`Unable to match type for ${data.type}`);
    }
    /** Lookup collection ids for mint */
    let mintAddress;
    let collectionIds
    if (updatedRelatedEntityDataItems.length > 0) {
        // Lookup collections to update MarketData4Collection objects
        mintAddress = entity.data.tokenMintAccount;
        collectionIds = await getCollectionIds(mintAddress);

        const md4Collections: MarketData4CollectionEntity[] = []; 
        for (const relatedEntityData of updatedRelatedEntityDataItems) {
            md4Collections.push.apply(md4Collections, createMarketData4CollectionObjects(relatedEntityData, collectionIds));
        }

        for (const md of md4Collections) {
            // Update MarketData4Collection
            promises.push(ddbmapper.update(md));
        }
    }
    await Promise.all(promises);
    console.log(`queueUrlBidAskOS=${queueUrlBidAskOS}|queueUrlCollectionPrice=${queueUrlCollectionPrice}`);
    if(mintAddress){
        await sendToQueue(sqs, queueUrlBidAskOS, [mintAddress]);
    }
    if(collectionIds){
        await sendToQueue(sqs, queueUrlCollectionPrice, collectionIds);
    }
}

const createOrUpdateBidEntity = async (data: MarketplaceTransactionEntityDataWithType): Promise<BidOrderStateEntity> => {
    let wallet: string = data.buyerWalletAccount.toString();
    let orderStateEntity: BidOrderStateEntity = new BidOrderStateEntity(); 
    let existingOrderStateEntity: BidOrderStateEntity = new BidOrderStateEntity(); 

    let updateRequired: boolean = false;
    const targetGlobalId: string = buildOrderEntityGlobalId(
        EntityType.BidOrderState,
        wallet,
        data.tokenMintAccount.toString(),
        data.marketplace
    );

    existingOrderStateEntity.globalId = targetGlobalId;
    await ddbmapper.get(existingOrderStateEntity).then(item => {
        orderStateEntity = item;
        updateRequired = updateBidOrderStateEntity(data, orderStateEntity);
    }).catch(err => {
        // Failed to locate/update bid... Creating new entity
        orderStateEntity = createBidOrderStateEntity(data);
        updateRequired = true;
    });
    if (updateRequired) {
        return orderStateEntity;
    }
}

/** I HATE that we're duplicating code here,
 *  but not going to worry about reducing clutter right now 
 * */
const createOrUpdateAskEntity = async  (data: MarketplaceTransactionEntityDataWithType): Promise<AskOrderStateEntity> => {
    let wallet: string = data.sellerWalletAccount.toString();
    let orderStateEntity: AskOrderStateEntity = new AskOrderStateEntity(); 
    let existingOrderStateEntity: AskOrderStateEntity = new AskOrderStateEntity(); 

    let updateRequired: boolean = false;
    const targetGlobalId: string = buildOrderEntityGlobalId(
        EntityType.AskOrderState,
        wallet,
        data.tokenMintAccount.toString(),
        data.marketplace
    );

    existingOrderStateEntity.globalId = targetGlobalId;
    console.log(`ACTIVEORDERSPROCESSOR|CREATE_OR_UPDATE|targetGlobalId=${targetGlobalId}|data=${JSON.stringify(data)}`);
    await ddbmapper.get(existingOrderStateEntity).then(item => {
        console.log(`FOUND|item=askOrderState`);
        orderStateEntity = item;
        updateRequired = updateAskOrderStateEntity(data, orderStateEntity);
    }).catch(err => {
        console.log(`NOT FOUND|item=askOrderState`);
        // Failed to locate/update bid... Creating new entity
        orderStateEntity = createAskOrderStateEntity(data);
        updateRequired = true;
    });
    if (updateRequired) {
        return orderStateEntity;
    }
}