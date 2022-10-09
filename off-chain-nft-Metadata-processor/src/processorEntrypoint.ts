import { ddbmapper } from '../../shared/src/service/dynamodb'
import { EntityType, OffChainMetadata, RelatedEntityData, TriggerSubtype } from '../../shared/src/types'
import { sendToQueue } from '../../shared/src/util/aws'
import axios from 'axios'
import { MetaplexOffChainMetadataEntity } from '../../shared/src/entity/MetaplexOffChainMetadataEntity';
import {normalizeOffChainMetadata} from './utils';
import { createOffchainMetadata4CollectionObjects, getCollectionIds } from '../../shared/src/util';
import { OffchainMetadata4CollectionEntity } from '../../shared/src/entity/OffchainMetadata4CollectionEntity';
import AWS from 'aws-sdk';
import {v4 as uuidv4} from 'uuid';

const NUMBER_OF_HTTP_REQUESTS =
    Number(process.env.NUMBER_OF_HTTP_REQUESTS)
    || 5;

const ASSIGNED_HTTP_TIMEOUT_SCALING_FACTOR =
    Number(process.env.HTTP_TIMEOUT_SCALING_FACTOR)
    || 0.25;

const HTTP_TIMEOUT_SCALING_FACTOR = Math.max(Math.min(1, ASSIGNED_HTTP_TIMEOUT_SCALING_FACTOR), 0.1);

const sqs = new AWS.SQS({ region: 'us-east-1' });
/** Fetch queue url for relevant sqs queue */
/** Add comment to trigger build */

let queueUrl = '';
sqs.getQueueUrl({ QueueName: process.env.SQS_QUEUE_NAME }, function(err, data) {
    if (err) {
        console.error(err, err.stack);
    }
    else {
        queueUrl = data.QueueUrl;
    }
});

export const addOffchainMetadata = async (sourceTriggerEntity: any) => {
    let exists = false;
    const rawMetadata = sourceTriggerEntity.data;
    let offChainData: OffChainMetadata;

    const uri: string = rawMetadata.data.uri;
    let offChainDataEntity: MetaplexOffChainMetadataEntity = new MetaplexOffChainMetadataEntity();
    offChainDataEntity.globalId = EntityType.MetaplexOffchainMetadata + '-' + uri;
    await ddbmapper.get(offChainDataEntity)
    .then(item => {
        //we find an item
        if(item){
            exists = true;
            offChainDataEntity = item;
        }
    })
    .catch(err => {
        console.log(err);
        console.log('OffchainEntity doesn\'t exists, let\'s fetch it!');
    });

    if(!exists){
        for(let i=1; i<=NUMBER_OF_HTTP_REQUESTS; i++){
            try{
                const resp = await axios.get(uri, {timeout: HTTP_TIMEOUT_SCALING_FACTOR*i*60000});
                const respNormalized: OffChainMetadata = normalizeOffChainMetadata(resp.data);
                offChainData = new OffChainMetadata(respNormalized);
                if(offChainData){
                    break;
                }
            }catch(e){
                console.log(e);
            }
        }
    
        if(offChainData){
            const now = new Date();
            offChainDataEntity = new MetaplexOffChainMetadataEntity();
            offChainDataEntity.populate(offChainData, rawMetadata.mint, uri);
            let entityUpdate: Promise<MetaplexOffChainMetadataEntity>[] = [];
            entityUpdate.push(ddbmapper.put(offChainDataEntity));

            //let's wait for the PUT to the DB to complete before ending the lambda
            await Promise.all(entityUpdate).then((values) =>{})
            .catch(error => {
                console.log(error.message);
                throw('Error inserting the elements into the DB');
            });
        }else{
            //if we end up with nothing we reurn since there is no need to create additional entitites!
            return;
        }
    }       

    /** Get collections for nft */
    const mintAddress = rawMetadata.mint;
    const collectionIds = await getCollectionIds(mintAddress);

    for(const collectionId of collectionIds){
        let offchainMetadata4Collection: OffchainMetadata4CollectionEntity = new OffchainMetadata4CollectionEntity();
        offchainMetadata4Collection.globalId = EntityType.OffchainMetadata4Collection + '-' + offChainDataEntity.globalId + '-' + collectionId;
        await ddbmapper.get(offchainMetadata4Collection)
        .then(async item => {
            //we find an item
            if(item){
                await ddbmapper.delete(item)
                .then(item => {
                })
                .catch(err => {
                    console.log(err);
                    console.log('Deletion of the old entity failed!');
                });

            }
        })
        .catch(err => {
            console.log(err);
            console.log('Offchain4ColelctionEntity doesn\'t exists, no need to delete anything!');
        });
    }

    /** Create metadata 4 collection entity objects */
    const metadata4CollectionEntityUpdates: Promise<OffchainMetadata4CollectionEntity>[] = [];

    /** Create offchainMetadata4Collection object(s) */
    const relatedEntityData: RelatedEntityData = { globalId: offChainDataEntity.globalId, type: EntityType.MetaplexOffchainMetadata }; 
    const offchainMetadata4Collections = createOffchainMetadata4CollectionObjects(relatedEntityData, collectionIds, mintAddress);
    /** Update db with OffchainMetadata4Collection objects */
    for (const offchainMetadata4Collection of offchainMetadata4Collections) {
        metadata4CollectionEntityUpdates.push(ddbmapper.update(offchainMetadata4Collection));
    }
    await Promise.all(metadata4CollectionEntityUpdates).then((values) => {
    })
    .catch(error => {
        console.log(error.message);
        throw('Error inserting the elements into the DB');
    });

    /** Write collection ids to SQS queue */
    await sendToQueue(sqs, queueUrl, collectionIds);
    //comment to trigger new deployment
}
