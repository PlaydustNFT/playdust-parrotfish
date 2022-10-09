import { AskTransactionEntity } from '../../shared/src/entity/transaction/AskTransactionEntity'
import { BidTransactionEntity } from '../../shared/src/entity/transaction/BidTransactionEntity'
import { CancelAskTransactionEntity } from '../../shared/src/entity/transaction/CancelAskTransactionEntity'
import { CancelBidTransactionEntity } from '../../shared/src/entity/transaction/CancelBidTransactionEntity'
import { ExecuteSaleTransactionEntity } from '../../shared/src/entity/transaction/ExecuteSaleTransactionEntity'
import { label } from './instruction/label'
import { normalizeAsk } from './instruction/parser/ask'
import { normalizeBid } from './instruction/parser/bid'
import { normalizeCancelAsk } from './instruction/parser/cancelAsk'
import { normalizeCancelBid } from './instruction/parser/cancelBid'
import { normalizeExecuteSale } from './instruction/parser/executeSale'
import {  MarketplaceInstructionType, MarketplaceTransactionEntityData, ParseableTransaction, Entity } from '../../shared/src/types'
import { writeFile } from 'fs';

/** A few additional features added during backfilling */
const ME_V2_PROGRAM_ID = 'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K';
const PROCESSOR_EXCEPTION_FILE_PATH = process.env.PROCESSOR_EXCEPTION_FILE_PATH || '/home/ubuntu/files/processor_exception.log';
const ON_CHAIN_FAILURES_LOG = process.env.ON_CHAIN_FAILURES_LOG || '/home/ubuntu/repos/matt/playdust-parrotfish/scripts/reconcile-signatures/files/on_chain_failures_list.log';
const CURRENT_SIGNATURES_LOG = process.env.CURRENT_SIGNATURES_LOG || '/home/ubuntu/repos/matt/playdust-parrotfish/scripts/reconcile-signatures/files/current_signatures_list.log';

/** Notes regarding backfilling
 * 
 * - This process no longer looks up the collectionIds for the mint address 
 * - As a result, it doesn't create the `marketdata4Collection` objects (required downstream)
 * - Also, the marketplaceTransaction4Wallet & marketplaceTransaction4NFT are no longer created
 */
export const processItem = (tx: any) => {
    /** 
     * First, find mint address for all ExecuteSale instructions
     * 
     * We will find CollectionId for these mint addresses
     * 
     * These will be used to generate MarketData4Collection Entity objects
     */
    const entityList: Entity[] = [];
    try {
        //console.log(`Processing transaction: ${JSON.stringify(tx)}`);
        if (!tx || !tx.meta) {
            console.log(`Skipping transaction: ${JSON.stringify(tx)}`);
            return;
        }
        if (tx.meta.err) {
            console.log(`Failed transaction: ${JSON.stringify(tx)}`);
            const txSignature = tx.transaction.signatures[0] + '\r\n';
            writeFile(ON_CHAIN_FAILURES_LOG, txSignature, {flag: 'a+'}, err => {
                if (err) {
                    console.error(`Failed to write file: ${JSON.stringify(err)}`);
                    return;
                }
            })
            return;
        }
        const parseableTransaction: ParseableTransaction = new ParseableTransaction(tx);
        /** If any step of processing fails, catch the exception & log this to the errors file! */
        for (const ix of parseableTransaction.Instructions) {
            const programId = parseableTransaction.Message.accountKeys[ix.programIdIndex].toString();
            if (programId !== ME_V2_PROGRAM_ID) {
                console.log(`Skipping instruction from non-ME-v2 program...`);
                continue;
            }
        }
        const txSignature = tx.transaction.signatures[0] + '\r\n';
        writeFile(CURRENT_SIGNATURES_LOG, txSignature, {flag: 'a+'}, err => {
            if (err) {
                console.error(`Failed to write file: ${JSON.stringify(err)}`);
                return;
            }
        })
        for (const ix of parseableTransaction.Instructions) {
            const programId = parseableTransaction.Message.accountKeys[ix.programIdIndex].toString();
            if (programId !== ME_V2_PROGRAM_ID) {
                console.log(`Failed to parse instruction from non-ME-v2 program. Skipping instruction.`);
                continue;
            }
            const ixType: MarketplaceInstructionType = label(ix);
            //console.log(`Processing transaction instruction: ${JSON.stringify(ix)}`);
            switch (ixType) {
                // TODO: this code is repetitive; ideally we can encapsulate it somehow, but think about it later
                case MarketplaceInstructionType.Ask: {
                    const order = normalizeAsk(
                                    ix, 
                                    parseableTransaction.Message.accountKeys,
                                    MarketplaceInstructionType.Ask,
                                    parseableTransaction.BlockTime,
                                    parseableTransaction.Signature
                                );
                    //console.log(`Order: ${JSON.stringify(order)}`);
                    const primaryEntity = new AskTransactionEntity();
                    primaryEntity.populate(order, order.signature);
                    //console.log(`PrimaryEntity: ${JSON.stringify(primaryEntity)}`);
                    entityList.push(primaryEntity);
                    break;
                }
                case MarketplaceInstructionType.Bid: {
                    const order = normalizeBid(
                                    ix, 
                                    parseableTransaction.Message.accountKeys,
                                    MarketplaceInstructionType.Bid,
                                    parseableTransaction.BlockTime,
                                    parseableTransaction.Signature
                                );
                    //console.log(`Order: ${JSON.stringify(order)}`);
                    const primaryEntity = new BidTransactionEntity();
                    primaryEntity.populate(order, order.signature);
                    //console.log(`PrimaryEntity: ${JSON.stringify(primaryEntity)}`);
                    /** Lets just create promises, and await them at the end of execution */
                    entityList.push(primaryEntity);
                    break;
                }
                case MarketplaceInstructionType.CancelAsk: {
                    const order = normalizeCancelAsk(
                                    ix, 
                                    parseableTransaction.Message.accountKeys,
                                    MarketplaceInstructionType.CancelAsk,
                                    parseableTransaction.BlockTime,
                                    parseableTransaction.Signature
                                );
                    //console.log(`Order: ${JSON.stringify(order)}`);
                    const primaryEntity = new CancelAskTransactionEntity();
                    primaryEntity.populate(order, order.signature);
                    //console.log(`PrimaryEntity: ${JSON.stringify(primaryEntity)}`);
                    entityList.push(primaryEntity);
                    break;
                }
                case MarketplaceInstructionType.CancelBid: {
                    const order = normalizeCancelBid(
                                    ix, 
                                    parseableTransaction.Message.accountKeys,
                                    MarketplaceInstructionType.CancelBid,
                                    parseableTransaction.BlockTime,
                                    parseableTransaction.Signature
                                );
                    //console.log(`Order: ${JSON.stringify(order)}`);
                    const primaryEntity = new CancelBidTransactionEntity();
                    primaryEntity.populate(order, order.signature);
                    //console.log(`PrimaryEntity: ${JSON.stringify(primaryEntity)}`);
                    entityList.push(primaryEntity);
                    break;
                }
                case MarketplaceInstructionType.ExecuteSale: {
                    const order = normalizeExecuteSale(
                                    ix, 
                                    parseableTransaction.Message.accountKeys,
                                    MarketplaceInstructionType.ExecuteSale,
                                    parseableTransaction.BlockTime,
                                    parseableTransaction.Signature
                                );
                    //console.log(`Order: ${JSON.stringify(order)}`);
                    const primaryEntity = new ExecuteSaleTransactionEntity();
                    primaryEntity.populate(order, order.signature);
                    //console.log(`PrimaryEntity: ${JSON.stringify(primaryEntity)}`);

                    entityList.push(primaryEntity);
                    break;
                }
            }
        }
    } catch (err) {
        let txSignature = '';
        if (tx?.transaction?.signatures[0]) {
            txSignature = tx.transaction.signatures[0];
        }
        const errorMessage = `Unable to properly process transaction! error: ${JSON.stringify(err)}; signature=${txSignature} \r\n`;
        console.log(errorMessage);
        writeFile(PROCESSOR_EXCEPTION_FILE_PATH, errorMessage, {flag: 'a+'}, err => {
            if (err) {
                console.error(`Failed to write file: ${JSON.stringify(err)}`);
                return;
            }
        })
    }
    return entityList;
    console.log(`All promises complete!`);

}
