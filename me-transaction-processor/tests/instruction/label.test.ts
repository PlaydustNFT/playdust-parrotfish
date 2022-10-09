import { 
  AskTransactionStaticData,
  BidTransactionStaticData,
  CancelAskTransactionStaticData,
  CancelBidTransactionStaticData,
  ExecuteSaleTransactionStaticData,
  InstructionIndex,
  UnknownInstruction
} from '../staticData'

import { label } from 'instruction/label'
import { MarketplaceInstructionType } from '../../../shared/src/types';

describe("Label instruction types", () => {
  it('Label ask instruction', () => {
    expect(label(AskTransactionStaticData.Instructions.at(InstructionIndex.Ask))).toBe(MarketplaceInstructionType.Ask);
  });
  it('Label cancel ask instruction', () => {
    expect(label(CancelAskTransactionStaticData.Instructions.at(InstructionIndex.CancelAsk))).toBe(MarketplaceInstructionType.CancelAsk);
  });
  it('Label bid instruction', () => {
    expect(label(BidTransactionStaticData.Instructions.at(InstructionIndex.Bid))).toBe(MarketplaceInstructionType.Bid);
  });
  it('Label cancel bid instruction', () => {
    expect(label(CancelBidTransactionStaticData.Instructions.at(InstructionIndex.CancelBid))).toBe(MarketplaceInstructionType.CancelBid);
  });
  it('Label execute sale instruction', () => {
    expect(label(ExecuteSaleTransactionStaticData.Instructions.at(InstructionIndex.ExecuteSale))).toBe(MarketplaceInstructionType.ExecuteSale);
  });
  it('Label unknown instruction accordingly', () => {
    expect(label(UnknownInstruction)).toBe(MarketplaceInstructionType.Unknown);
  });
})