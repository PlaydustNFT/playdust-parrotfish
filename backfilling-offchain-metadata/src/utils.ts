/**
 * Normalizes the off-chain metadata so that it has consistent structure required by OpenSearch.
 * Non-compatible data fields will be omitted.
 * 
 * @param {*} offchainMetadata  off-chain metadata
 * @returns normalized off-chain metadata object
 */
 //export module utilsNormalize {
export function normalizeOffChainMetadata (offchainMetadata: any) {
    let obj: any = {};

    obj.name = getValueIfTypeMatches(offchainMetadata, 'name', 'string');
    obj.symbol = getValueIfTypeMatches(offchainMetadata, 'symbol', 'string');
    obj.external_url = getValueIfTypeMatches(offchainMetadata, 'external_url', 'string');
    obj.description = getValueIfTypeMatches(offchainMetadata, 'description', 'string');
    obj.seller_fee_basis_points = getValueIfTypeMatches(offchainMetadata, 'seller_fee_basis_points', 'number');
    obj.image = getValueIfTypeMatches(offchainMetadata, 'image', 'string');
    obj.animation_url = getValueIfTypeMatches(offchainMetadata, 'animation_url', 'string');
    obj.attributes = getValueIfTypeMatches(offchainMetadata, 'attributes', 'Array')?.map((a: any) => {return {
        trait_type: getValueIfTypeMatches(a, 'trait_type', 'string'),
        value: '' + getValueIfTypeMatches(a, 'value', ['string', 'number']),
    }}).filter((a: any) => !!a.trait_type);
    obj.collection = typeof offchainMetadata.collection === 'object' ? {
        name: getValueIfTypeMatches(offchainMetadata.collection, 'name', 'string'),
        family: getValueIfTypeMatches(offchainMetadata.collection, 'family', 'string')
    } : undefined;
    obj.properties = typeof offchainMetadata.properties === 'object' ? {
        files: getValueIfTypeMatches(offchainMetadata.properties, 'files', 'Array')?.map((f: any) => {
            return {
                uri: getValueIfTypeMatches(f, 'uri', 'string'),
                type: getValueIfTypeMatches(f, 'type', 'string'),
                cdn: getValueIfTypeMatches(f, 'cdn', 'string')
            };
        }).filter((f: any) => !!f.uri || !!f.cdn),
        category: getValueIfTypeMatches(offchainMetadata.properties, 'category', 'string'),
        creators: getValueIfTypeMatches(offchainMetadata.properties, 'creators', 'Array')?.map((c: any) => {
            return {
                address: getValueIfTypeMatches(c, 'address', 'string'),
                verified: getValueIfTypeMatches(c, 'verified', 'boolean'),
                share: getValueIfTypeMatches(c, 'share', 'number')
            };
        }).filter((c: any) => !!c.address)
    } : undefined;

    return obj;
}

function getValueIfTypeMatches(obj: any, key: string, keyType: string | string[]) {
    if (Object.prototype.toString.call(keyType) === '[object Array]') {
        for (const t of keyType) {
            if (typeof obj[key] === t) {
                return obj[key];
            }
        }
    } else if (keyType === 'Array') {
        if (Object.prototype.toString.call(obj[key]) === '[object Array]') {
            return obj[key];
        }
    } else if (typeof obj[key] === keyType) {
        return obj[key];
    }
}

