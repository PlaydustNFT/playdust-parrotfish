/**
 * 
 * test all entity related code here
 * 
 */

import { normalizeAsk } from '../../src/instruction/parser/ask';
import { EntityType, MarketplaceInstructionType, MarketplaceTransactionEntityData } from '../../../shared/src/types';
import { 
  AskTransactionStaticData, ExpectedValues, InstructionIndex,
} from '../staticData'
import { AskTransactionEntity } from '../../../shared/src/entity/transaction/AskTransactionEntity';

/**
 * Primary Entity Testing
 * ----------------------
 * create MarketplaceTransactionEntity from Ask transaction
 *  - call normalizeAsk
 *  - init new MarketplaceTransactionEntity (mptxe)
 *  - call mptxe.populate(order)
 * verify primaryEntity == transaction signature
 * verify type == EntityType.MarketplaceTransactionEntity
 * verify values in "data" field
 */

const order: MarketplaceTransactionEntityData = normalizeAsk(
                                        AskTransactionStaticData.Instructions.at(InstructionIndex.Ask), 
                                        AskTransactionStaticData.Message.accountKeys, 
                                        MarketplaceInstructionType.Ask, 
                                        AskTransactionStaticData.BlockTime,
                                        AskTransactionStaticData.Signature
                                      );

describe("Verify primary MarketplaceTransactionEntity", () => {
  const entity = new AskTransactionEntity();
  entity.populate(order, order.signature);
  it('Verify primary entity primaryEntity', () => {
    expect(entity.primaryEntity).toStrictEqual(order.tokenMintAccount);
  });
  it('Verify primary entity type', () => {
    expect(entity.type).toBe(EntityType.AskTransaction);
  });
  it('Verify primary entity data wallet address', () => {
    expect(entity.data.sellerWalletAccount).toStrictEqual(ExpectedValues.Ask.sellerWalletAccount);
  });
  it('Verify primary entity data pda account', () => {
    expect(entity.data.sellerPdaAccount).toStrictEqual(ExpectedValues.Ask.sellerPdaAccount);
  });
  it('Verify primary entity data mint account', () => {
    expect(entity.data.tokenMintAccount).toStrictEqual(ExpectedValues.Ask.tokenMintAccount);
  });
  it('Verify primary entity data date', () => {
    expect(entity.data.created).toStrictEqual(ExpectedValues.Ask.created);
  });
  it('Verify primary entity data signature', () => {
    expect(entity.data.signature.toString()).toStrictEqual(ExpectedValues.Ask.signature.toString());
  });
  it('Verify primary entity data marketplace', () => {
    expect(entity.data.marketplace).toStrictEqual(ExpectedValues.Ask.marketplace);
  });
  it('Verify primary entity data pda data', () => {
    expect(entity.data.pdaData).toBe(null);
  });
  it('Verify primary entity data price', () => {
    expect(entity.data.price).toBe(ExpectedValues.Ask.price);
  });
})