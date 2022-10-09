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
import { ddbmapper } from '../../shared/src/service/dynamodb'
import { EntityType, MarketplaceInstructionType, ParseableTransaction } from '../../shared/src/types'
import { ParserConstants } from '../../shared/src/consts'
import { createMarketData4CollectionObjects, getCollectionIds } from '../../shared/src/util'
import { CompiledInstruction } from '@solana/web3.js'

/** Comment to trigger build from changed shared code */
const MAGIC_EDEN_TRANSACTION_ID = "M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K";

export const processItem = async (tx: any) => {
    // Processing transaction
    const parseableTransaction: ParseableTransaction = new ParseableTransaction(tx);
    const mintToCollectionIds = new Map<string, string[]>();
    /** 
     * First, find mint address for all ExecuteSale instructions
     * 
     * We will find CollectionId for these mint addresses
     * 
     * These will be used to generate MarketData4Collection Entity objects
     */
    const instructionsToParse: CompiledInstruction[] = [];
    for (const ix of parseableTransaction.Instructions) {
        const programId = parseableTransaction.Message.accountKeys[ix.programIdIndex].toString();
        if (programId !== MAGIC_EDEN_TRANSACTION_ID) {
            console.log(`Instruction does not come from MagicEden program - skipping! programId=${programId}`);
            continue;
        }

        instructionsToParse.push(ix);
        const ixType: MarketplaceInstructionType = label(ix);
        if (ixType == MarketplaceInstructionType.ExecuteSale) {
            const tokenMintAddress = parseableTransaction.Message.accountKeys[
                                        ix.accounts[
                                            ParserConstants.Solana.MagicEden.v2.ExecuteSale.AccountKeyIndex.Mint
                                        ]
                                    ].toString();
            if (!mintToCollectionIds.get(tokenMintAddress)) {
                mintToCollectionIds.set(tokenMintAddress, []);
            }
        }
    }
    for (let [mint, collectionIds] of mintToCollectionIds) {
        collectionIds = await getCollectionIds(mint);
        mintToCollectionIds.set(mint, collectionIds);
    }
    const promises = [];
    for (const ix of instructionsToParse) {
        const ixType: MarketplaceInstructionType = label(ix);
        // Processing transaction instruction
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
                const primaryEntity = new AskTransactionEntity();
                primaryEntity.populate(order, order.signature);
                promises.push(ddbmapper.update(primaryEntity));
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
                const primaryEntity = new BidTransactionEntity();
                primaryEntity.populate(order, order.signature);
                promises.push(ddbmapper.update(primaryEntity));
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
                const primaryEntity = new CancelAskTransactionEntity();
                primaryEntity.populate(order, order.signature);
                promises.push(ddbmapper.update(primaryEntity));
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
                const primaryEntity = new CancelBidTransactionEntity();
                primaryEntity.populate(order, order.signature);
                promises.push(ddbmapper.update(primaryEntity));
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
                const primaryEntity = new ExecuteSaleTransactionEntity();
                primaryEntity.populate(order, order.signature);
                promises.push(ddbmapper.update(primaryEntity));
                /** For each collection in mintToCollectionIds, create a MarketData4Collection! */
                const collectionIds = mintToCollectionIds.get(order.tokenMintAccount);
                const md4Collections = createMarketData4CollectionObjects({ globalId: primaryEntity.globalId, type: EntityType.ExecuteSaleTransaction } , collectionIds);
                for (const md of md4Collections) {
                    promises.push(ddbmapper.update(md));
                }
                break;
            }
        }
    }
    await Promise.all(promises);
}
