import { normalizeAsk } from '../../../src/instruction/parser/ask'
import { MarketplaceInstructionType, MarketplaceTransactionEntityData } from '../../../../shared/src/types';
import { extractAskPrice } from '../../../src/instruction/utils';
import { 
  AskTransactionStaticData, ExpectedValues, InstructionIndex,
} from '../../staticData'

const TestSuiteDescriptor: string = 'ASK';

describe(`Magic Eden v2: [${TestSuiteDescriptor}] [Price extraction]`, () => {
  const askPrice: number = extractAskPrice(AskTransactionStaticData.Instructions.at(InstructionIndex.Ask).data);
  it('Verify price extraction', () => {
    expect(askPrice).toStrictEqual(ExpectedValues.Ask.price);
  });
});

describe(`Magic Eden v2: [${TestSuiteDescriptor}] [Fail parse]`, () => {
  const emptyOrder: MarketplaceTransactionEntityData = normalizeAsk(
                                          AskTransactionStaticData.Instructions.at(InstructionIndex.Ask), 
                                          AskTransactionStaticData.Message.accountKeys, 
                                          MarketplaceInstructionType.Bid, 
                                          AskTransactionStaticData.BlockTime,
                                          AskTransactionStaticData.Signature
                                        );
  it('Verify parser does not parse non-matching instruction', () => {
    expect(emptyOrder).toStrictEqual({} as MarketplaceTransactionEntityData);
  });
});

describe(`Magic Eden v2: [${TestSuiteDescriptor}] [Normalize]`, () => {
  const ask: MarketplaceTransactionEntityData = normalizeAsk(
                                          AskTransactionStaticData.Instructions.at(InstructionIndex.Ask), 
                                          AskTransactionStaticData.Message.accountKeys, 
                                          MarketplaceInstructionType.Ask, 
                                          AskTransactionStaticData.BlockTime,
                                          AskTransactionStaticData.Signature
                                        );
  it('Verify wallet account', () => {
    expect(ask.sellerWalletAccount.toString()).toStrictEqual(ExpectedValues.Ask.sellerWalletAccount.toString());
  });
  it('Verify pda account', () => {
    expect(ask.sellerPdaAccount.toString()).toStrictEqual(ExpectedValues.Ask.sellerPdaAccount.toString());
  });
  it('Verify mint account', () => {
    expect(ask.tokenMintAccount.toString()).toStrictEqual(ExpectedValues.Ask.tokenMintAccount.toString());
  });
  it('Verify date', () => {
    expect(ask.created.toString()).toStrictEqual(ExpectedValues.Ask.created.toString());
  });
  it('Verify signature', () => {
    expect(ask.signature.toString()).toStrictEqual(ExpectedValues.Ask.signature.toString());
  });
  it('Verify marketplace', () => {
    expect(ask.marketplace.toString()).toStrictEqual(ExpectedValues.Ask.marketplace.toString());
  });
  it('Verify pda data', () => {
    expect(ask.pdaData).toBe(null);
  });
  it('Verify price', () => {
    expect(ask.price).toBe(ExpectedValues.Ask.price);
  });
})