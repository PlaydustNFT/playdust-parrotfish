import { Connection } from '@solana/web3.js';

const MAX_BLOCKS_PER_REQUEST =
    Number(process.env.MAX_BLOCKS_PER_REQUEST) 
    || 10000;

export async function getRecentFinalizedBlocks(connection: Connection, lastBlock: number): Promise<[number[], number]> {
    const largestPossibleBlockForRequest = lastBlock+MAX_BLOCKS_PER_REQUEST - 1;
    const currentOnChainBlock = await connection.getSlot();
    // get block to request
    // can never be larger than the current block or more than max number of blocks
    const currentBlockToRequest = Math.min(currentOnChainBlock, largestPossibleBlockForRequest);
    const result = await connection.getBlocks(lastBlock, currentBlockToRequest);
    return [result, currentBlockToRequest];
}
