import { CompiledInstruction } from "@solana/web3.js"
import { Marketplace, MarketplaceInstructionType } from '../../../shared/src/types'
import { 
    MarketplaceInstructionDiscriminators,
} from "../../../shared/src/consts";
import { decode } from "bs58";

export const label = (ix: CompiledInstruction): MarketplaceInstructionType => {
    const rawIxType = parseInt(
      decode(ix.data)
        .readBigUInt64LE(0)
        .toString()
    ).toString();
    const playdustIxType = MarketplaceInstructionDiscriminators.get(Marketplace.MagicEdenV2).get(rawIxType);
    if (playdustIxType) {
        return playdustIxType;
    }
    return MarketplaceInstructionType.Unknown;
}