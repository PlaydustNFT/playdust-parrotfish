import { normalizeCancelBid } from 'instruction/parser/cancelBid';
import { MarketplaceInstructionType, MarketplaceTransactionEntityData } from '../../../../shared/src/types';
import { extractCancelBidPrice } from 'instruction/utils';
import { 
  CancelBidTransactionStaticData, ExpectedValues, InstructionIndex,
} from '../../staticData'

const TestSuiteDescriptor: string = 'CANCEL_BID';

describe(`Magic Eden v2: [${TestSuiteDescriptor}] [Price extraction]`, () => {
  const originalBidPrice: number = extractCancelBidPrice(CancelBidTransactionStaticData.Instructions.at(InstructionIndex.CancelBid).data);
  it('Verify price extraction', () => {
    expect(originalBidPrice).toStrictEqual(ExpectedValues.CancelBid.price);
  });
});

describe(`Magic Eden v2: [${TestSuiteDescriptor}] [Fail parse]`, () => {
  const emptyOrder: MarketplaceTransactionEntityData = normalizeCancelBid(
                                          CancelBidTransactionStaticData.Instructions.at(InstructionIndex.CancelBid), 
                                          CancelBidTransactionStaticData.Message.accountKeys, 
                                          MarketplaceInstructionType.Ask, 
                                          CancelBidTransactionStaticData.BlockTime,
                                          CancelBidTransactionStaticData.Signature
                                        );
  it('Verify parser does not parse non-matching instruction', () => {
    expect(emptyOrder).toStrictEqual({} as MarketplaceTransactionEntityData);
  });
});

describe(`Magic Eden v2: [${TestSuiteDescriptor}] [Normalize]`, () => {
  const cancelBid: MarketplaceTransactionEntityData = normalizeCancelBid(
                                          CancelBidTransactionStaticData.Instructions.at(InstructionIndex.CancelBid), 
                                          CancelBidTransactionStaticData.Message.accountKeys, 
                                          MarketplaceInstructionType.CancelBid, 
                                          CancelBidTransactionStaticData.BlockTime,
                                          CancelBidTransactionStaticData.Signature
                                        );
  it('Verify wallet account', () => {
    expect(cancelBid.buyerWalletAccount.toString()).toStrictEqual(ExpectedValues.CancelBid.buyerWalletAccount.toString());
  });
  it('Verify pda account', () => {
    expect(cancelBid.buyerPdaAccount.toString()).toStrictEqual(ExpectedValues.CancelBid.buyerPdaAccount.toString());
  });
  it('Verify mint account', () => {
    expect(cancelBid.tokenMintAccount.toString()).toStrictEqual(ExpectedValues.CancelBid.tokenMintAccount.toString());
  });
  it('Verify date', () => {
    expect(cancelBid.created.toString()).toStrictEqual(ExpectedValues.CancelBid.created.toString());
  });
  it('Verify signature', () => {
    expect(cancelBid.signature.toString()).toStrictEqual(ExpectedValues.CancelBid.signature.toString());
  });
  it('Verify marketplace', () => {
    expect(cancelBid.marketplace.toString()).toStrictEqual(ExpectedValues.CancelBid.marketplace.toString());
  });
  it('Verify pda data', () => {
    expect(cancelBid.pdaData).toBe(null);
  });
  it('Verify price', () => {
    expect(cancelBid.price).toBe(ExpectedValues.CancelBid.price);
  });
})