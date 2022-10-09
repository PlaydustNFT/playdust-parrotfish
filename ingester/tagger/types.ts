import { ConfirmedTransactionMeta, Message } from "@solana/web3.js";

export enum ProgramId {
    MeProgramId = 'MEisE1HzehtrDpAAT8PnLHjpSSkRYakotTuJRPjTpo8',
    MeV2ProgramId = 'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K',
    TokenMetadataProgram = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
}

/**
 * Transaction with metadata and tag.
 */
export interface TaggedTransaction extends TransactionWithMeta {
    tag?: string;
}

/**
 * Transaction with metadata.
 */
export interface TransactionWithMeta {
    /** The transaction */
    transaction: Transaction;
    /** Metadata produced from the transaction */
    meta: ConfirmedTransactionMeta | null;
    /** BlockTime from BlockResponse */
    blockTime?: number;
}

/**
 * Transaction from Metaplex Library
 */
export interface Transaction {
    /** The transaction message */
    message: Message;
    /** The transaction signatures */
    signatures: string[];
}

/**
 * Interface representing Transaction in EntityDB
 */
export interface TransactionEntity {
    globalId: string;
    id: string;
    primaryEntity: string;
    type: 'transaction';
    data: TaggedTransaction;
}
