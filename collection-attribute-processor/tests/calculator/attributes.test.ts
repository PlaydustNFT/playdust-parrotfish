import { calculateAggregateAttributesForCollection } from "../../src/calculator/attributes";
import { 
    createAttributesForAllMints,
    VALUE_PREFIX,
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
     * 
     * attr1
     *  value1: 1x
     *  value2: 2x
     *  value3: 3x
     *  value4: 4x
     * attr2
     *  value5: 5x
     *  value6: 6x
     *  value6: 7x
     *  value8: 8x
    */

  const attributesForAllMints = createAttributesForAllMints(8, 2, 4);
  const aggregation = calculateAggregateAttributesForCollection(attributesForAllMints);
  it('Verify attribute 1 values count', () => {
    const attributeData = aggregation.get(ATTRIBUTE_PREFIX+0);
    expect(attributeData.get(VALUE_PREFIX+1).count).toStrictEqual(1);
    expect(attributeData.get(VALUE_PREFIX+2).count).toStrictEqual(2);
    expect(attributeData.get(VALUE_PREFIX+3).count).toStrictEqual(3);
    expect(attributeData.get(VALUE_PREFIX+4).count).toStrictEqual(4);
  });
  it('Verify attribute 2 values count', () => {
    const attributeData = aggregation.get(ATTRIBUTE_PREFIX+1);
    expect(attributeData.get(VALUE_PREFIX+5).count).toStrictEqual(5);
    expect(attributeData.get(VALUE_PREFIX+6).count).toStrictEqual(6);
    expect(attributeData.get(VALUE_PREFIX+7).count).toStrictEqual(7);
    expect(attributeData.get(VALUE_PREFIX+8).count).toStrictEqual(8);
  });
})