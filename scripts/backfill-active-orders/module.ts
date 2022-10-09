import { ddbmapper } from '../../shared/src/service/dynamodb'
import { EntityType, Marketplace } from '../../shared/src/types'
import { createInterface } from "readline";
import { createReadStream } from 'fs';

import { createMarketData4CollectionObjects, getCollectionIds, } from '../../shared/src/util';
import {
    fetchLatestActionsForMintByWallet,
    Action,
    ActionType
} from '../util/fetchEntities'
import { BidOrderStateEntity } from "../../shared/src/entity/order_state/BidOrderStateEntity";
import { AskOrderStateEntity } from "../../shared/src/entity/order_state/AskOrderStateEntity";
import { IndexNames } from '../../shared/src/consts';

export const processActiveOrders = async (mints: string[]) => {
    const promises = [];
    for (const mint of mints) {
        promises.push(calculateAndCreateActiveOrderState(mint));
    }
    await Promise.all(promises);
}

export const calculateAndCreateActiveOrderState = async (mint: string) => {
    /** now I need to get alllllll transactions, this ones gonna be expensive! */
    const actions: Map<string, Action> = await fetchLatestActionsForMintByWallet(mint);
    const promises = [];
    for (const [wallet, walletAction] of actions) {
        let active = false; // more cases end up "false" than "true" in the below logic, so makes sense to default false
        switch (walletAction.type) {
            case ActionType.Ask:
                active = true;
            case ActionType.Sell:
            case ActionType.CancelAsk: {
                const dbobj = new AskOrderStateEntity();
                dbobj.populate({
                    active: active,
                    price: walletAction.price,
                    marketplace: Marketplace.MagicEdenV2, 
                    blockTime: walletAction.blockTime,
                    signature: walletAction.signature,
                }, mint, wallet);
                if (active) {
                    let collectionIds: string[] = await getCollectionIds(mint);
                    /** Create md4 collection objects for active asks */
                    for (const md of createMarketData4CollectionObjects({ globalId: dbobj.globalId, type: EntityType.AskOrderState }, collectionIds)) {
                        promises.push(ddbmapper.update(md));
                    }
                }
                //console.log(`Action Type: ${walletAction.type} | obj: ${JSON.stringify(dbobj)}`);
                promises.push(ddbmapper.put(dbobj));
                break;
            }
            case ActionType.Bid:
                active = true;
            case ActionType.Buy:
            case ActionType.CancelBid: {
                const dbobj = new BidOrderStateEntity();
                dbobj.populate({
                    active: active,
                    price: walletAction.price,
                    marketplace: Marketplace.MagicEdenV2, 
                    blockTime: walletAction.blockTime,
                    signature: walletAction.signature,
                }, mint, wallet);
                if (active) {
                    let collectionIds: string[] = await getCollectionIds(mint);
                    /** Create md4 collection objects for active asks */
                    for (const md of createMarketData4CollectionObjects({ globalId: dbobj.globalId, type: EntityType.BidOrderState }, collectionIds)) {
                        promises.push(ddbmapper.update(md));
                    }
                }
                //console.log(`Action Type: ${walletAction.type} | obj: ${JSON.stringify(dbobj)}`)
                promises.push(ddbmapper.put(dbobj));
                break;
            }
        }
    }
    await Promise.all(promises);
}