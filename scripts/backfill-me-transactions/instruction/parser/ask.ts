import { CompiledInstruction, PublicKey, TransactionSignature } from "@solana/web3.js"
import { ParserConstants } from "../../../../shared/src/consts";
import { Marketplace, MarketplaceInstructionType, MarketplaceTransactionEntityData } from "../../../../shared/src/types";
import { extractAskPrice } from "../utils";

export const normalizeAsk = (
    ix: CompiledInstruction,
    accountKeys: PublicKey[],
    ixType: MarketplaceInstructionType,
    blockTime: number,
    txSignature: TransactionSignature): MarketplaceTransactionEntityData => {
    if (ixType != MarketplaceInstructionType.Ask) {
        return {} as MarketplaceTransactionEntityData;
    }

    const buyerWalletAccount = null;
    const buyerPdaAccount = null;
    const sellerWalletAccount = accountKeys[ix.accounts[ParserConstants.Solana.MagicEden.v2.Ask.AccountKeyIndex.Wallet]].toString();
    const sellerPdaAccount = accountKeys[ix.accounts[ParserConstants.Solana.MagicEden.v2.Ask.AccountKeyIndex.PDA]].toString();
    const tokenMintAccount = accountKeys[ix.accounts[ParserConstants.Solana.MagicEden.v2.Ask.AccountKeyIndex.Mint]].toString();
    const signature = txSignature;
    const marketplace = Marketplace.MagicEdenV2;
    const pdaData = null;
    const price = extractAskPrice(ix.data);

    const ask = new MarketplaceTransactionEntityData(
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
    return ask;
}