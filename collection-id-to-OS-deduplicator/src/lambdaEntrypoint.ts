import { ScheduledEvent } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { sendToQueue } from '../../shared/src/util/aws'
import { TableNames } from '../../shared/src/consts';
import { ddbmapper } from '../../shared/src/service/dynamodb';
//add comment to trigger redeployment
/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

/**
 * This file acts as the main entrypoint for the lambda.
 * 
 * We should maintain consistency of this file's/function's naming convention 
 * across all of our back-end lambdas. 
 * 
 * The primary responsibility of this entrypoint is to perform simple 
 * smoke checks such as checking for the existence of required
 * - environment variables
 * - AWS resources
 * - Credentials
 * 
 * Once the primary checks have passed, this method should relay execution to processorEntrypoint
 * for execution of lambda-specific business logic.
 * 
 */
let sqs = new AWS.SQS({apiVersion: '2012-11-05', region: 'us-east-1'});
let outboundQueueUrl = '';
sqs.getQueueUrl({ QueueName: process.env.OUTBOUND_SQS_QUEUE_NAME }, function(err, data) {
    if (err) {
        console.error(err, err.stack);
    }
    else {
        outboundQueueUrl = data.QueueUrl;
    }
});

const MAX_SQS_BATCHES = 
    Number(process.env.MAX_SQS_BATCHES)
    || 100;

const MAX_SQS_MESSAGES_PER_BATCH = 
    Number(process.env.MAX_SQS_MESSAGES_PER_BATCH)
    || 10;

const MIN_EMPTY_ITERATIONS =
    Number(process.env.MIN_EMPTY_ITERATIONS)
    || 5;

const readFromSQS = async (sqs: AWS.SQS, params: AWS.SQS.ReceiveMessageRequest) =>{
    let tmpArray: AWS.SQS.MessageList = [];
    const result: AWS.SQS.ReceiveMessageResult = await sqs.receiveMessage(params).promise();
    try{
        for(const item of result.Messages){
            tmpArray.push(item);
        }
    }
    catch(err){
        return [];
    };
    return tmpArray;
}

type EventType = ScheduledEvent;
export const handler = async (event: EventType) => {
    try {
        // simple smoke checks
        
        if (!process.env.ENTITY_TABLE_NAME) {
            throw(new Error(`Missing ENTITY_TABLE_NAME environment variable`));
        }
        if (!process.env.AWS_REGION) {
            throw(new Error(`Missing AWS_REGION environment variable`));
        }
        if (!process.env.AWS_ACCESS_KEY_ID) {
            throw(new Error(`Missing AWS_ACCESS_KEY_ID environment variable`));
        }
        if (!process.env.AWS_SECRET_ACCESS_KEY) {
            throw(new Error(`Missing AWS_SECRET_ACCESS_KEY environment variable`));
        }

        TableNames.Entity = process.env.ENTITY_TABLE_NAME;
        const hasTable = await ddbmapper.hasTable(TableNames.Entity);
        if (!hasTable) {
            throw(new Error(`Database does not contain table ${TableNames.Entity}`));
        }

        if(!process.env.INBOUND_SQS_QUEUE_URL){
            throw(new Error('Missing INBOUND_SQS_QUEUE_URL environment variable'));
        }

        if(!process.env.OUTBOUND_SQS_QUEUE_NAME){
            throw(new Error('Missing OUTBOUND_SQS_QUEUE_NAME environment variable'));
        }

        /** The core functionality is below 
         * 
         * - Read items from the queue
         * - unique-ify items by converting Array -> Set
         * - send all items to the outbound queue
         * - delete all objects from the inbound queue
        */

        let sqs = new AWS.SQS({apiVersion: '2012-11-05', region: 'us-east-1'});
        const params: AWS.SQS.ReceiveMessageRequest = {
            MaxNumberOfMessages: MAX_SQS_MESSAGES_PER_BATCH,
            //VisibilityTimeout: 20, // default 61 since function timeout is 60
            QueueUrl: process.env.INBOUND_SQS_QUEUE_URL,
            WaitTimeSeconds: 1

        };

        let counter = 0;
        const collections: AWS.SQS.Message[] = [];
        //First read multiple batches until 1k elements are retrieved
        //or the queue is empty
        while(counter < MAX_SQS_BATCHES){
            let tmpArray: AWS.SQS.MessageList = await readFromSQS(sqs, params);
            if(tmpArray.length > 0){
                console.log(`Adding ${tmpArray.length} items to collections list`)
                collections.push.apply(collections, tmpArray);
            }else if(counter > MIN_EMPTY_ITERATIONS){ //just to be sure that is actually empty and it is not an error
                break;
            }
            counter++;
        }

        /** Unique-ify items */
        const uniqueCollectionIds = [...new Set(collections.map(item => item.Body).values())];
        console.log(`Collections received: Total=${collections.length} | Unique=${uniqueCollectionIds.length}`);

        /** Send unique collection ids to outbound SQS queue */
        await sendToQueue(sqs, outboundQueueUrl, uniqueCollectionIds);
        //If we have some items process each one of them and delete it from the queue
        if(collections){
            console.log(`Processing ${collections.length} collections`);
            for (const record of collections){
                const collectionId = record.Body;
                let deleteParams = {
                    QueueUrl: process.env.INBOUND_SQS_QUEUE_URL,
                    ReceiptHandle: record.ReceiptHandle
                };
                await sqs.deleteMessage(deleteParams).promise()
                .then((value) => {}) 
                .catch(() => {
                    throw (new Error("Delete message Error"));
                });
            }
            console.log(`messages deleted!`)
        }
    } catch (err) {
        console.log(err);
    }
};
