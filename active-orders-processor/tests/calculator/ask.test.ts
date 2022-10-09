import { 
  entities,
  entitiesIndex,
  generateExpectedGlobalId,
  StaticValues,
} from '../staticData'

import { createAskOrderStateEntity, updateAskOrderStateEntity } from '../../src/calculator/ask'

import { Entity, EntityType, Marketplace } from '../../../shared/src/types';
import { AskOrderStateEntity } from '../../../shared/src/entity/order_state/AskOrderStateEntity';

describe("Verify active ask entity creation", () => {
  /**
   * Steps:
   * - pass ask tx entity to createAskOrderState
   * - validate values of the AskOrderStateEntity returned
   *  - type
   *  - blockchain address
   *  - id == wallet
   *  - global id == expected value
   *  - data { active state, price, marketplace, block time, signature }
   */
  const tx = entities[entitiesIndex.Ask[0]];
  const orderEntity: AskOrderStateEntity = createAskOrderStateEntity({ ...tx.data, type: EntityType.AskTransaction});
  const expectedGlobalId = generateExpectedGlobalId(EntityType.AskOrderState, tx.data.sellerWalletAccount, tx.data.tokenMintAccount, tx.data.marketplace);
  it('Verify type', () => {
    expect(orderEntity.type).toBe(EntityType.AskOrderState);
  });
  it('Verify blockchain address', () => {
    expect(orderEntity.primaryEntity).toStrictEqual(tx.data.tokenMintAccount.toString());
  });
  it('Verify id', () => {
    expect(orderEntity.id).toStrictEqual(tx.data.sellerWalletAccount.toString());
  });
  it('Verify global id', () => {
    expect(orderEntity.globalId).toStrictEqual(expectedGlobalId);
  });
  it('Verify active state', () => {
    expect(orderEntity.data.active).toBe(true);
  });
  it('Verify price', () => {
    expect(orderEntity.data.price).toBe(StaticValues.prices.ask[0]);
  });
  it('Verify marketplace', () => {
    expect(orderEntity.data.marketplace).toStrictEqual(Marketplace.MagicEdenV2);
  });
  it('Verify block time', () => {
    expect(orderEntity.data.blockTime).toStrictEqual(tx.data.created);
  });
  it('Verify reference signature', () => {
    expect(orderEntity.data.signature).toBe(StaticValues.signatures.ask[0]);
  });
})

describe("Verify inactive ask entity creation from cancel", () => {
  /**
   * Steps:
   * - pass cancel ask tx entity to createAskOrderState
   * - validate values of the AskOrderStateEntity returned
   *  - type
   *  - blockchain address
   *  - id == wallet
   *  - global id == expected value
   *  - data { active state, price, marketplace, block time, signature }
   */
  const tx = entities[entitiesIndex.CancelAsk[0]];
  const orderEntity: AskOrderStateEntity = createAskOrderStateEntity({ ...tx.data, type: EntityType.CancelAskTransaction});
  const expectedGlobalId = generateExpectedGlobalId(EntityType.AskOrderState, tx.data.sellerWalletAccount, tx.data.tokenMintAccount, tx.data.marketplace);
  it('Verify type', () => {
    expect(orderEntity.type).toBe(EntityType.AskOrderState);
  });
  it('Verify blockchain address', () => {
    expect(orderEntity.primaryEntity).toStrictEqual(tx.data.tokenMintAccount.toString());
  });
  it('Verify id', () => {
    expect(orderEntity.id).toStrictEqual(tx.data.sellerWalletAccount.toString());
  });
  it('Verify global id', () => {
    expect(orderEntity.globalId).toStrictEqual(expectedGlobalId);
  });
  it('Verify active state', () => {
    expect(orderEntity.data.active).toBe(false);
  });
  it('Verify price', () => {
    expect(orderEntity.data.price).toBe(StaticValues.prices.ask[0]);
  });
  it('Verify marketplace', () => {
    expect(orderEntity.data.marketplace).toStrictEqual(Marketplace.MagicEdenV2);
  });
  it('Verify block time', () => {
    expect(orderEntity.data.blockTime).toStrictEqual(tx.data.created);
  });
  it('Verify reference signature', () => {
    expect(orderEntity.data.signature).toBe(StaticValues.signatures.cancelAsk[0]);
  });
})

describe("Verify inactive ask entity creation from execute sale", () => {
  /**
   * Steps:
   * - pass cancel ask tx entity to createAskOrderState
   * - validate values of the AskOrderStateEntity returned
   *  - type
   *  - blockchain address
   *  - id == wallet
   *  - global id == expected value
   *  - data { active state, price, marketplace, block time, signature }
   */
  const tx = entities[entitiesIndex.ExecuteSale[0]];
  const orderEntity: AskOrderStateEntity = createAskOrderStateEntity({ ...tx.data, type: EntityType.ExecuteSaleTransaction});
  const expectedGlobalId = generateExpectedGlobalId(EntityType.AskOrderState, tx.data.sellerWalletAccount, tx.data.tokenMintAccount, tx.data.marketplace);
  it('Verify type', () => {
    expect(orderEntity.type).toBe(EntityType.AskOrderState);
  });
  it('Verify blockchain address', () => {
    expect(orderEntity.primaryEntity).toStrictEqual(tx.data.tokenMintAccount.toString());
  });
  it('Verify id', () => {
    expect(orderEntity.id).toStrictEqual(tx.data.sellerWalletAccount.toString());
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

describe("Verify active ask entity update to existing active ask", () => {
  /**
   * Steps:
   * - pass ask tx 0 entity to createAskOrderState => orderEntity
   * - pass ask tx 1 entity to updateAskOrderState with orderEntity
   * - validate 
   *  - returns true
   *  - values of orderEntity
   *   - type
   *   - blockchain address
   *   - id == wallet
   *   - global id == expected value
   *   - data { active == true, price == ask tx 1.price, marketplace, block time == ask tx 1.block time, signature == ask tx 1.signature}
   */
  const askTx0 = entities[entitiesIndex.Ask[0]];
  const askTx1 = entities[entitiesIndex.Ask[1]];
  const orderEntity: AskOrderStateEntity = createAskOrderStateEntity({ ...askTx0.data, type: EntityType.AskTransaction});
  const updated: boolean = updateAskOrderStateEntity({ ...askTx1.data, type: EntityType.AskTransaction}, orderEntity);
  const expectedGlobalId = generateExpectedGlobalId(EntityType.AskOrderState, askTx0.data.sellerWalletAccount, askTx0.data.tokenMintAccount, askTx0.data.marketplace);
  it('Verify update successful', () => {
    expect(updated).toBe(true);
  });
  it('Verify type', () => {
    expect(orderEntity.type).toBe(EntityType.AskOrderState);
  });
  it('Verify blockchain address', () => {
    expect(orderEntity.primaryEntity).toStrictEqual(askTx1.data.tokenMintAccount.toString());
  });
  it('Verify id', () => {
    expect(orderEntity.id).toStrictEqual(askTx1.data.sellerWalletAccount.toString());
  });
  it('Verify global id', () => {
    expect(orderEntity.globalId).toStrictEqual(expectedGlobalId);
  });
  it('Verify active state', () => {
    expect(orderEntity.data.active).toBe(true);
  });
  it('Verify updated price', () => {
    expect(orderEntity.data.price).toBe(StaticValues.prices.ask[1]);
  });
  it('Verify marketplace', () => {
    expect(orderEntity.data.marketplace).toStrictEqual(Marketplace.MagicEdenV2);
  });
  it('Verify updated block time', () => {
    expect(orderEntity.data.blockTime).toStrictEqual(askTx1.data.created);
  });
  it('Verify updated reference signature', () => {
    expect(orderEntity.data.signature).toBe(StaticValues.signatures.ask[1]);
  });
})

describe("Verify active ask entity update to existing inactive ask", () => {
  /**
   * Steps:
   * - pass cancel ask tx 0 entity to createAskOrderState => orderEntity
   * - pass ask tx 1 entity to updateAskOrderState with orderEntity
   * - validate 
   *  - returns true
   *  - values of orderEntity
   *   - type
   *   - blockchain address
   *   - id == wallet
   *   - global id == expected value
   *   - data { active == true, price == ask tx 1.price, marketplace, block time == ask tx 1.block time, signature == ask tx 1.signature}
   */
  const cancelAskTx0 = entities[entitiesIndex.CancelAsk[0]];
  const askTx1 = entities[entitiesIndex.Ask[1]];
  const orderEntity: AskOrderStateEntity = createAskOrderStateEntity({ ...cancelAskTx0.data, type: EntityType.CancelAskTransaction});
  const updated: boolean = updateAskOrderStateEntity({ ...askTx1.data, type: EntityType.AskTransaction}, orderEntity);
  const expectedGlobalId = generateExpectedGlobalId(EntityType.AskOrderState, cancelAskTx0.data.sellerWalletAccount, cancelAskTx0.data.tokenMintAccount, cancelAskTx0.data.marketplace);
  it('Verify update successful', () => {
    expect(updated).toBe(true);
  });
  it('Verify type', () => {
    expect(orderEntity.type).toBe(EntityType.AskOrderState);
  });
  it('Verify blockchain address', () => {
    expect(orderEntity.primaryEntity).toStrictEqual(askTx1.data.tokenMintAccount.toString());
  });
  it('Verify id', () => {
    expect(orderEntity.id).toStrictEqual(askTx1.data.sellerWalletAccount.toString());
  });
  it('Verify global id', () => {
    expect(orderEntity.globalId).toStrictEqual(expectedGlobalId);
  });
  it('Verify active state', () => {
    expect(orderEntity.data.active).toBe(true);
  });
  it('Verify updated price', () => {
    expect(orderEntity.data.price).toBe(StaticValues.prices.ask[1]);
  });
  it('Verify marketplace', () => {
    expect(orderEntity.data.marketplace).toStrictEqual(Marketplace.MagicEdenV2);
  });
  it('Verify updated block time', () => {
    expect(orderEntity.data.blockTime).toStrictEqual(askTx1.data.created);
  });
  it('Verify updated reference signature', () => {
    expect(orderEntity.data.signature).toBe(StaticValues.signatures.ask[1]);
  });
})

describe("Verify no ask entity update to existing inactive ask when received out of order", () => {
  /**
   * Steps:
   * - pass cancel ask tx 0 entity to updateAskOrderState with orderEntity
   * - pass ask tx 0 entity to createAskOrderState => orderEntity
   * - validate 
   *  - returns false 
   *  - values of orderEntity
   *   - type
   *   - blockchain address
   *   - id == wallet
   *   - global id == expected value
   *   - data { active == true, price == cancel ask tx 0.price, marketplace, block time == cancel ask tx 0.block time, signature == cancel ask tx 0.signature}
   */
  const cancelAskTx0 = entities[entitiesIndex.CancelAsk[0]];
  const askTx0 = entities[entitiesIndex.Ask[0]];
  const orderEntity: AskOrderStateEntity = createAskOrderStateEntity({ ...cancelAskTx0.data, type: EntityType.CancelAskTransaction});
  const updated: boolean = updateAskOrderStateEntity({ ...askTx0.data, type: EntityType.AskTransaction}, orderEntity);
  const expectedGlobalId = generateExpectedGlobalId(EntityType.AskOrderState, cancelAskTx0.data.sellerWalletAccount, cancelAskTx0.data.tokenMintAccount, cancelAskTx0.data.marketplace);
  it('Verify update unsuccessful', () => {
    expect(updated).toBe(false);
  });
  it('Verify type', () => {
    expect(orderEntity.type).toBe(EntityType.AskOrderState);
  });
  it('Verify blockchain address', () => {
    expect(orderEntity.primaryEntity).toStrictEqual(askTx0.data.tokenMintAccount.toString());
  });
  it('Verify id', () => {
    expect(orderEntity.id).toStrictEqual(askTx0.data.sellerWalletAccount.toString());
  });
  it('Verify global id', () => {
    expect(orderEntity.globalId).toStrictEqual(expectedGlobalId);
  });
  it('Verify active state', () => {
    expect(orderEntity.data.active).toBe(false);
  });
  it('Verify updated price', () => {
    expect(orderEntity.data.price).toBe(StaticValues.prices.ask[0]);
  });
  it('Verify marketplace', () => {
    expect(orderEntity.data.marketplace).toStrictEqual(Marketplace.MagicEdenV2);
  });
  it('Verify updated block time', () => {
    expect(orderEntity.data.blockTime).toStrictEqual(cancelAskTx0.data.created);
  });
  it('Verify updated reference signature', () => {
    expect(orderEntity.data.signature).toBe(StaticValues.signatures.cancelAsk[0]);
  });
})

describe("Verify no ask entity update to existing ask when received for incorrect token", () => {
  /**
   * Steps:
   * - pass cancel ask tx 0 entity to updateAskOrderState with orderEntity
   * - pass ask tx 0 entity to createAskOrderState => orderEntity
   * - validate 
   *  - returns false 
   *  - values of orderEntity
   *   - type
   *   - blockchain address
   *   - id == wallet
   *   - global id == expected value
   *   - data { active == true, price == cancel ask tx 0.price, marketplace, block time == cancel ask tx 0.block time, signature == cancel ask tx 0.signature}
   */
  const cancelAskTx0 = entities[entitiesIndex.CancelAsk[0]];
  const askTx2 = entities[entitiesIndex.Ask[2]];
  const orderEntity: AskOrderStateEntity = createAskOrderStateEntity({ ...cancelAskTx0.data, type: EntityType.CancelAskTransaction});
  const updated: boolean = updateAskOrderStateEntity({ ...askTx2.data, type: EntityType.AskTransaction}, orderEntity);
  const expectedGlobalId = generateExpectedGlobalId(EntityType.AskOrderState, cancelAskTx0.data.sellerWalletAccount, cancelAskTx0.data.tokenMintAccount, cancelAskTx0.data.marketplace);
  it('Verify update unsuccessful', () => {
    expect(updated).toBe(false);
  });
  it('Verify type', () => {
    expect(orderEntity.type).toBe(EntityType.AskOrderState);
  });
  it('Verify blockchain address', () => {
    expect(orderEntity.primaryEntity).toStrictEqual(cancelAskTx0.data.tokenMintAccount.toString());
  });
  it('Verify id', () => {
    expect(orderEntity.id).toStrictEqual(cancelAskTx0.data.sellerWalletAccount.toString());
  });
  it('Verify global id', () => {
    expect(orderEntity.globalId).toStrictEqual(expectedGlobalId);
  });
  it('Verify active state', () => {
    expect(orderEntity.data.active).toBe(false);
  });
  it('Verify updated price', () => {
    expect(orderEntity.data.price).toBe(StaticValues.prices.ask[0]);
  });
  it('Verify marketplace', () => {
    expect(orderEntity.data.marketplace).toStrictEqual(Marketplace.MagicEdenV2);
  });
  it('Verify updated block time', () => {
    expect(orderEntity.data.blockTime).toStrictEqual(cancelAskTx0.data.created);
  });
  it('Verify updated reference signature', () => {
    expect(orderEntity.data.signature).toBe(StaticValues.signatures.cancelAsk[0]);
  });
})