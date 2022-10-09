import { Connection } from '@solana/web3.js';
import { SQSEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { addBlockTime, extractTransactions, getBlock, saveTransactions, tagTransactions } from './utils';

const docClient = new DynamoDB.DocumentClient();

const LOG_ENABLED =
    Boolean(process.env.LOG_ENABLED)
    || false;
export const RPC_ENDPOINT =
    String(process.env.RPC_ENDPOINT)
    || 'https://ssc-dao.genesysgo.net/';
export const connection = new Connection(RPC_ENDPOINT);

const log = (message: any) => {
    if (LOG_ENABLED) {
        console.log(JSON.stringify(message));
    }
}

export const processRecord = async (record: any) => {
}
/**
 * Function triggers on SQS event that contains Solana blockchain slot(block) number.
 * Once the function is triggered, it fetches block, searches it for transactions of interest,
 * transforms the transactions to their EntityDB representations and then saves them to EntityDB.
 * If an error occurs during any of the steps, lambda exits, message is returned to the SQS and
 * no data is written to EntityDB.
 * @param event SQS Event
 * @returns Response containing status code of the lambda execution.
 */
export const lambdaHandler = async (event: SQSEvent) => {
    const failedMessageIds: string[] = [];

    if (!event.Records) {
        throw (new Error(`Trigger event does not contain records`));
    }

    log(`Number of records: ${event.Records.length}`);
    for (const record of event.Records) {
        try {
            const blockNumber = +record.body;

            console.log('Fetching block ' + blockNumber);
            const block = await getBlock(blockNumber);

            if (block !== undefined) {
                // Filter and tag transactions
                const transactions = addBlockTime(extractTransactions(block), block.blockTime);
                const taggedTransactions = tagTransactions(transactions);

                // Save transactions to DDB
                await saveTransactions(docClient, taggedTransactions);
            } else {
                throw (new Error(`Block ${blockNumber} could not be fetched`));
            }
        } catch (e) {
            console.error(e);
            failedMessageIds.push(record.messageId);
        }
    }
    	
  return {
    // Returns failed items to the queue.
    batchItemFailures: failedMessageIds.map(id => {
      return {
        itemIdentifier: id
      }
    })
  }
};