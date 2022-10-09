import AWS, { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyResult } from 'aws-lambda';
import { getRecentFinalizedBlocks } from './SolanaUtils';
import { Connection } from '@solana/web3.js';
import { fetchConfig, saveConfig } from './ConfigUtils';
import { sendToQueue } from './AwsUtils';

const docClient = new DynamoDB.DocumentClient();

export const RPC_ENDPOINT = 
    String(process.env.RPC_ENDPOINT)
    || 'https://ssc-dao.genesysgo.net/';
export const connection = new Connection(RPC_ENDPOINT);

const sqs = new AWS.SQS({ region: 'us-east-1' });

/**
 *
 * Fetches config from the database, finds new confirmed block numbers and sends them to SQS.
 * Exits if error occurs during each step of the process.
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const lambdaHandler = async (): Promise<APIGatewayProxyResult> => {
    // Fetch config file from DDB
    // Initialize config if it does not exist.
    const config = await fetchConfig(connection, docClient);

    // Fetch new blocks from BC
    const [recentBlocks, currentBlock] = await getRecentFinalizedBlocks(connection, config?.data.latestBlockNumber);

    // Send block numbers to task queue
    await sendToQueue(sqs, process.env.SLOT_QUEUE_URL as string, recentBlocks);

    // Update ingester config
    config.data.latestBlockNumber = currentBlock;

    // Save last confirmed block
    await saveConfig(docClient, config);

    const response: APIGatewayProxyResult = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'hello world',
        }),
    };

    return response;
};
