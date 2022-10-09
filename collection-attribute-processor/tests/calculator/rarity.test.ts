import { NFTRarityData } from "../../../shared/src/types";
import { AttributesWithMint, calculateAggregateAttributesForCollection } from "../../src/calculator/attributes";
import { calculateRarityScore, calculateStatisticalRarityForMint, calculateStatisticalRarityPerTraitForCollection } from "../../src/calculator/rarity"
import { 
    createAttributesForAllMints,
    VALUE_PREFIX,
    MINT_PREFIX,
    ATTRIBUTE_PREFIX,
} from "./shared";
describe("Verify attribute calculator", () => {
    /* 
     * Attribute list has 3 attributes 
     * Each attribute has 4 values
     * 
     * Verify that the 4 values from each attribute have their expected count
     * 
     * -----
     * total supply: 8
     * attr1
     *  value1: 1/8
     *  value2: 2/8
     *  value3: 3/8
     *  value4: 4/8
     * attr2
     *  value5: 5/8
     *  value6: 6/8
     *  value6: 7/8
     *  value8: 8/8
    */

  const attributesForAllMints: AttributesWithMint[] = createAttributesForAllMints(8, 2, 4);
  const DENOMINATOR = 8;
  const aggregation = calculateAggregateAttributesForCollection(attributesForAllMints);
  const rarty = calculateStatisticalRarityPerTraitForCollection(aggregation, attributesForAllMints.length);
  it('Verify attribute 1 values rarity', () => {
    const attributeData = aggregation.get(ATTRIBUTE_PREFIX+0);
    expect(attributeData.get(VALUE_PREFIX+1).rarity).toStrictEqual(1/DENOMINATOR);
    expect(attributeData.get(VALUE_PREFIX+2).rarity).toStrictEqual(2/DENOMINATOR);
    expect(attributeData.get(VALUE_PREFIX+3).rarity).toStrictEqual(3/DENOMINATOR);
    expect(attributeData.get(VALUE_PREFIX+4).rarity).toStrictEqual(4/DENOMINATOR);
  });
  it('Verify attribute 2 values rarity', () => {
    const attributeData = aggregation.get(ATTRIBUTE_PREFIX+1);
    expect(attributeData.get(VALUE_PREFIX+5).rarity).toStrictEqual(5/DENOMINATOR);
    expect(attributeData.get(VALUE_PREFIX+6).rarity).toStrictEqual(6/DENOMINATOR);
    expect(attributeData.get(VALUE_PREFIX+7).rarity).toStrictEqual(7/DENOMINATOR);
    expect(attributeData.get(VALUE_PREFIX+8).rarity).toStrictEqual(8/DENOMINATOR);
  });
  /** Verify per NFT rarity calculation 
   * 
   * Requires NFTRarityData object(s)
   * 
   * NFT mint address 
  */
  const totalSupply: number = attributesForAllMints.length;
  const rarityData: NFTRarityData[] = attributesForAllMints.map((x) => {
    return {
      mint: x.mint,
      statisticalRarity: calculateStatisticalRarityForMint(
        x.attributes,
        totalSupply,
        aggregation
      )
    };
  });
  it('Verify rarity per mint', () => {
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+0)[0].statisticalRarity)
                                    .toStrictEqual((1/DENOMINATOR)
                                                *(2/DENOMINATOR)
                                                *(3/DENOMINATOR)
                                                *(4/DENOMINATOR)
                                                *(5/DENOMINATOR)
                                                *(6/DENOMINATOR)
                                                *(7/DENOMINATOR));
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+1)[0].statisticalRarity)
                                    .toStrictEqual((2/DENOMINATOR)
                                                *(3/DENOMINATOR)
                                                *(4/DENOMINATOR)
                                                *(5/DENOMINATOR)
                                                *(6/DENOMINATOR)
                                                *(7/DENOMINATOR));
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+2)[0].statisticalRarity)
                                    .toStrictEqual((3/DENOMINATOR)
                                                *(4/DENOMINATOR)
                                                *(5/DENOMINATOR)
                                                *(6/DENOMINATOR)
                                                *(7/DENOMINATOR));
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+3)[0].statisticalRarity)
                                    .toStrictEqual((4/DENOMINATOR)
                                                *(5/DENOMINATOR)
                                                *(6/DENOMINATOR)
                                                *(7/DENOMINATOR));
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+4)[0].statisticalRarity)
                                    .toStrictEqual((5/DENOMINATOR)
                                                *(6/DENOMINATOR)
                                                *(7/DENOMINATOR));
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+5)[0].statisticalRarity)
                                    .toStrictEqual((6/DENOMINATOR)
                                                *(7/DENOMINATOR));
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+6)[0].statisticalRarity)
    .toStrictEqual(7/DENOMINATOR);
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+7)[0].statisticalRarity)
    .toStrictEqual(8/DENOMINATOR);
  });
  it('Verify ranking per mint', () => {
    calculateRarityScore(rarityData, totalSupply);
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+0)[0].rarityScore).toStrictEqual(1);
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+1)[0].rarityScore).toStrictEqual(2);
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+2)[0].rarityScore).toStrictEqual(3);
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+3)[0].rarityScore).toStrictEqual(4);
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+4)[0].rarityScore).toStrictEqual(5);
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+5)[0].rarityScore).toStrictEqual(6);
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+6)[0].rarityScore).toStrictEqual(7);
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+7)[0].rarityScore).toStrictEqual(8);

    /** I don't actually know if these values are the desired result */
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+0)[0].normalizedRarityScore).toStrictEqual(100);
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+1)[0].normalizedRarityScore).toStrictEqual(87.5);
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+2)[0].normalizedRarityScore).toStrictEqual(75);
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+3)[0].normalizedRarityScore).toStrictEqual(62.5);
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+4)[0].normalizedRarityScore).toStrictEqual(50);
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+5)[0].normalizedRarityScore).toStrictEqual(37.5);
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+6)[0].normalizedRarityScore).toStrictEqual(25);
    expect(rarityData.filter(item => item.mint == MINT_PREFIX+7)[0].normalizedRarityScore).toStrictEqual(12.5);
  });
  /** Verify per NFT ranking */
})