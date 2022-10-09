import { MetaplexOffChainMetadataEntity } from '../../shared/src/entity/MetaplexOffChainMetadataEntity';
import { CollectionAttributeDataEntity } from '../../shared/src/entity/CollectionAttributeDataEntity';
import { TriggerEntity } from '../../shared/src/entity/TriggerEntity';
import { CollectionAttribute, CollectionAttributeData, CollectionAttributeValue, Entity, EntityType, NFTRarityData, RelatedEntityData } from '../../shared/src/types'
import { ddbmapper } from '../../shared/src/service/dynamodb';
import {
  equals,
} from "@aws/dynamodb-expressions";
import { IndexNames } from '../../shared/src/consts';
import { OffchainMetadata4CollectionEntity } from '../../shared/src/entity/OffchainMetadata4CollectionEntity';
import { AttributesWithMint, calculateAggregateAttributesForCollection, CollectionAttributeMap } from './calculator/attributes';
import { calculateRarityScore, calculateStatisticalRarityForMint, calculateStatisticalRarityPerTraitForCollection } from './calculator/rarity';
import { NFTRarityEntity } from '../../shared/src/entity/NFTRarityEntity';
import { groupBy, getBatchOfEntityObjects } from '../../shared/src/util/collection';

const MAX_BATCH_PUT_SIZE = Number(25);

export const processItem = async (entity: TriggerEntity<string>) => {
    const collectionId = entity.data;
    console.log(`Collection Price Processor started for collection ${collectionId}`);

    /** List of global ids of the primary entities */
    const relatedEntityDataItems: RelatedEntityData[] = [];

    /** Get all nft4collectionId objects from db for this collection (use typeIndex) */
    for await (const md of 
        ddbmapper.query(
            OffchainMetadata4CollectionEntity,
            { 
              type: EntityType.OffchainMetadata4Collection,
              primaryEntity: collectionId 
            },
            {
              indexName: IndexNames.EntityDb.typePrimaryEntityIndex,
            }
        )) 
    {
        console.log(`HandleOffchainMetadata4Collection: ${JSON.stringify(md)}`);
        relatedEntityDataItems.push(md.data);
    }

    const groupedRelatedEntityDataItems = groupBy(relatedEntityDataItems, 'type');
    /** Split by Entity Type */
    const relatedOffchainMetadataFromQuery =  groupedRelatedEntityDataItems[EntityType.MetaplexOffchainMetadata];
    /** Batch Get Requests to get all related objects */
    const offchainMetadataEntities = await getBatchOfEntityObjects(MetaplexOffChainMetadataEntity, relatedOffchainMetadataFromQuery);
    /** Store data as { mint, attributes } */
    const offchainMetadataForCollection: AttributesWithMint[] = offchainMetadataEntities.map(item => ({ mint: item.primaryEntity, attributes: item.data.attributes}));
    const totalSupply = offchainMetadataForCollection.length;
    /** Calculate aggregate attributes for collection */
    const aggregateCollectionAttributes = calculateAggregateAttributesForCollection(offchainMetadataForCollection);
    /** Calculate rarity for trait/value for colleciton */
    const aggregateCollectionAttributesWithRarity = calculateStatisticalRarityPerTraitForCollection(aggregateCollectionAttributes, totalSupply);
    console.log(`CollectionAttributeProcessor: calculation data: 
                  groupedRelatedEntityDataItems=${groupedRelatedEntityDataItems} 
                | relatedOffchainMetadataFromQuery=${relatedOffchainMetadataFromQuery}
                | offchainMetadataForCollection=${offchainMetadataForCollection}
                | totalSupply=${totalSupply}
                | aggregateCollectionAttributesWithRarity=${aggregateCollectionAttributesWithRarity}
    `)


    /** Calculate rarity for individual NFTs */
    const rarityData: NFTRarityData[] = offchainMetadataForCollection.map((x) => {
      return {
        mint: x.mint,
        statisticalRarity: calculateStatisticalRarityForMint(
          x.attributes,
          offchainMetadataForCollection.length,
          aggregateCollectionAttributes
        )
      };
    });
    calculateRarityScore(rarityData, totalSupply);
    console.log(`calculated rarity data w/ score: ${JSON.stringify(rarityData)}`);

    /** FIXME: The below can be cleaned up a bit I'm sure */

    /** Convert collection attribute data to required entity format (Map -> List) */
    const collectionAttributeList = convertCollectionAttributeMapToList(aggregateCollectionAttributesWithRarity);
    const collectionAttributeData: CollectionAttributeData = {
      attributes: collectionAttributeList
    } as CollectionAttributeData;

    /** Create DB item(s) for CollectionAttributeDataEntity */
    const collectionAttributeDataEntity = new CollectionAttributeDataEntity();
    collectionAttributeDataEntity.populate(collectionId, collectionId, collectionAttributeData);
    console.log(`CollectionAttributeDataEntity: ${JSON.stringify(collectionAttributeDataEntity)}`);
    await ddbmapper.put(collectionAttributeDataEntity);

    await batchPutRarityData(rarityData, collectionId);
    console.log(`Collection Attribute Processor complete for collection ${collectionId}`);
}

/** Very meh about this */
export const convertCollectionAttributeMapToList = (
  collectionAttributeMap: CollectionAttributeMap
): CollectionAttribute[] => {
  const collectionAttributes: CollectionAttribute[] = [];
  for (const [trait, traitValues] of collectionAttributeMap) {
    const attributeValues: CollectionAttributeValue[] = [];
    for (const [traitValue, traitValueMetadata] of traitValues) {
      attributeValues.push({
        value: traitValue,
        count: traitValueMetadata.count,
        rarity: traitValueMetadata.rarity,
      } as CollectionAttributeValue)
    }
    collectionAttributes.push({
      name: trait,
      values: attributeValues
    } as CollectionAttribute)
  }

  return collectionAttributes;
}

export const batchPutRarityData = async (rarityData: NFTRarityData[], collectionId: string) => {
    let rarityEntityItems: NFTRarityEntity[] = [];

    for (const mintRarity of rarityData) {
      /** Create NFTRarity */
      const rarityEntity = new NFTRarityEntity();
      rarityEntity.populate(mintRarity, collectionId);
      rarityEntityItems.push(rarityEntity);
      if (rarityEntityItems.length >= MAX_BATCH_PUT_SIZE) {
        console.log(`Writing rarity entities: ${JSON.stringify(rarityEntityItems)}`);
        for await (const item of ddbmapper.batchPut(rarityEntityItems)) {
          console.log(`NFTRarity entity written to db: ${JSON.stringify(item)}`);
        }
        rarityEntityItems = [];
      }
    }

    /** Put anything that's left over... */
    if (rarityEntityItems.length > 0) {
      console.log(`Writing rarity entities: ${JSON.stringify(rarityEntityItems)}`);
      for await (const item of ddbmapper.batchPut(rarityEntityItems)) {
        console.log(`NFTRarity entity written to db: ${JSON.stringify(item)}`);
      }
    }
}