import { AttributesWithMint } from "../../src/calculator/attributes";
import { Attribute } from "../../../shared/src/types";

export const MINT_PREFIX = 'mint_';
export const ATTRIBUTE_PREFIX = 'attribute_';
export const VALUE_PREFIX = 'value_';
const createAttributesForSpecificMint = (
    current: number,
    total: number,
    numberOfTraits: number,
    valuesPerTrait: number,
): AttributesWithMint => {
    const attributesWithMint = {
        mint: MINT_PREFIX + current,
        attributes: [],

    } as AttributesWithMint;
    let traitNumber = numberOfTraits;

    for (let i = total; i > current; i--) {
        if ((total - i) % valuesPerTrait == 0) {
            traitNumber--;
        }
        const attribute: Attribute = {
            trait_type: ATTRIBUTE_PREFIX+traitNumber,
            display_type: 'string',
            value: VALUE_PREFIX+i,
        } as Attribute;
        attributesWithMint.attributes.push(attribute);
    }
    return attributesWithMint;
}

export const createAttributesForAllMints = (
    numberOfValues: number,
    numberOfTraits: number,
    valuesPerTrait: number,
): AttributesWithMint[] => {
    const attributesWithMint:AttributesWithMint[] = [];
    for (let i = 0; i < numberOfValues; i++) {
        attributesWithMint.push(createAttributesForSpecificMint(i, numberOfValues, numberOfTraits, valuesPerTrait));
    }
    return attributesWithMint;
}