import { CompiledInstruction, PublicKey, TransactionSignature } from "@solana/web3.js"
import { ParserConstants } from "../../../../shared/src/consts";
import { Marketplace, MarketplaceInstructionType, MarketplaceTransactionEntityData } from "../../../../shared/src/types";
import { extractCancelBidPrice } from "../utils";


export const normalizeCancelBid = (
    ix: CompiledInstruction,
    accountKeys: PublicKey[],
    ixType: MarketplaceInstructionType,
    blockTime: number,
    txSignature: TransactionSignature): MarketplaceTransactionEntityData => {
    if (ixType != MarketplaceInstructionType.CancelBid) {
        return {} as MarketplaceTransactionEntityData;
    }

    const buyerWalletAccount = accountKeys[ix.accounts[ParserConstants.Solana.MagicEden.v2.CancelBid.AccountKeyIndex.Wallet]].toString();
    const buyerPdaAccount = accountKeys[ix.accounts[ParserConstants.Solana.MagicEden.v2.CancelBid.AccountKeyIndex.PDA]].toString();
    const sellerWalletAccount = null;
    const sellerPdaAccount = null;
    const tokenMintAccount = accountKeys[ix.accounts[ParserConstants.Solana.MagicEden.v2.CancelBid.AccountKeyIndex.Mint]].toString();
    const signature = txSignature;
    const marketplace = Marketplace.MagicEdenV2;
    const price = extractCancelBidPrice(ix.data);
    const pdaData = null;

    const cancelBid = new MarketplaceTransactionEntityData(
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
    return cancelBid;
}