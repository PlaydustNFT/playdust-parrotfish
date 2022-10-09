import { normalizeBid } from '../../../src/instruction/parser/bid';
import { MarketplaceInstructionType, MarketplaceTransactionEntityData } from '../../../../shared/src/types';
import { extractBidPrice } from '../../../src/instruction/utils';
import { 
  BidTransactionStaticData, ExpectedValues, InstructionIndex,
} from '../../staticData'

const TestSuiteDescriptor: string = 'BID';

describe(`Magic Eden v2: [${TestSuiteDescriptor}] [Price extraction]`, () => {
  const bidPrice: number = extractBidPrice(BidTransactionStaticData.Instructions.at(InstructionIndex.Bid).data);
  it('Verify price extraction', () => {
    expect(bidPrice).toStrictEqual(ExpectedValues.Bid.price);
  });
});

describe(`Magic Eden v2: [${TestSuiteDescriptor}] [Fail parse]`, () => {
  const emptyOrder: MarketplaceTransactionEntityData = normalizeBid(
                                          BidTransactionStaticData.Instructions.at(InstructionIndex.Bid), 
                                          BidTransactionStaticData.Message.accountKeys, 
                                          MarketplaceInstructionType.Ask, 
                                          BidTransactionStaticData.BlockTime,
                                          BidTransactionStaticData.Signature
                                        );
  it('Verify parser does not parse non-matching instruction', () => {
    expect(emptyOrder).toStrictEqual({} as MarketplaceTransactionEntityData);
  });
});

describe(`Magic Eden v2: [${TestSuiteDescriptor}] [Normalize]`, () => {
  const bid: MarketplaceTransactionEntityData = normalizeBid(
                                          BidTransactionStaticData.Instructions.at(InstructionIndex.Bid), 
                                          BidTransactionStaticData.Message.accountKeys, 
                                          MarketplaceInstructionType.Bid, 
                                          BidTransactionStaticData.BlockTime,
                                          BidTransactionStaticData.Signature
                                        );
  it('Verify wallet account', () => {
    expect(bid.buyerWalletAccount.toString()).toStrictEqual(ExpectedValues.Bid.buyerWalletAccount.toString());
  });
  it('Verify pda account', () => {
    expect(bid.buyerPdaAccount.toString()).toStrictEqual(ExpectedValues.Bid.buyerPdaAccount.toString());
  });
  it('Verify mint account', () => {
    expect(bid.tokenMintAccount.toString()).toStrictEqual(ExpectedValues.Bid.tokenMintAccount.toString());
  });
  it('Verify date', () => {
    expect(bid.created.toString()).toStrictEqual(ExpectedValues.Bid.created.toString());
  });
  it('Verify signature', () => {
    expect(bid.signature.toString()).toStrictEqual(ExpectedValues.Bid.signature.toString());
  });
  it('Verify marketplace', () => {
    expect(bid.marketplace.toString()).toStrictEqual(ExpectedValues.Bid.marketplace.toString());
  });
  it('Verify pda data', () => {
    expect(bid.pdaData).toBe(null);
  });
  it('Verify price', () => {
    expect(bid.price).toBe(ExpectedValues.Bid.price);
  });
})