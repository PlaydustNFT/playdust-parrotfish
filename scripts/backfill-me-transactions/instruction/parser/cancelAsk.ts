import { CompiledInstruction, PublicKey, TransactionSignature } from "@solana/web3.js"
import { ParserConstants } from "../../../../shared/src/consts";
import { Marketplace, MarketplaceInstructionType, MarketplaceTransactionEntityData } from "../../../../shared/src/types";

export const normalizeCancelAsk = (
    ix: CompiledInstruction,
    accountKeys: PublicKey[],
    ixType: MarketplaceInstructionType,
    blockTime: number,
    txSignature: TransactionSignature): MarketplaceTransactionEntityData => {
    if (ixType != MarketplaceInstructionType.CancelAsk) {
        return {} as MarketplaceTransactionEntityData;
    }

    const buyerWalletAccount = null;
    const buyerPdaAccount = null;
    const sellerWalletAccount = accountKeys[ix.accounts[ParserConstants.Solana.MagicEden.v2.CancelAsk.AccountKeyIndex.Wallet]].toString();
    const sellerPdaAccount = accountKeys[ix.accounts[ParserConstants.Solana.MagicEden.v2.CancelAsk.AccountKeyIndex.PDA]].toString();
    const tokenMintAccount = accountKeys[ix.accounts[ParserConstants.Solana.MagicEden.v2.CancelAsk.AccountKeyIndex.Mint]].toString();
    const signature = txSignature;
    const marketplace = Marketplace.MagicEdenV2;
    const price = null;
    const pdaData = null;

    const cancelAsk = new MarketplaceTransactionEntityData(
        buyerWalletAccount,
        buyerPdaAccount,
        sellerWalletAccount,
        sellerPdaAccount,
        tokenMintAccount,
        blockTime,
        signature,
        marketplace,
        pdaData,
        price,
    );
    return cancelAsk;
}