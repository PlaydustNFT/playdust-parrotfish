import { normalizeCancelAsk } from '../../../src/instruction/parser/cancelAsk';
import { MarketplaceInstructionType, MarketplaceTransactionEntityData } from '../../../../shared/src/types';
import { 
  CancelAskTransactionStaticData, ExpectedValues, InstructionIndex,
} from '../../staticData'

const TestSuiteDescriptor: string = 'CANCEL_ASK';

describe(`Magic Eden v2: [${TestSuiteDescriptor}] [Fail parse]`, () => {
  const emptyOrder: MarketplaceTransactionEntityData = normalizeCancelAsk(
                                          CancelAskTransactionStaticData.Instructions.at(InstructionIndex.CancelAsk), 
                                          CancelAskTransactionStaticData.Message.accountKeys, 
                                          MarketplaceInstructionType.Ask, 
                                          CancelAskTransactionStaticData.BlockTime,
                                          CancelAskTransactionStaticData.Signature
                                        );
  it('Verify parser does not parse non-matching instruction', () => {
    expect(emptyOrder).toStrictEqual({} as MarketplaceTransactionEntityData);
  });
});

describe(`Magic Eden v2: [${TestSuiteDescriptor}] [Normalize]`, () => {
  const cancelAsk: MarketplaceTransactionEntityData = normalizeCancelAsk(
                                          CancelAskTransactionStaticData.Instructions.at(InstructionIndex.CancelAsk), 
                                          CancelAskTransactionStaticData.Message.accountKeys, 
                                          MarketplaceInstructionType.CancelAsk, 
                                          CancelAskTransactionStaticData.BlockTime,
                                          CancelAskTransactionStaticData.Signature
                                        );
  it('Verify wallet account', () => {
    expect(cancelAsk.sellerWalletAccount.toString()).toStrictEqual(ExpectedValues.CancelAsk.sellerWalletAccount.toString());
  });
  it('Verify pda account', () => {
    expect(cancelAsk.sellerPdaAccount.toString()).toStrictEqual(ExpectedValues.CancelAsk.sellerPdaAccount.toString());
  });
  it('Verify mint account', () => {
    expect(cancelAsk.tokenMintAccount.toString()).toStrictEqual(ExpectedValues.CancelAsk.tokenMintAccount.toString());
  });
  it('Verify date', () => {
    expect(cancelAsk.created.toString()).toStrictEqual(ExpectedValues.CancelAsk.created.toString());
  });
  it('Verify signature', () => {
    expect(cancelAsk.signature.toString()).toStrictEqual(ExpectedValues.CancelAsk.signature.toString());
  });
  it('Verify marketplace', () => {
    expect(cancelAsk.marketplace.toString()).toStrictEqual(ExpectedValues.CancelAsk.marketplace.toString());
  });
  it('Verify pda data', () => {
    expect(cancelAsk.pdaData).toBe(null);
  });
  it('Verify price', () => {
    expect(cancelAsk.price).toBe(ExpectedValues.CancelAsk.price);
  });
})