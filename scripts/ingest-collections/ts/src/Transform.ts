import { CollectionAttributeData, CollectionMetaData, CollectionPriceData, CollectionType, PlaydustCollectionData } from '../../../../shared/src/types';

interface CollectionData<T> {
    id: string;
    primaryEntity: string;
    data: T;
}

export function extractPlaydustCollectionData(collections) {
    let data: CollectionData<PlaydustCollectionData>[] = [];
    for (const collection of collections) {
        data.push({
            id: [collection.firstCreator, collection.symbol].join('-'),
            primaryEntity: collection.firstCreator,
            data: {
                type: CollectionType.Derived,
                id: collection.firstCreator
            }
        });
    }
    return data;
}

export function extractMetaData(collections) {
    let metaData: CollectionData<CollectionMetaData>[] = [];
    for (const collection of collections) {
        let primaryEntity = [collection.firstCreator, collection.symbol].join('-');
        metaData.push({
            id: collection.id,
            primaryEntity: primaryEntity,
            data: {
                symbol: collection.symbol,
                description: collection.description,
                elementCount: collection.elementCount,
                creator: collection.firstCreator,
                family: collection.family,
                updateAuthority: null,
            }
        });
    }
    return metaData;
}

export function extractAttributeData(collections) {
    let attrData: CollectionData<CollectionAttributeData>[] = [];
    for (const collection of collections) {
        let primaryEntity = [collection.firstCreator, collection.symbol].join('-');
        attrData.push({
            id: collection.id,
            primaryEntity: primaryEntity,
            data: {
                attributes: collection.attributes.map(attribute => {
                    return {
                        name: attribute.name,
                        values: attribute.values.map(value => {
                            return {
                                count: value.c,
                                value: value.v
                            }
                        })
                    }
                })
            }
        });
    }
    return attrData;
}

export function extractPriceData(collections) {
    let priceData: CollectionData<CollectionPriceData>[] = [];
    for (const collection of collections) {
        let primaryEntity = [collection.firstCreator, collection.symbol].join('-');
        priceData.push({
            id: collection.id,
            primaryEntity: primaryEntity,
            data: {
                totalVolume: collection.totalVolume,
                floorPrice: collection.floorPrice,
                ceilingPrice: collection.ceilingPrice
            }
        });
    }
    return priceData;
}