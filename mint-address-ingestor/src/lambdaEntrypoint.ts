import { APIGatewayProxyEvent, APIGatewayProxyResult, DynamoDBStreamEvent, SQSEvent } from 'aws-lambda';
import { DynamoDBStreams, DynamoDB } from 'aws-sdk';
import { TableNames } from '../../shared/src/consts';
import { ddbmapper } from '../../shared/src/service/dynamodb';
import { processMetadataAddresses } from './app';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

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
        else {
            console.log(`Database connection established`);
        }

        if (!event.Records) {
            throw(new Error(`Trigger event does not contain records`));
        }
        
        // ready to begin processing data from payload
        const records = event.Records;
        let metadataAddresses: string[] = [];
        for (const record of records) {
            metadataAddresses.push(record.body);
        }
        await processMetadataAddresses(metadataAddresses);

    } catch (err) {
        console.log(err);
    }
};
