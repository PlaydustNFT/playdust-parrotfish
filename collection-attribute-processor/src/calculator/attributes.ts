import { Attribute } from "../../../shared/src/types";

export interface AttributesWithMint {
  mint: string;
  attributes: Attribute[];
};
/** 
 * This function loops over each NFT in the collection
 * & updates state of attribute list for collection
 */
export interface CollectionAttributeValueCountWithRarity {
  count: number;
  rarity: number;
}
export type CollectionAttributeValueMap = Map<string | number, CollectionAttributeValueCountWithRarity>;
export type CollectionAttributeMap = Map<string, CollectionAttributeValueMap>;
export const calculateAggregateAttributesForCollection = (
  attributesForAllMintsInCollection: AttributesWithMint[],
): CollectionAttributeMap => {
  /** FIXME This is a bit complex, we can probably use something like... 
   * 
   * groupedByTraitType = groupBy(attributes, 'trait_type')
   * for (const [key, value] in groupedByTraitType) {
   *   groupedByValue = groupBy(value, 'value')
   *   set groupedByTraitType[key] = groupedByValue
   * }
   * 
  */
  const collectionAttributeMap = new Map<string, CollectionAttributeValueMap>();
  console.log(`calculateAggregateAttributesForCollection: ${attributesForAllMintsInCollection}`);
  for (const attributeSetWithMint of attributesForAllMintsInCollection) {
    console.log(`Iteration: AttributeSetWithMint: ${JSON.stringify(attributeSetWithMint)}`);
    for (const attribute of attributeSetWithMint.attributes) {
      console.log(`Inner Iteration: attribute: ${JSON.stringify(attribute)}`);
      /** FIXME: when would `trait_type` not be set?
       * How should we handle trait aggregations for collection when it's not set?
       */
      let trait = collectionAttributeMap.get(attribute?.trait_type);
      if (!trait) {
      /** FIXME: when would `trait_type` not be set?
        /** First item for this trait! */
        trait = new Map<string, CollectionAttributeValueCountWithRarity>();
        console.log(`Trait type [${attribute.trait_type}] freshly added to map`);
      }
      let traitValue = trait.get(attribute.value);
      if (!traitValue) {
        traitValue = {
          count: 0,
          rarity: 0,
        } as CollectionAttributeValueCountWithRarity;
      }
      traitValue.count += 1;
      trait.set(attribute.value, traitValue);
      const updatedTraitValue = trait.get(attribute.value);

      collectionAttributeMap.set(attribute.trait_type, trait);
      const updatedTraitTypeValue = collectionAttributeMap.get(attribute.trait_type);
    }
  }
  console.log(`Attribute mapping complete. Map: ${JSON.stringify(Array.from(collectionAttributeMap.entries()))}`);
  return collectionAttributeMap;
}