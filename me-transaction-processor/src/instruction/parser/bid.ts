import { CompiledInstruction, PublicKey, TransactionSignature } from "@solana/web3.js"
import { ParserConstants } from "../../../../shared/src/consts";
import { Marketplace, MarketplaceInstructionType, MarketplaceTransactionEntityData } from "../../../../shared/src/types";
import { extractBidPrice } from '../utils'


export const normalizeBid = (
    ix: CompiledInstruction,
    accountKeys: PublicKey[],
    ixType: MarketplaceInstructionType,
    blockTime: number,
    txSignature: TransactionSignature): MarketplaceTransactionEntityData => {
    if (ixType != MarketplaceInstructionType.Bid) {
        return {} as MarketplaceTransactionEntityData;
    }

    const buyerWalletAccount = accountKeys[ix.accounts[ParserConstants.Solana.MagicEden.v2.Bid.AccountKeyIndex.Wallet]].toString();
    const buyerPdaAccount = accountKeys[ix.accounts[ParserConstants.Solana.MagicEden.v2.Bid.AccountKeyIndex.PDA]].toString();
    const sellerWalletAccount = null;
    const sellerPdaAccount = null;
    const tokenMintAccount = accountKeys[ix.accounts[ParserConstants.Solana.MagicEden.v2.Bid.AccountKeyIndex.Mint]].toString();
    const signature = txSignature;
    const marketplace = Marketplace.MagicEdenV2;
    const pdaData = null;
    const price = extractBidPrice(ix.data);

    const bid = new MarketplaceTransactionEntityData(
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
    return bid;
};