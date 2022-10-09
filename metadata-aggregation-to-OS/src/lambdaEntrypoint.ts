import { ScheduledEvent, SQSEvent } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { TableNames } from '../../shared/src/consts';
import { ddbmapper } from '../../shared/src/service/dynamodb';
import { processItem } from './processorEntrypoint';

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

const MAX_BATCHES_NUMBER = 150;


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

//trigger build
type EventType = SQSEvent;
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

        if(!process.env.QUEUE_URL){
            throw(new Error('Missing QUEUE_URL environment variable'));
        }
        if (!event.Records) {
            throw(new Error(`SQS event does not contain records`));
        }

        /*
        let sqs = new AWS.SQS({apiVersion: '2012-11-05'});
        const params = {
            MaxNumberOfMessages: 10,
            //VisibilityTimeout: 20, // default 61 since function timeout is 60
            QueueUrl: process.env.QUEUE_URL,
            WaitTimeSeconds: 1
        };

        let counter = 0;
        let mintAddresses:  AWS.SQS.MessageList = [];
        //First read multiple batches until 1k elements are retrieved
        //or the queue is empty
        while(counter < MAX_BATCHES_NUMBER){
            let tmpArray: AWS.SQS.MessageList = await readFromSQS(sqs, params);
            if(tmpArray.length > 0){
                for(const record of tmpArray){
                    mintAddresses.push(record);
                }
            }else if(counter > 5){ //just to be sure that is actually empty and it is not an error
                break;
            }
            counter++;
        }
        // while(counter < MAX_BATCHES_NUMBER){
        //     const result = await readFromSQS(sqs, params);
            
        //     counter++;
        // }
        if(mintAddresses){
            console.log(mintAddresses.length);
            await processItem(mintAddresses);
            for (const record of mintAddresses){
                let deleteParams = {
                    QueueUrl: process.env.QUEUE_URL,
                    ReceiptHandle: record.ReceiptHandle
                };
                await sqs.deleteMessage(deleteParams).promise()
                .then(() => {})
                .catch(() => {
                    throw (new Error("Delete message Error"));
                })
            }
        }
        */
        const mintAddresses: string[] = [];
        if(event.Records){
            for (const record of event.Records){
                mintAddresses.push(record.body);
                
            }
            await processItem(mintAddresses);
        }

    } catch (err) {
        console.log(err);
    }
};
