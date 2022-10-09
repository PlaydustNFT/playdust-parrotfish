import { Attribute, NFTRarityData } from "../../../shared/src/types";
import { CollectionAttributeMap } from "./attributes";

export const calculateStatisticalRarityPerTraitForCollection = (
  collectionAttributeMap: CollectionAttributeMap,
  totalSupply: number,
): CollectionAttributeMap => {
  for (let [traitName, traitValues] of collectionAttributeMap) {
    for (let [traitValue, traitMetadata] of traitValues) {
      traitMetadata.rarity = traitMetadata.count / totalSupply;

      /** Update inner-map */
      traitValues.set(traitValue, traitMetadata);
    }
    /** Update outer-map */
    collectionAttributeMap.set(traitName, traitValues);
  }
  return collectionAttributeMap;
}


export function calculateStatisticalRarityForMint(
  attributes: Attribute[],
  totalCount: number,
  attributeMap: CollectionAttributeMap
): number {
  let rarity: number = 1;

  if (attributes) {
    for (const attribute of attributes) {
      rarity *=
        attributeMap.get(attribute.trait_type).get(attribute.value).count /
        totalCount;
    }
  }

  return rarity;
}

export function calculateRarityScore(rarityData: NFTRarityData[], totalSupply: number) {
  if (rarityData.length < 1) {
    return;
  }
  rarityData.sort((a, b) =>
    a.statisticalRarity > b.statisticalRarity ? 1 : -1
  );

  let rarityScoreCounter = 1;
  for (let i = 0; i < rarityData.length; i++) {
    if (
      i > 0 &&
      rarityData[i].statisticalRarity !== rarityData[i - 1].statisticalRarity
    ) {
      rarityScoreCounter = i + 1;
    }
    rarityData[i].rarityScore = rarityScoreCounter;
  }

  const minStatisticalRarity = rarityData[0].statisticalRarity;
  const maxStatisticalRarity =
    rarityData[rarityData.length - 1].statisticalRarity;

  const minRarityScore = rarityData[0].rarityScore;
  const maxRarityScore = rarityData[rarityData.length - 1].rarityScore;

  rarityData.forEach((x) => {
    x.normalizedStatisticalRarity =
      invLerp(minStatisticalRarity, maxStatisticalRarity, x.statisticalRarity) *
      100;
      /** We subtract 1 here so that rank 1 == 100 & rank N = min(rank) */
    x.normalizedRarityScore =
      invLerp(0, totalSupply, x.rarityScore - 1) * 100;
  });
}

const invLerp = (minValue: number, maxValue: number, value: number) =>
  maxValue !== minValue ? (maxValue - value) / (maxValue - minValue) : 0;
