import { DynamoDBStreamEvent } from 'aws-lambda';
import AWS from 'aws-sdk';
import { TableNames } from '../../shared/src/consts';
import { MarketplaceTransactionEntity } from '../../shared/src/entity/transaction/MarketplaceTransactionEntity';
import { TriggerEntity } from '../../shared/src/entity/TriggerEntity';
import { ddbmapper } from '../../shared/src/service/dynamodb';
import { Entity, MarketplaceTransactionEntityDataWithType } from '../../shared/src/types';
import { processItem } from './processorEntrypoint';
/** Comment to trigger build */

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
type EventType = DynamoDBStreamEvent;
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

        if(!process.env.BIDS_ASKS_QUEUE_NAME){
            throw(new Error('Missing BIDS_ASKS_QUEUE_NAME environment variable'));
        }
        if(!process.env.PRICE_PROCESSOR_QUEUE_NAME){
            throw(new Error('Missing PRICE_PROCESSOR_QUEUE_NAME environment variable'));
        }
        if (!event.Records) {
            throw(new Error(`Trigger event does not contain records`));
        }

        // ready to begin processing data from payload
        const records = event.Records;
        for (const record of records) {
            if (record.eventName == "INSERT" || record.eventName == "MODIFY") {
                const entity = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage) as MarketplaceTransactionEntity;
                await processItem(entity);
            }
        }
    } catch (err) {
        console.error(err);
    }
};
