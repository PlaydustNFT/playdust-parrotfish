import { normalizeExecuteSale } from 'instruction/parser/executeSale';
import { MarketplaceInstructionType, MarketplaceTransactionEntityData } from '../../../../shared/src/types';
import { extractExecuteSalePrice } from 'instruction/utils';
import { 
  ExecuteSaleTransactionStaticData, ExpectedValues, InstructionIndex,
} from '../../staticData'

const TestSuiteDescriptor: string = 'EXECUTE_SALE';

describe(`Magic Eden v2: [${TestSuiteDescriptor}] [Price extraction]`, () => {
  const originalBidPrice: number = extractExecuteSalePrice(ExecuteSaleTransactionStaticData.Instructions.at(InstructionIndex.ExecuteSale).data);
  it('Verify price extraction', () => {
    expect(originalBidPrice).toStrictEqual(ExpectedValues.ExecuteSale.price);
  });
});

describe(`Magic Eden v2: [${TestSuiteDescriptor}] [Fail parse]`, () => {
  const emptyTrade: MarketplaceTransactionEntityData = normalizeExecuteSale(
                                          ExecuteSaleTransactionStaticData.Instructions.at(InstructionIndex.ExecuteSale), 
                                          ExecuteSaleTransactionStaticData.Message.accountKeys, 
                                          MarketplaceInstructionType.Ask, 
                                          ExecuteSaleTransactionStaticData.BlockTime,
                                          ExecuteSaleTransactionStaticData.Signature
                                        );
  it('Verify parser does not parse non-matching instruction', () => {
    expect(emptyTrade).toStrictEqual({} as MarketplaceTransactionEntityData);
  });
});

describe(`Magic Eden v2: [${TestSuiteDescriptor}] [Normalize]`, () => {
  const executeSale: MarketplaceTransactionEntityData = normalizeExecuteSale(
                                          ExecuteSaleTransactionStaticData.Instructions.at(InstructionIndex.ExecuteSale), 
                                          ExecuteSaleTransactionStaticData.Message.accountKeys, 
                                          MarketplaceInstructionType.ExecuteSale, 
                                          ExecuteSaleTransactionStaticData.BlockTime,
                                          ExecuteSaleTransactionStaticData.Signature
                                        );
  it('Verify buyer wallet account', () => {
    expect(executeSale.buyerWalletAccount.toString()).toStrictEqual(ExpectedValues.ExecuteSale.buyerWalletAccount.toString());
  });
  it('Verify seller wallet account', () => {
    expect(executeSale.sellerWalletAccount.toString()).toStrictEqual(ExpectedValues.ExecuteSale.sellerWalletAccount.toString());
  });
  it('Verify buyer pda account', () => {
    expect(executeSale.buyerPdaAccount.toString()).toStrictEqual(ExpectedValues.ExecuteSale.buyerPdaAccount.toString());
  });
  it('Verify seller pda account', () => {
    expect(executeSale.sellerPdaAccount.toString()).toStrictEqual(ExpectedValues.ExecuteSale.sellerPdaAccount.toString());
  });
  it('Verify mint account', () => {
    expect(executeSale.tokenMintAccount.toString()).toStrictEqual(ExpectedValues.ExecuteSale.tokenMintAccount.toString());
  });
  it('Verify date', () => {
    expect(executeSale.created.toString()).toStrictEqual(ExpectedValues.ExecuteSale.created.toString());
  });
  it('Verify signature', () => {
    expect(executeSale.signature.toString()).toStrictEqual(ExpectedValues.ExecuteSale.signature.toString());
  });
  it('Verify marketplace', () => {
    expect(executeSale.marketplace.toString()).toStrictEqual(ExpectedValues.ExecuteSale.marketplace.toString());
  });
  it('Verify price', () => {
    expect(executeSale.price).toBe(ExpectedValues.ExecuteSale.price);
  });
})