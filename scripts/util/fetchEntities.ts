import { ddbmapper } from '../../shared/src/service/dynamodb'
import { BidTransactionEntity } from '../../shared/src/entity/transaction/BidTransactionEntity'
import { AskTransactionEntity } from '../../shared/src/entity/transaction/AskTransactionEntity'
import { CancelBidTransactionEntity } from '../../shared/src/entity/transaction/CancelBidTransactionEntity'
import { CancelAskTransactionEntity } from '../../shared/src/entity/transaction/CancelAskTransactionEntity'
import { ExecuteSaleTransactionEntity } from '../../shared/src/entity/transaction/ExecuteSaleTransactionEntity'
import { EntityType, Marketplace, MintEntityData } from '../../shared/src/types'
import { IndexNames } from '../../shared/src/consts'
import { MarketData4CollectionEntity } from '../../shared/src/entity/MarketData4CollectionEntity'
import { createMarketData4CollectionObjects, getCollectionIds, } from '../../shared/src/util';
import { extractWalletFromToken } from '../../shared/src/util'
import { stringify } from 'querystring'
import { groupBy } from '../../shared/src/util/collection'
import { group } from 'console'
import { AskOrderStateEntity } from '../../shared/src/entity/order_state/AskOrderStateEntity'
import { BidOrderStateEntity } from '../../shared/src/entity/order_state/BidOrderStateEntity'

export const fetchAskTransactionSignaturesFromDatabase = async () => {
    const signatures = [];
    /** Asks */
    console.log(`Requesting ASKs from DB`);
    for await (const item of ddbmapper.query( AskTransactionEntity, 
        { type: EntityType.AskTransaction }, 
        { indexName: IndexNames.EntityDb.typeIndex }
        /** Try to add projection here */
    )) {
        signatures.push(item.id);
    }
    console.log(`Fetch complete! Got ${signatures.length} Asks`);
    return signatures;
};

export const fetchCancelAskTransactionSignaturesFromDatabase = async () => {
    const signatures = [];
    console.log(`Requesting CANCEL ASKs from DB`);
    /** Cancel asks */
    for await (const item of ddbmapper.query( CancelAskTransactionEntity, 
        { type: EntityType.CancelAskTransaction }, 
        { indexName: IndexNames.EntityDb.typeIndex }
        /** Try to add projection here */
    )) {
        signatures.push(item.id);
    }
    console.log(`Fetch complete! Got ${signatures.length} Cancel Asks`);
    return signatures;
};

export const fetchBidTransactionSignaturesFromDatabase = async () => {
    const signatures = [];
    console.log(`Requesting BIDs from DB`);
    /** Bids */
    for await (const item of ddbmapper.query( BidTransactionEntity, 
        { type: EntityType.BidTransaction }, 
        { indexName: IndexNames.EntityDb.typeIndex }
        /** Try to add projection here */
    )) {
        signatures.push(item.id);
    }
    console.log(`Fetch complete! Got ${signatures.length} Bids`);
    return signatures;
};

export const fetchCancelBidTransactionSignaturesFromDatabase = async () => {
    const signatures = [];
    console.log(`Requesting CANCEL BIDs from DB`);
    /** Cancel bids */
    for await (const item of ddbmapper.query( CancelBidTransactionEntity, 
        { type: EntityType.CancelBidTransaction }, 
        { indexName: IndexNames.EntityDb.typeIndex }
        /** Try to add projection here */
    )) {
        signatures.push(item.id);
    }
    console.log(`Fetch complete! Got ${signatures.length} Cancel Bids`);
    return signatures;
};

export const fetchExecuteSaleTransactionSignaturesFromDatabase = async () => {
    const signatures = [];
    console.log(`Requesting EXECUTE SALEs from DB`);
    /** Execute sales */
    for await (const item of ddbmapper.query( ExecuteSaleTransactionEntity, 
        { type: EntityType.ExecuteSaleTransaction }, 
        { indexName: IndexNames.EntityDb.typeIndex }
        /** Try to add projection here */
    )) {
        signatures.push(item.id);
    }
    console.log(`Fetch complete! Got ${signatures.length} Execute Sales`);
    return signatures;
};

/** TODO clean up this signature / method */
export const fetchExecuteSaleTransactionEntitiesFromDatabaseForMarketData = async (): Promise<any[]> => {
    const executeSales = [];
    /** Execute sales */
    for await (const item of ddbmapper.query( ExecuteSaleTransactionEntity, 
        { type: EntityType.ExecuteSaleTransaction }, 
        { indexName: IndexNames.EntityDb.typeIndex }
        /** Try to add projection here */
    )) {
        executeSales.push(item);
    }
    return executeSales;
}

export const enum ActionType {
    Ask,
    Bid,
    CancelAsk,
    CancelBid,
    Buy,
    Sell,
};

export interface Action {
    txType: EntityType;
    type: ActionType;
    mint: string;
    price?: number;
    blockTime?: number;
    signature?: string;
    wallet?: string;
};


export const fetchLatestActionsForMintByWallet = async (mint: string): Promise<any> => {
    /**  */
    const actions: Action[] = [];
    //console.log(`Fetching bids for mint: ${mint}`);
    for await (const item of ddbmapper.query( BidTransactionEntity, 
        { 
            type: EntityType.BidTransaction,
            primaryEntity: mint,
        }, 
        { indexName: IndexNames.EntityDb.typePrimaryEntityIndex }
        /** Try to add projection here */
    )) {
        actions.push({
            txType: EntityType.BidTransaction,
            type: ActionType.Bid,
            mint: item.data.tokenMintAccount,
            price: item.data.price,
            blockTime: item.data.created,
            signature: item.id,
            wallet: item.data.buyerWalletAccount
        });
    }
    //console.log(`Fetched all bids. Now fetching cancel bids. Current size: ${actions.length}`);

    for await (const item of ddbmapper.query( CancelBidTransactionEntity, 
        { 
            type: EntityType.CancelBidTransaction,
            primaryEntity: mint,
        }, 
        { indexName: IndexNames.EntityDb.typePrimaryEntityIndex }
        /** Try to add projection here */
    )) {
        actions.push({
            txType: EntityType.CancelBidTransaction,
            type: ActionType.CancelBid,
            mint: item.data.tokenMintAccount,
            price: item.data.price,
            blockTime: item.data.created,
            signature: item.id,
            wallet: item.data.buyerWalletAccount
        });
    }

    //console.log(`Fetched all cancel bids. Now fetching asks. Current size: ${actions.length}`);
    for await (const item of ddbmapper.query( AskTransactionEntity, 
        { 
            type: EntityType.AskTransaction,
            primaryEntity: mint,
        }, 
        { indexName: IndexNames.EntityDb.typePrimaryEntityIndex }
        /** Try to add projection here */
    )) {
        actions.push({
            txType: EntityType.AskTransaction,
            type: ActionType.Ask,
            mint: item.data.tokenMintAccount,
            price: item.data.price,
            blockTime: item.data.created,
            signature: item.id,
            wallet: item.data.sellerWalletAccount
        });
    }

    //console.log(`Fetched all asks. Now fetching cancel asks. Current size: ${actions.length}`);
    for await (const item of ddbmapper.query( CancelAskTransactionEntity, 
        { 
            type: EntityType.CancelAskTransaction,
            primaryEntity: mint,
        }, 
        { indexName: IndexNames.EntityDb.typePrimaryEntityIndex }
        /** Try to add projection here */
    )) {
        actions.push({
            txType: EntityType.CancelAskTransaction,
            type: ActionType.CancelAsk,
            mint: item.data.tokenMintAccount,
            price: item.data.price,
            blockTime: item.data.created,
            signature: item.id,
            wallet: item.data.sellerWalletAccount
        });
    }

    const sales = [];
    //console.log(`Fetched all cancel asks. Now fetching execute sales. Current size: ${actions.length}`);
    for await (const item of ddbmapper.query( ExecuteSaleTransactionEntity, 
        { 
            type: EntityType.ExecuteSaleTransaction,
            primaryEntity: mint,
        }, 
        { indexName: IndexNames.EntityDb.typePrimaryEntityIndex }
        /** Try to add projection here */
    )) {
        actions.push({
            txType: EntityType.ExecuteSaleTransaction,
            type: ActionType.Sell,
            mint: item.data.tokenMintAccount,
            price: item.data.price,
            blockTime: item.data.created,
            signature: item.id,
            wallet: item.data.sellerWalletAccount
        });
        actions.push({
            txType: EntityType.ExecuteSaleTransaction,
            type: ActionType.Buy,
            mint: item.data.tokenMintAccount,
            price: item.data.price,
            blockTime: item.data.created,
            signature: item.id,
            wallet: item.data.buyerWalletAccount
        });
	sales.push(item.globalId);
    }

    //console.log(`Fetched all execute sales. Current size: ${actions.length}`);

    const promises = [];
    for await (let item of ddbmapper.query(AskOrderStateEntity, 
        { 
            type: EntityType.AskOrderState,
            primaryEntity: mint,
        }, 
        { indexName: IndexNames.EntityDb.typePrimaryEntityIndex }
        /** Try to add projection here */
    )) {
        // set the order state to false
        if (!item.data.active) {
            continue;
        }
        item.data.active = false;
        promises.push(ddbmapper.update(item));
    }
    for await (let item of ddbmapper.query(BidOrderStateEntity, 
        { 
            type: EntityType.BidOrderState,
            primaryEntity: mint,
        }, 
        { indexName: IndexNames.EntityDb.typePrimaryEntityIndex }
        /** Try to add projection here */
    )) {
        // set the order state to false
        if (!item.data.active) {
            continue;
        }
        item.data.active = false;
        promises.push(ddbmapper.update(item));
    }
    const collectionIds = await getCollectionIds(mint);
    //console.log(`Got collection ids for mint: ${JSON.stringify(collectionIds)}`);
    //console.log(`Processing [${sales.length}] sales for mint`);
    for (const sale of sales) {
        //console.log(`Processing sale for mint: ${JSON.stringify(sale)}`);
        /** create md4 collection for each sale + collection combo! */
        const md4Collections = createMarketData4CollectionObjects({ globalId: sale, type: EntityType.ExecuteSaleTransaction }, collectionIds);
        for (const md of md4Collections) {
            //console.log(`Writing object to the db: ${JSON.stringify(md)}`);
            promises.push(ddbmapper.update(md));
        }
    }
    //console.log(`Waiting for md promises to complete...`);
    await Promise.all(promises);

    let mintGroupedActions = groupBy(actions, 'mint');
    const mintGroupedActionsMap = new Map(Object.entries(mintGroupedActions));

    //console.log(`Grouped all actions by mint!`);
    type Wallet = string;
    const latestActions = new Map<Wallet, Action>();
    const walletGroupedActions = groupBy(actions, 'wallet');
    const walletGroupedActionsMap: Map<string, Action[]> = new Map(Object.entries(walletGroupedActions));

    //console.log(`Grouped all mint actions by wallet!`);

    for (const [wallet, walletActions] of walletGroupedActionsMap) {
        if (walletActions.length <= 0) {
            continue;
        }
        //console.log(`Wallet Actions: ${JSON.stringify(walletActions)}`);
        /** Sort in descending order */
        const sortedWalletActions = walletActions.sort((a,b) => (a.blockTime < b.blockTime) ? 1 : -1);
        let latestAction = sortedWalletActions[0];
        for (const a of sortedWalletActions) {
            if (a.blockTime != latestAction.blockTime) {
                break;
            }
            if (a.txType == EntityType.ExecuteSaleTransaction) {
                latestAction = a;
                break;
            }
        }
        latestActions.set(wallet, latestAction);
    }

    return latestActions;
}

export const fetchMD4CollectionEntitiesFromDatabase = async (): Promise<MarketData4CollectionEntity[]> => {
    const md4Collection = [];
    /** md4 collection */
    for await (const item of ddbmapper.query( MarketData4CollectionEntity, 
        { type: EntityType.MarketData4Collection }, 
        { indexName: IndexNames.EntityDb.typeIndex }
        /** Try to add projection here */
    )) {
        md4Collection.push(item);
    }
    return md4Collection;
}
