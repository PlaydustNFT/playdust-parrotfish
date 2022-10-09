import { BlockResponse } from '@solana/web3.js';
import { DynamoDB } from 'aws-sdk';
import { Constants } from './constants';
import { 
    ProgramId, 
    TaggedTransaction, 
    Transaction, 
    TransactionEntity, 
    TransactionWithMeta, 
} from './types';
import axios from 'axios';
import { RPC_ENDPOINT } from './app';

const DDB_BATCH_SIZE = 25;
const type = 'transaction';

function isFailedTransaction(value: any) {
    return !value.meta || value.meta.err;
}

function generateGlobalId(id: string): string {
    return type + '-' + id;
}

function getTransactionSignature(taggedTransaction: TaggedTransaction) {
    return taggedTransaction.transaction.signatures[0];
}

export async function saveTransactions(docClient: DynamoDB.DocumentClient, taggedTransactions: TaggedTransaction[]) {
    const promises = [];
    const transactionEntities: TransactionEntity[] = taggedTransactions.map((taggedTransaction: TaggedTransaction) => {
        const id = getTransactionSignature(taggedTransaction);
        return {
            globalId: generateGlobalId(id),
            id,
            primaryEntity: id,
            type,
            data: taggedTransaction,
            tag: taggedTransaction.tag,
        };
    });
    const requests = transactionEntities.map((trancactionEntity) => {
        return {
            PutRequest: {
                Item: trancactionEntity,
            },
        };
    });
    for (let i = 0; i < taggedTransactions.length; i += DDB_BATCH_SIZE) {
        const params: DynamoDB.DocumentClient.BatchWriteItemInput = {
            RequestItems: {
                [Constants.TABLE_NAME]: requests.slice(i, i + DDB_BATCH_SIZE),
            },
        };
        promises.push(docClient.batchWrite(params).promise());
    }
    await Promise.all(promises);
}

/**
 * Extracts transactions of interest from a block.
 * @param block Solana Block
 * @returns Array of transactions.
 */
export function extractTransactions(block: BlockResponse) {
    const transactions = block.transactions;
    return transactions.filter((transaction) => {
        return !isFailedTransaction(transaction) && transaction.transaction.message.accountKeys.filter(item => 
                (Object.values(ProgramId) as string[]).includes(item.toString())).length > 0;
    });
}

/**
 * Adds block time to the individual transactions
 * @param blockTime Block time from BlockResponse
 * @returns TransactionWithMeta objects enriched with block time
 */
export function addBlockTime(transactions: TransactionWithMeta[], blockTime: number): TransactionWithMeta[] {
    return transactions.map((transaction) => {
        return { ...transaction, blockTime: blockTime};
    });
}

/**
 * Transforms transactions into their EntityDB representations.
 * @param transactions Solana blockchain transactions.
 * @returns EntityDB representations of transactions.
 */
export function tagTransactions(transactions: TransactionWithMeta[]): TaggedTransaction[] {
    return transactions.map((transaction) => {
        /** FIXME: This just takes the first matching program id address */
        let matchingPids = transaction.transaction.message.accountKeys.filter(item => 
                    (Object.values(ProgramId) as string[]).includes(item.toString()));
        if (matchingPids.length <= 0) {
            console.log(`No matcing pids for transaction! ${transaction.transaction.signatures[0]}`);
            return { ...transaction };
        }
        const pid = matchingPids[0].toString();
        return { ...transaction, tag: pid };
    });
}

function getProgramId(transaction: Transaction): string {
    const accountKeys = transaction.message.accountKeys;
    return accountKeys[accountKeys.length - 1].toString();
}

/**
 * Get block from Solana blockchain.
 * @param slot Block number
 * @returns JSON representation of solana blockchain
 */
export async function getBlock(slot: number) {
    const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'getBlock',
        params: [
            slot,
            {
                encoding: 'json',
                transactionDetails: 'full',
                rewards: false,
            },
        ],
    };
    const resp = await axios.post(RPC_ENDPOINT, payload, { headers: { 'content-type': 'application/json' } });
    return resp.data.result;
}
