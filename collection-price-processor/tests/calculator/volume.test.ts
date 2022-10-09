import { calculateVolumeByMarketplace } from "../../src/calculator/volume";
import { Marketplace, MarketplaceTransactionEntityData } from "../../../shared/src/types";
import { OneDayInMilliseconds } from "../../../shared/src/consts";

const createTrade = (
    marketplace: Marketplace,
    price: number,
    blockTime: number,
    signature: string,
): MarketplaceTransactionEntityData => {
    const t = new MarketplaceTransactionEntityData(
        null,
        null,
        null,
        null,
        null,
        blockTime,
        signature,
        marketplace,
        'pdadata',
        price,
    );
    return t;
}

describe("Verify volume calculator", () => {
  /**
   * Steps:
   *  - given a set of trades
   *  - verify total volume calculation per marketplace
   */
  const trades: MarketplaceTransactionEntityData[] = [];
  const mev1 = {
      d1volume: 1.0,
      d7volume: 5.0,
      d30volume: 0.4,
      total: 0.5,
  };
  const mev2 = {
      d1volume: 10.0,
      d7volume: 11.0,
      d30volume: 10.0,
      total: 11.0,
  };
  
  const expected = {
      mev1: {
          d1volume: mev1.d1volume,
          d7volume: mev1.d1volume + mev1.d7volume,
          d30volume: mev1.d1volume + mev1.d7volume + mev1.d30volume,
          total: mev1.d1volume + mev1.d7volume + mev1.d30volume + mev1.total,
      },
      mev2: {
          d1volume: mev2.d1volume,
          d7volume: mev2.d1volume + mev2.d7volume,
          d30volume: mev2.d1volume + mev2.d7volume + mev2.d30volume,
          total: mev2.d1volume + mev2.d7volume + mev2.d30volume + mev2.total,
      },
      global: {
          d1volume: mev1.d1volume + mev2.d1volume,
          d7volume: mev1.d1volume + mev1.d7volume + mev2.d1volume + mev2.d7volume,
          d30volume: mev1.d1volume + mev1.d7volume + mev1.d30volume + mev2.d1volume + mev2.d7volume + mev2.d30volume,
          total: mev1.d1volume + mev1.d7volume + mev1.d30volume + mev1.total + mev2.d1volume + mev2.d7volume + mev2.d30volume + mev2.total,
      },
  }
  const d1blockTime = (Date.now() - (0.25 * OneDayInMilliseconds))/1000;
  const d2blockTime = (Date.now() - (2 * OneDayInMilliseconds))/1000;
  const d10blockTime = (Date.now() - (10 * OneDayInMilliseconds))/1000;
  const d40blockTime = (Date.now() - (40 * OneDayInMilliseconds))/1000;

  trades.push(createTrade(Marketplace.MagicEdenV1, mev1.d1volume, d1blockTime, 'sig0'));
  trades.push(createTrade(Marketplace.MagicEdenV1, mev1.d7volume, d2blockTime, 'sig1'));
  trades.push(createTrade(Marketplace.MagicEdenV1, mev1.d30volume, d10blockTime, 'sig3'));
  trades.push(createTrade(Marketplace.MagicEdenV1, mev1.total, d40blockTime, 'sig2'));

  trades.push(createTrade(Marketplace.MagicEdenV2, mev2.d1volume, d1blockTime, 'sig0'));
  trades.push(createTrade(Marketplace.MagicEdenV2, mev2.d7volume, d2blockTime, 'sig1'));
  trades.push(createTrade(Marketplace.MagicEdenV2, mev2.d30volume, d10blockTime, 'sig3'));
  trades.push(createTrade(Marketplace.MagicEdenV2, mev2.total, d40blockTime, 'sig2'));

  const volumes = calculateVolumeByMarketplace(trades);

  it('Verify 1d volumes', () => {
      expect(volumes.byMarketplace.get(Marketplace.MagicEdenV1).d1).toStrictEqual(expected.mev1.d1volume);
      expect(volumes.byMarketplace.get(Marketplace.MagicEdenV2).d1).toStrictEqual(expected.mev2.d1volume);
      expect(volumes.global.d1).toStrictEqual(expected.global.d1volume);
  });
  it('Verify 7d volumes', () => {
      expect(volumes.byMarketplace.get(Marketplace.MagicEdenV1).d7).toStrictEqual(expected.mev1.d7volume);
      expect(volumes.byMarketplace.get(Marketplace.MagicEdenV2).d7).toStrictEqual(expected.mev2.d7volume);
      expect(volumes.global.d7).toStrictEqual(expected.global.d7volume);
  });
  it('Verify 30d volumes', () => {
      expect(volumes.byMarketplace.get(Marketplace.MagicEdenV1).d30).toStrictEqual(expected.mev1.d30volume);
      expect(volumes.byMarketplace.get(Marketplace.MagicEdenV2).d30).toStrictEqual(expected.mev2.d30volume);
      expect(volumes.global.d30).toStrictEqual(expected.global.d30volume);
  });
  it('Verify total volumes', () => {
      expect(volumes.byMarketplace.get(Marketplace.MagicEdenV1).total).toStrictEqual(expected.mev1.total);
      expect(volumes.byMarketplace.get(Marketplace.MagicEdenV2).total).toStrictEqual(expected.mev2.total);
      expect(volumes.global.total).toStrictEqual(expected.global.total);
  });
})