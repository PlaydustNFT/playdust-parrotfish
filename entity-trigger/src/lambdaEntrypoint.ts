import { DynamoDBStreamEvent } from 'aws-lambda';
import AWS from 'aws-sdk';
import { handleEntityWrite } from './utils';
import { TableNames } from '../../shared/src/consts';
import { ddbmapper } from '../../shared/src/service/dynamodb';
import { Entity } from '../../shared/src/types';

/**
 * Lambda handler for the module.
 * Refer to the README.md for the further explanation.
 * @param event emitted by dynamodb upon writing a new entity
 */
export const lambdaHandler = async (event: DynamoDBStreamEvent) => {
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
        console.log(JSON.stringify(records));
        for (const record of records) {
            if (record.eventName == "INSERT" || record.eventName == "MODIFY") {
                console.log(record.dynamodb.NewImage);
                const entity: Entity = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage) as Entity;
                await handleEntityWrite(entity);
            }
        }
    } catch (e) {
       console.log(e); 
    }
};
