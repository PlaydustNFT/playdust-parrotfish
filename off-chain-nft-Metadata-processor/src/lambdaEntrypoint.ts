import { DynamoDBStreamEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { TableNames } from '../../shared/src/consts';
import { ddbmapper } from '../../shared/src/service/dynamodb';
import { addOffchainMetadata } from './processorEntrypoint';

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
        
        if (!event.Records) {
            throw(new Error(`Trigger event does not contain records`));
        }
        
        // ready to begin processing data from payload
        const records = event.Records;
        for (const record of records) {
            if (record.eventName == "INSERT" || record.eventName == "MODIFY") {
                const onChainEntity = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
                await addOffchainMetadata(onChainEntity);
            }
        }
    } catch (err) {
        console.log(err);
    }
};
