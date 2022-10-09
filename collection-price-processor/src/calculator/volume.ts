import { OneDayInMilliseconds } from "../../../shared/src/consts";
import { CollectionVolume, Marketplace, MarketplaceTransactionEntityData, VolumeData } from "../../../shared/src/types";

export const calculateVolumeByMarketplace = (
  trades: MarketplaceTransactionEntityData[]
): CollectionVolume => {
  let volume: CollectionVolume = {} as CollectionVolume;
  volume.global = {
    d1: 0,
    d7: 0,
    d30: 0,
    total: 0
  };

  const now = Date.now();
  /** Get Unix Timestamps for 1d, 7d, 30d periods */
  const d1: number = now - (1*OneDayInMilliseconds);
  const d7: number = now - (7*OneDayInMilliseconds);
  const d30: number = now - (30*OneDayInMilliseconds);

  for (const t of trades) {
    if (!volume.byMarketplace) {
      volume.byMarketplace = new Map<Marketplace, VolumeData>();
    }
    let current = volume.byMarketplace.get(t.marketplace);
    if (!current) {
      current = {
        d1: 0,
        d7: 0,
        d30: 0,
        total: 0
      } as VolumeData;
    }

    /** Always update Marketplace partition & global 'total' attributes */
    volume.global.total += t.price;
    current.total += t.price;

    const tradeDate = t.created*1000;
    // Check recency
    if (tradeDate >= d30) {
      volume.global.d30 += t.price;
      current.d30 += t.price;
    }
    if (tradeDate >= d7) {
      volume.global.d7 += t.price;
      current.d7 += t.price;
    }
    if (tradeDate >= d1) {
      volume.global.d1 += t.price;
      current.d1 += t.price;
    }
    volume.byMarketplace.set(t.marketplace, current);
  }
  return volume;
}

