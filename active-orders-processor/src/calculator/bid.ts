import { BidOrderStateEntity } from "../../../shared/src/entity/order_state/BidOrderStateEntity";
import { EntityType, MarketplaceTransactionEntityDataWithType, OrderStateEntityData } from "../../../shared/src/types";

export const createBidOrderStateEntity = (data: MarketplaceTransactionEntityDataWithType): BidOrderStateEntity => {
  const orderStateData: OrderStateEntityData = new OrderStateEntityData();
  orderStateData.active = data.type == EntityType.BidTransaction;
  orderStateData.blockTime = data.created;
  orderStateData.marketplace = data.marketplace;
  orderStateData.price = data.price;
  orderStateData.signature = data.signature;

  const entity: BidOrderStateEntity = new BidOrderStateEntity();
  entity.populate(orderStateData, data.tokenMintAccount.toString(), data.buyerWalletAccount.toString());
  return entity;
};

/**
 * 
 * Precondition:
 * tx.type must be within { BidTransaction, CancelBidTransaction, ExecuteSaleTransaction }, otherwise throws
 * 
 * Calculates update to the OrderEntity for the buyer wallet, token mint & marketplace
 * 
 * @param tx 
 * @param current 
 * @returns true if updated, otherwise returns false
 */
export const updateBidOrderStateEntity = (update: MarketplaceTransactionEntityDataWithType, current: BidOrderStateEntity): boolean => {
  console.log(`BID|UPDATE|newBlockTime=${update.created}|currentBlockTime=${current.data.blockTime}|newSignature=${update.signature}|currentSignature=${current.data.signature}`);
  if (current.data.blockTime > update.created) {
    // don't update entity if transaction is outdated
    return false;
  }
  else if (current.data.blockTime == update.created && update.type != EntityType.ExecuteSaleTransaction) {
    console.log(`BID|UPDATE|SKIP_NOT_EXECUTE_SALE|newData.type=${update.type}`);
    return false;
  }

  console.log(`BID|compare marketplace, account, mint`);
  if (current.data.marketplace != update.marketplace
      || current.id !== update.buyerWalletAccount.toString()
      || current.primaryEntity !== update.tokenMintAccount.toString()
    ) {
    // only update entity if the marketplace, buyer wallet & token mint all align
    return false;
  }

  console.log(`SWITCH|data.type=${update.type}`);
  switch (update.type) {
    case EntityType.BidTransaction: {
      console.log(`BID|data=${JSON.stringify(update)}`);
      current.data.active = true;
      current.data.blockTime = update.created;
      current.data.signature = update.signature;
      current.data.price = update.price;
      current.updatedAt = new Date();
      break;
    }
    case EntityType.CancelBidTransaction:
      console.log(`CANCEL_BID|data=${JSON.stringify(update)}`);
    case EntityType.ExecuteSaleTransaction: {
      console.log(`EXECUTE_SALE|data=${JSON.stringify(update)}`);
      current.data.active = false;
      current.data.blockTime = update.created;
      current.data.signature = update.signature;
      current.data.price = update.price;
      current.updatedAt = new Date();
      break;
    }
    case EntityType.AskTransaction:
    case EntityType.CancelAskTransaction:
    default:
      throw (new Error(`Unsupported type for updateAskEntity: ${update.type}`));
      return false;
  }
  return true;
};