import { 
  entities,
  entitiesIndex,
  generateExpectedGlobalId,
  StaticValues,
} from '../staticData'

import { createBidOrderStateEntity, updateBidOrderStateEntity } from '../../src/calculator/bid'

import { EntityType, Marketplace } from '../../../shared/src/types';
import { BidOrderStateEntity } from '../../../shared/src/entity/order_state/BidOrderStateEntity';

describe("Verify active bid entity creation", () => {
  /**
   * Steps:
   * - pass bid tx entity to createBidEntity
   * - validate values of the OrderEntity returned
   *  - type
   *  - blockchain address
   *  - id == wallet
   *  - global id == expected value
   *  - data { active state, price, marketplace, block time, signature }
   */
  const tx = entities[entitiesIndex.Bid[0]];
  const orderEntity: BidOrderStateEntity = createBidOrderStateEntity({ ...tx.data, type: EntityType.BidTransaction});
  const expectedGlobalId = generateExpectedGlobalId(EntityType.BidOrderState, tx.data.buyerWalletAccount, tx.data.tokenMintAccount, tx.data.marketplace);
  it('Verify type', () => {
    expect(orderEntity.type).toBe(EntityType.BidOrderState);
  });
  it('Verify blockchain address', () => {
    expect(orderEntity.primaryEntity).toStrictEqual(tx.data.tokenMintAccount.toString());
  });
  it('Verify id', () => {
    expect(orderEntity.id).toStrictEqual(tx.data.buyerWalletAccount.toString());
  });
  it('Verify global id', () => {
    expect(orderEntity.globalId).toStrictEqual(expectedGlobalId);
  });
  it('Verify active state', () => {
    expect(orderEntity.data.active).toBe(true);
  });
  it('Verify price', () => {
    expect(orderEntity.data.price).toBe(StaticValues.prices.bid[0]);
  });
  it('Verify marketplace', () => {
    expect(orderEntity.data.marketplace).toStrictEqual(Marketplace.MagicEdenV2);
  });
  it('Verify block time', () => {
    expect(orderEntity.data.blockTime).toStrictEqual(tx.data.created);
  });
  it('Verify reference signature', () => {
    expect(orderEntity.data.signature).toBe(StaticValues.signatures.bid[0]);
  });
})

describe("Verify inactive bid entity creation from cancel", () => {
  /**
   * Steps:
   * - pass cancel bid tx entity to createBidEntity
   * - validate values of the OrderEntity returned
   *  - type
   *  - blockchain address
   *  - id == wallet
   *  - global id == expected value
   *  - data { active state, price, marketplace, block time, signature }
   */
  const tx = entities[entitiesIndex.CancelBid[0]];
  const orderEntity: BidOrderStateEntity = createBidOrderStateEntity({ ...tx.data, type: EntityType.CancelBidTransaction});
  const expectedGlobalId = generateExpectedGlobalId(EntityType.BidOrderState, tx.data.buyerWalletAccount, tx.data.tokenMintAccount, tx.data.marketplace);
  it('Verify type', () => {
    expect(orderEntity.type).toBe(EntityType.BidOrderState);
  });
  it('Verify blockchain address', () => {
    expect(orderEntity.primaryEntity).toStrictEqual(tx.data.tokenMintAccount.toString());
  });
  it('Verify id', () => {
    expect(orderEntity.id).toStrictEqual(tx.data.buyerWalletAccount.toString());
  });
  it('Verify global id', () => {
    expect(orderEntity.globalId).toStrictEqual(expectedGlobalId);
  });
  it('Verify active state', () => {
    expect(orderEntity.data.active).toBe(false);
  });
  it('Verify price', () => {
    expect(orderEntity.data.price).toBe(StaticValues.prices.bid[0]);
  });
  it('Verify marketplace', () => {
    expect(orderEntity.data.marketplace).toStrictEqual(Marketplace.MagicEdenV2);
  });
  it('Verify block time', () => {
    expect(orderEntity.data.blockTime).toStrictEqual(tx.data.created);
  });
  it('Verify reference signature', () => {
    expect(orderEntity.data.signature).toBe(StaticValues.signatures.cancelBid[0]);
  });
})

describe("Verify inactive bid entity creation from execute sale", () => {
  /**
   * Steps:
   * - pass cancel bid tx entity to createBidEntity
   * - validate values of the OrderEntity returned
   *  - type
   *  - blockchain address
   *  - id == wallet
   *  - global id == expected value
   *  - data { active state, price, marketplace, block time, signature }
   */
  const tx = entities[entitiesIndex.ExecuteSale[0]];
  const orderEntity: BidOrderStateEntity = createBidOrderStateEntity({ ...tx.data, type: EntityType.ExecuteSaleTransaction});
  const expectedGlobalId = generateExpectedGlobalId(EntityType.BidOrderState, tx.data.buyerWalletAccount, tx.data.tokenMintAccount, tx.data.marketplace);
  it('Verify type', () => {
    expect(orderEntity.type).toBe(EntityType.BidOrderState);
  });
  it('Verify blockchain address', () => {
    expect(orderEntity.primaryEntity).toStrictEqual(tx.data.tokenMintAccount.toString());
  });
  it('Verify id', () => {
    expect(orderEntity.id).toStrictEqual(tx.data.buyerWalletAccount.toString());
  });
  it('Verify global id', () => {
    expect(orderEntity.globalId).toStrictEqual(expectedGlobalId);
  });
  it('Verify active state', () => {
    expect(orderEntity.data.active).toBe(false);
  });
  it('Verify price', () => {
    expect(orderEntity.data.price).toBe(StaticValues.prices.executeSale[0]);
  });
  it('Verify marketplace', () => {
    expect(orderEntity.data.marketplace).toStrictEqual(Marketplace.MagicEdenV2);
  });
  it('Verify block time', () => {
    expect(orderEntity.data.blockTime).toStrictEqual(tx.data.created);
  });
  it('Verify reference signature', () => {
    expect(orderEntity.data.signature).toBe(StaticValues.signatures.executeSale[0]);
  });
})

describe("Verify active bid entity update to existing active bid", () => {
  /**
   * Steps:
   * - pass bid tx 0 entity to createBidEntity => orderEntity
   * - pass bid tx 1 entity to updateBidEntity with orderEntity
   * - validate 
   *  - returns true
   *  - values of orderEntity
   *   - type
   *   - blockchain address
   *   - id == wallet
   *   - global id == expected value
   *   - data { active == true, price == bid tx 1.price, marketplace, block time == bid tx 1.block time, signature == bid tx 1.signature}
   */
  const bidTx0 = entities[entitiesIndex.Bid[0]];
  const bidTx1 = entities[entitiesIndex.Bid[1]];
  const orderEntity: BidOrderStateEntity = createBidOrderStateEntity({ ...bidTx0.data, type: EntityType.BidTransaction});
  const updated: boolean = updateBidOrderStateEntity({ ...bidTx1.data, type: EntityType.BidTransaction}, orderEntity);
  const expectedGlobalId = generateExpectedGlobalId(EntityType.BidOrderState, bidTx0.data.buyerWalletAccount, bidTx0.data.tokenMintAccount, bidTx0.data.marketplace);
  it('Verify update successful', () => {
    expect(updated).toBe(true);
  });
  it('Verify type', () => {
    expect(orderEntity.type).toBe(EntityType.BidOrderState);
  });
  it('Verify blockchain address', () => {
    expect(orderEntity.primaryEntity).toStrictEqual(bidTx1.data.tokenMintAccount.toString());
  });
  it('Verify id', () => {
    expect(orderEntity.id).toStrictEqual(bidTx1.data.buyerWalletAccount.toString());
  });
  it('Verify global id', () => {
    expect(orderEntity.globalId).toStrictEqual(expectedGlobalId);
  });
  it('Verify active state', () => {
    expect(orderEntity.data.active).toBe(true);
  });
  it('Verify updated price', () => {
    expect(orderEntity.data.price).toBe(StaticValues.prices.bid[1]);
  });
  it('Verify marketplace', () => {
    expect(orderEntity.data.marketplace).toStrictEqual(Marketplace.MagicEdenV2);
  });
  it('Verify updated block time', () => {
    expect(orderEntity.data.blockTime).toStrictEqual(bidTx1.data.created);
  });
  it('Verify updated reference signature', () => {
    expect(orderEntity.data.signature).toBe(StaticValues.signatures.bid[1]);
  });
})

describe("Verify active bid entity update to existing inactive bid", () => {
  /**
   * Steps:
   * - pass cancel bid tx 0 entity to createBidEntity => orderEntity
   * - pass bid tx 1 entity to updateBidEntity with orderEntity
   * - validate 
   *  - returns true
   *  - values of orderEntity
   *   - type
   *   - blockchain address
   *   - id == wallet
   *   - global id == expected value
   *   - data { active == true, price == bid tx 1.price, marketplace, block time == bid tx 1.block time, signature == bid tx 1.signature}
   */
  const cancelBidTx0 = entities[entitiesIndex.CancelBid[0]];
  const bidTx1 = entities[entitiesIndex.Bid[1]];
  const orderEntity: BidOrderStateEntity = createBidOrderStateEntity({ ...cancelBidTx0.data, type: EntityType.CancelBidTransaction});
  const updated: boolean = updateBidOrderStateEntity({ ...bidTx1.data, type: EntityType.BidTransaction}, orderEntity);
  const expectedGlobalId = generateExpectedGlobalId(EntityType.BidOrderState, cancelBidTx0.data.buyerWalletAccount, cancelBidTx0.data.tokenMintAccount, cancelBidTx0.data.marketplace);
  it('Verify update successful', () => {
    expect(updated).toBe(true);
  });
  it('Verify type', () => {
    expect(orderEntity.type).toBe(EntityType.BidOrderState);
  });
  it('Verify blockchain address', () => {
    expect(orderEntity.primaryEntity).toStrictEqual(bidTx1.data.tokenMintAccount.toString());
  });
  it('Verify id', () => {
    expect(orderEntity.id).toStrictEqual(bidTx1.data.buyerWalletAccount.toString());
  });
  it('Verify global id', () => {
    expect(orderEntity.globalId).toStrictEqual(expectedGlobalId);
  });
  it('Verify active state', () => {
    expect(orderEntity.data.active).toBe(true);
  });
  it('Verify updated price', () => {
    expect(orderEntity.data.price).toBe(StaticValues.prices.bid[1]);
  });
  it('Verify marketplace', () => {
    expect(orderEntity.data.marketplace).toStrictEqual(Marketplace.MagicEdenV2);
  });
  it('Verify updated block time', () => {
    expect(orderEntity.data.blockTime).toStrictEqual(bidTx1.data.created);
  });
  it('Verify updated reference signature', () => {
    expect(orderEntity.data.signature).toBe(StaticValues.signatures.bid[1]);
  });
})

describe("Verify no bid entity update to existing inactive bid when received out of order", () => {
  /**
   * Steps:
   * - pass cancel bid tx 0 entity to updateBidEntity with orderEntity
   * - pass bid tx 0 entity to createBidEntity => orderEntity
   * - validate 
   *  - returns false 
   *  - values of orderEntity
   *   - type
   *   - blockchain address
   *   - id == wallet
   *   - global id == expected value
   *   - data { active == true, price == cancel bid tx 0.price, marketplace, block time == cancel bid tx 0.block time, signature == cancel bid tx 0.signature}
   */
  const cancelBidTx0 = entities[entitiesIndex.CancelBid[0]];
  const bidTx0 = entities[entitiesIndex.Bid[0]];
  const orderEntity: BidOrderStateEntity = createBidOrderStateEntity({ ...cancelBidTx0.data, type: EntityType.CancelBidTransaction});
  const updated: boolean = updateBidOrderStateEntity({ ...bidTx0.data, type: EntityType.BidTransaction}, orderEntity);
  const expectedGlobalId = generateExpectedGlobalId(EntityType.BidOrderState, cancelBidTx0.data.buyerWalletAccount, cancelBidTx0.data.tokenMintAccount, cancelBidTx0.data.marketplace);
  it('Verify update unsuccessful', () => {
    expect(updated).toBe(false);
  });
  it('Verify type', () => {
    expect(orderEntity.type).toBe(EntityType.BidOrderState);
  });
  it('Verify blockchain address', () => {
    expect(orderEntity.primaryEntity).toStrictEqual(bidTx0.data.tokenMintAccount.toString());
  });
  it('Verify id', () => {
    expect(orderEntity.id).toStrictEqual(bidTx0.data.buyerWalletAccount.toString());
  });
  it('Verify global id', () => {
    expect(orderEntity.globalId).toStrictEqual(expectedGlobalId);
  });
  it('Verify active state', () => {
    expect(orderEntity.data.active).toBe(false);
  });
  it('Verify updated price', () => {
    expect(orderEntity.data.price).toBe(StaticValues.prices.bid[0]);
  });
  it('Verify marketplace', () => {
    expect(orderEntity.data.marketplace).toStrictEqual(Marketplace.MagicEdenV2);
  });
  it('Verify updated block time', () => {
    expect(orderEntity.data.blockTime).toStrictEqual(cancelBidTx0.data.created);
  });
  it('Verify updated reference signature', () => {
    expect(orderEntity.data.signature).toBe(StaticValues.signatures.cancelBid[0]);
  });
})

describe("Verify no bid entity update to existing bid when received for incorrect token", () => {
  /**
   * Steps:
   * - pass cancel bid tx 0 entity to updateBidEntity with orderEntity
   * - pass bid tx 0 entity to createBidEntity => orderEntity
   * - validate 
   *  - returns false 
   *  - values of orderEntity
   *   - type
   *   - blockchain address
   *   - id == wallet
   *   - global id == expected value
   *   - data { active == true, price == cancel bid tx 0.price, marketplace, block time == cancel bid tx 0.block time, signature == cancel bid tx 0.signature}
   */
  const cancelBidTx0 = entities[entitiesIndex.CancelBid[0]];
  const bidTx2 = entities[entitiesIndex.Bid[2]];
  const orderEntity: BidOrderStateEntity = createBidOrderStateEntity({ ...cancelBidTx0.data, type: EntityType.CancelBidTransaction});
  const updated: boolean = updateBidOrderStateEntity({ ...bidTx2.data, type: EntityType.BidTransaction}, orderEntity);
  const expectedGlobalId = generateExpectedGlobalId(EntityType.BidOrderState, cancelBidTx0.data.buyerWalletAccount, cancelBidTx0.data.tokenMintAccount, cancelBidTx0.data.marketplace);
  it('Verify update unsuccessful', () => {
    expect(updated).toBe(false);
  });
  it('Verify type', () => {
    expect(orderEntity.type).toBe(EntityType.BidOrderState);
  });
  it('Verify blockchain address', () => {
    expect(orderEntity.primaryEntity).toStrictEqual(cancelBidTx0.data.tokenMintAccount.toString());
  });
  it('Verify id', () => {
    expect(orderEntity.id).toStrictEqual(cancelBidTx0.data.buyerWalletAccount.toString());
  });
  it('Verify global id', () => {
    expect(orderEntity.globalId).toStrictEqual(expectedGlobalId);
  });
  it('Verify active state', () => {
    expect(orderEntity.data.active).toBe(false);
  });
  it('Verify updated price', () => {
    expect(orderEntity.data.price).toBe(StaticValues.prices.bid[0]);
  });
  it('Verify marketplace', () => {
    expect(orderEntity.data.marketplace).toStrictEqual(Marketplace.MagicEdenV2);
  });
  it('Verify updated block time', () => {
    expect(orderEntity.data.blockTime).toStrictEqual(cancelBidTx0.data.created);
  });
  it('Verify updated reference signature', () => {
    expect(orderEntity.data.signature).toBe(StaticValues.signatures.cancelBid[0]);
  });
})