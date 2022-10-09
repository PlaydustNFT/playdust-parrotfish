import { processCollectionId } from '../backfill-collection-price-attribute-data/module'
import { createInterface } from "readline";
import { createReadStream } from 'fs';
import * as AWS from 'aws-sdk';
import { processActiveOrders } from '../backfill-active-orders/module'
import { sendToQueue } from '../../shared/src/util/aws';
import { ddbmapper } from '../../shared/src/service/dynamodb';
import { EntityType } from '../../shared/src/types';
import { NFT4CollectionEntity } from "../../shared/src/entity/NFT4CollectionEntity";
import { IndexNames } from '../../shared/src/consts';
import { processItem as aggregateBidAndAsks } from '../../bids-asks-to-OS/src/processorEntrypoint';
import { processItem as aggregateCollections } from '../../collection-data-aggregation-to-OS/src/processorEntrypoint';
import { processItem as aggregateMintMetadata } from '../../metadata-aggregation-to-OS/src/processorEntrypoint';

const DELAY =
        Number(process.env.DELAY)
        || 3000;

const MAX_PROMISES = // max concurrent promises
        Number(process.env.MAX_PROMISES)
        || 50;

enum Mode {
    Attribute = 1,
    Price = 2,
    ActiveOrders = 4,
    MetadataQueue = 8,
};

enum PublishMode {
    Queue = 1,
    Aggregate = 2,
};

const MODE = // controls which mode operates: { PRICE, ATTRIBUTE }
        Number(process.env.MODE)
        || 4;

const PUBLISH_MODE = // 
        Number(process.env.PUBLISH_MODE)
        || 1;

const INPUT_FILE_PATH = // where to source the collection ids file
        process.env.INPUT_FILE_PATH
        || '/home/ubuntu/files/collectionIds.txt';

const BID_ASK_QUEUE_NAME = 
        process.env.BID_ASK_QUEUE_NAME
        || 'BidsAsks-to-OS-Queue';

const METADATA_QUEUE_NAME = 
        process.env.METADATA_QUEUE_NAME
        || 'NFTMetadata-to-OS-Queue';
    
const COLLECTION_QUEUE_NAME = 
        process.env.COLLECTION_QUEUE_NAME
        || 'CollectionMetadata-to-OS-Queue';

console.log(`BID_ASK_QUEUE=${BID_ASK_QUEUE_NAME}|COLLECTION_QUEUE=${COLLECTION_QUEUE_NAME}|METADATA_QUEUE=${METADATA_QUEUE_NAME}`);

console.log(`entrypoint OPEN_SEARCH_INDEX=${process.env.OPEN_SEARCH_INDEX}`);

/**
 * Looks up queue urls and assigns local variables accordingly
 */
const sqs = new AWS.SQS({apiVersion: '2012-11-05', region: 'us-east-1'});
let collectionIdQueue = '';
let bidAskQueue = '';
let metadataQueue = '';
sqs.getQueueUrl({ QueueName: COLLECTION_QUEUE_NAME }, async function(err, data) {
    if (err) {
        console.error(`FAILED TO GET COLLECTION QUEUE!`, err, err.stack);
    }
    else {
        collectionIdQueue = data.QueueUrl as string;
    }
});
sqs.getQueueUrl({ QueueName: BID_ASK_QUEUE_NAME }, async function(err, data) {
    if (err) {
        console.error(`FAILED TO GET BID_ASK QUEUE!`, err, err.stack);
    }
    else {
        bidAskQueue = data.QueueUrl as string;
    }
});
sqs.getQueueUrl({ QueueName: METADATA_QUEUE_NAME }, async function(err, data) {
    if (err) {
        console.error(`FAILED TO GET METADATA QUEUE!`, err, err.stack);
    }
    else {
        metadataQueue = data.QueueUrl as string;
    }
});
if (!metadataQueue || metadataQueue == '') {
    metadataQueue = "https://sqs.us-east-1.amazonaws.com/513523160844/NFTMetadata-to-OS";
}
console.log(`collectionIdQueue=${collectionIdQueue}|bidAskQueue=${bidAskQueue}|metadataQueue=${metadataQueue}`);

/**
 * Core method to conduct backill with various modes 
 */
export const conductCollectionBackfill = async (collectionId: string, mode: Mode, publishMode: PublishMode) => {
    const promises = [];
    const mints: string[] = [];
    console.log(`GET_MINTS|collectionId=${collectionId}`);
    try {
        for await (const item of ddbmapper.query( 
            NFT4CollectionEntity, 
            { type: EntityType.NFT4Collection, primaryEntity: collectionId }, 
            { indexName: IndexNames.EntityDb.typePrimaryEntityIndex } 
        )) {
            mints.push(item.data);
        }
    }
    catch (e) {
        console.log(`Failed to look up mints!`);
    }
    console.log(`MINT_COUNT|collectionId=${collectionId}|count=${mints.length}`);
    if (mode & Mode.ActiveOrders) {
        try {
            await processActiveOrders(mints);
            console.log(`ACTIVE_ORDERS|COMPLETE|collectionId=${collectionId}`);
            if (publishMode & PublishMode.Queue) {
                console.log(`SEND_TO_BID_ASK_QUEUE|COMPLETE|collectionId=${collectionId}`);
                await sendToQueue(sqs, bidAskQueue, mints);
            }
            else if (publishMode & PublishMode.Aggregate) {
                console.log(`AGGREGATE_BID_AND_ASK|START|collectionId=${collectionId}`);
                await aggregateBidAndAsks(mints);
                console.log(`AGGREGATE_BID_AND_ASK|COMPLETE|collectionId=${collectionId}`);
            }
            else {
                console.log(`PUBLISH_MODE_UNSUPPORTED|FAILURE|collectionId=${collectionId}`);
            }
        }
        catch (e) {
            console.log(`MINT_PROCESS_ERROR: ${JSON.stringify(e)}`);
        }
    }
    if ((mode & Mode.Attribute) && (mode & Mode.Price)) {
        try {
            await processCollectionId(collectionId, 3);
            console.log(`PROCESS_COLLECTION_ID|COMPLETE|collectionId=${collectionId}`);
            if (publishMode & PublishMode.Queue) {
                await sendToQueue(sqs, collectionIdQueue, [collectionId]);
                console.log(`SEND_TO_COLLECTION_QUEUE|COMPLETE|collectionId=${collectionId}`);
            }
            else if (publishMode & PublishMode.Aggregate) {
                console.log(`AGGREGATE_COLLECTIONS|START|collectionId=${collectionId}`);
                await aggregateCollections([collectionId]);
                console.log(`AGGREGATE_COLLECTIONS|COMPLETE|collectionId=${collectionId}`);
            }
            else {
                console.log(`INVALID_COLLECTION_MODE!`);
            }
        }
        catch (e) {
            console.log(`COLLECTION_PROCESS_ERROR: ${JSON.stringify(e)}`);
        }
    }
    if (publishMode & PublishMode.Queue) {
        try {
            await sendToQueue(sqs, metadataQueue, mints);
            console.log(`SEND_TO_METADATA_QUEUE|COMPLETE|collectionId=${collectionId}`);
        }
        catch (e) {
            console.log(`METADATA_PROCESS_TO_QUEUE_ERROR: ${JSON.stringify(e)}`);
        }
    }
    else if (publishMode & PublishMode.Aggregate) {
        try {
            console.log(`AGGREGATE_MINT_METADATA|COMPLETE|collectionId=${collectionId}`);
            await aggregateMintMetadata(mints, collectionId);
        }
        catch (e) {
            console.log(`METADATA_PROCESS_TO_OS_ERROR: ${JSON.stringify(e)}`);
        }
    }
}

(async () => 
{
    /** Fetch all collection ids from file */
    const outerTimerLabel = 'outer';
    console.time(outerTimerLabel);
    const innerTimerLabel = 'inner';
    console.time(innerTimerLabel);
    const collectionIds: string[] = [];
    console.log(`Reading collection ids from ${JSON.stringify(INPUT_FILE_PATH)}`);

    const rl = createInterface({
      input: createReadStream(INPUT_FILE_PATH),
      crlfDelay: Infinity,
    });
    for await (const line of rl) {
        //console.log(`Line: ${line}`);
        collectionIds.push(line);
    }
    console.log(`Read [${JSON.stringify(collectionIds.length)}] items from ${INPUT_FILE_PATH}`);


    let promises = [];
    let i = 0;
    let batchNumber = 0;
    /** process each individual collection id */
    for (const collectionId of collectionIds) {
        i+=1;
        console.log(`Processing collectionId: ${collectionId}; (${i}/${collectionIds.length})`);
        if (promises.length >= MAX_PROMISES) {
	    	await Promise.all(promises);
            console.timeEnd(innerTimerLabel)
	    	console.log(`COMPLETE=${MAX_PROMISES*batchNumber}|PROMISES_PER_BATCH=${MAX_PROMISES}|BATCH_NUMBER=${batchNumber}`);
	    	batchNumber += 1;
	    	promises = [];
            console.time(innerTimerLabel)
        }
        promises.push(conductCollectionBackfill(collectionId, MODE, PUBLISH_MODE))
    }
    console.log(`READ COMPLETE | AWAITING FINAL PROMISES`);

    await Promise.all(promises);
    console.timeEnd(outerTimerLabel)

    /** reduce marketdata4Collection objects to their data / reference global id */
})();
