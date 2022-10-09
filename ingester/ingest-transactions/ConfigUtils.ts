import { Connection } from '@solana/web3.js';
import { DynamoDB } from 'aws-sdk';
import { Constants } from './Constants';

/**
 * Fetch config from the DDB.
 * If config entry does not exist, create and save it to DDB.
 * @param connection    connection to Solana RPC node
 * @param docClient     document client for DB interaction
 * @returns             config object
 */
export async function fetchConfig(connection: Connection, docClient: DynamoDB.DocumentClient): Promise<IngesterConfig> {
    const params: DynamoDB.DocumentClient.GetItemInput = {
        TableName: Constants.TABLE_NAME,
        Key: {
            globalId: 'transactionIngestion-config',
        },
    };
    const result = await docClient.get(params).promise();
    if (Object.keys(result).length === 0) {
        return await initConfig(connection, docClient);
    }

    return result.Item as IngesterConfig;
}

async function initConfig(connection: Connection, docClient: DynamoDB.DocumentClient) {
    const slot = await connection.getSlot();
    const config: IngesterConfig = {
        globalId: 'transactionIngestion' + '-' + 'config',
        type: 'config',
        id: 'transactionIngestion',
        data: {
            startBlockNumber: slot,
            latestBlockNumber: slot,
        },
    };
    await saveConfig(docClient, config);
    return config;
}

export async function saveConfig(docClient: DynamoDB.DocumentClient, config: IngesterConfig) {
    const params: DynamoDB.DocumentClient.PutItemInput = {
        TableName: Constants.TABLE_NAME,
        Item: config,
    };
    await docClient.put(params).promise();
}

export interface IngesterConfig {
    globalId: string;
    type: string;
    id: string;
    data: {
        startBlockNumber: number;
        latestBlockNumber: number;
    };
}
