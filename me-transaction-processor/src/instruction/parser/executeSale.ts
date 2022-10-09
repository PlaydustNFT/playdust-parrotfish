import { CompiledInstruction, PublicKey, TransactionSignature } from "@solana/web3.js"
import { ParserConstants } from "../../../../shared/src/consts";
import { Marketplace, MarketplaceInstructionType, MarketplaceTransactionEntityData } from "../../../../shared/src/types";
import { extractExecuteSalePrice } from "../utils";


export const normalizeExecuteSale = (
    ix: CompiledInstruction,
    accountKeys: PublicKey[],
    ixType: MarketplaceInstructionType,
    blockTime: number,
    txSignature: TransactionSignature): MarketplaceTransactionEntityData => {
    if (ixType != MarketplaceInstructionType.ExecuteSale) {
        return {} as MarketplaceTransactionEntityData;
    }

    const buyerWalletAccount = accountKeys[ix.accounts[ParserConstants.Solana.MagicEden.v2.ExecuteSale.AccountKeyIndex.BuyerWallet]].toString();
    const buyerPdaAccount = accountKeys[ix.accounts[ParserConstants.Solana.MagicEden.v2.ExecuteSale.AccountKeyIndex.BuyerPDA]].toString();
    const sellerWalletAccount = accountKeys[ix.accounts[ParserConstants.Solana.MagicEden.v2.ExecuteSale.AccountKeyIndex.SellerWallet]].toString();
    const sellerPdaAccount = accountKeys[ix.accounts[ParserConstants.Solana.MagicEden.v2.ExecuteSale.AccountKeyIndex.SellerPDA]].toString();
    const mintAccount = accountKeys[ix.accounts[ParserConstants.Solana.MagicEden.v2.ExecuteSale.AccountKeyIndex.Mint]].toString();
    const signature = txSignature;
    const marketplace = Marketplace.MagicEdenV2;
    const price = extractExecuteSalePrice(ix.data);
    const pdaData = null;

    const executeSale = new MarketplaceTransactionEntityData(
        buyerWalletAccount,
        buyerPdaAccount,
        sellerWalletAccount,
        sellerPdaAccount,
        mintAccount,
        blockTime,
        signature,
        marketplace,
        pdaData,
        price,
    );
    return executeSale;
}