import { decode } from "bs58";
import { ParserConstants } from "../../../shared/src/consts";

export const extractPrice = (data: string, offset: number) => {
    return parseInt(
        Buffer.from(decode(data))
        .readBigUInt64LE(
            offset
        ).toString()
    );
};

export const extractBidPrice = (data: string): number => {
    return extractPrice(data, ParserConstants.Solana.MagicEden.v2.Bid.InstructionDataOffsets.Price)
}
export const extractCancelBidPrice = (data: string): number => {
    return extractPrice(data, ParserConstants.Solana.MagicEden.v2.CancelBid.InstructionDataOffsets.Price)
}
export const extractAskPrice = (data: string): number => {
    return extractPrice(data, ParserConstants.Solana.MagicEden.v2.Ask.InstructionDataOffsets.Price)
}
export const extractExecuteSalePrice = (data: string): number => {
    return extractPrice(data, ParserConstants.Solana.MagicEden.v2.ExecuteSale.InstructionDataOffsets.Price)
}