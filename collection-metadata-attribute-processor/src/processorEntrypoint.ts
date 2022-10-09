import { CollectionType, CollectionMetaData, OffChainMetadata, Metadata, EntityType, RelatedEntityData, NFTRarityData, CollectionAttributeData,
    CollectionAttributeValue, CollectionAttribute, PlaydustCollectionData } from '../../shared/src/types';
import { ddbmapper } from '../../shared/src/service/dynamodb';
import * as AWS from 'aws-sdk';
import { IndexNames } from '../../shared/src/consts';
import { AttributesWithMint, calculateAggregateAttributesForCollection, CollectionAttributeMap } from './calculator/attributes';
import { calculateRarityScore, calculateStatisticalRarityForMint, calculateStatisticalRarityPerTraitForCollection } from './calculator/rarity';
import { groupBy, getBatchOfEntityObjects } from '../../shared/src/util/collection';
import { CollectionMetaDataEntity } from '../../shared/src/entity/CollectionMetaDataEntity';
import { OffchainMetadata4CollectionEntity } from '../../shared/src/entity/OffchainMetadata4CollectionEntity';
import { NFTRarityEntity } from '../../shared/src/entity/NFTRarityEntity';
import { MetaplexOffChainMetadataEntity } from '../../shared/src/entity/MetaplexOffChainMetadataEntity';
import { MetaplexOnChainMetadataEntity } from '../../shared/src/entity/MetaplexOnChainMetadataEntity';
import { CollectionAttributeDataEntity } from '../../shared/src/entity/CollectionAttributeDataEntity';
import { PlaydustCollectionEntity } from '../../shared/src/entity/PlaydustCollectionEntity';
import { NFT4CollectionEntity } from '../../shared/src/entity/NFT4CollectionEntity';
import { sendToQueue } from '../../shared/src/util/aws';

const MAX_BATCH_PUT_SIZE = Number(25);
const MAX_COLLECTION_SIZE =
        process.env.MAX_COLLECTION_SIZE
        || 10000;

const MAX_ITEM_LENGTH_DDB =
        process.env.MAX_ITEM_LENGTH_DDB
        || 400000;

const sqs = new AWS.SQS({apiVersion: '2012-11-05', region: 'us-east-1'});
/** Fetch queue url for relevant sqs queue */
let queueUrlNFTOS = '';
sqs.getQueueUrl({ QueueName: process.env.NFT_QUEUE_NAME }, function(err, data) {
    if (err) {
        console.error(err, err.stack);
    }
    else {
        queueUrlNFTOS = data.QueueUrl;
    }
});

/** Fetch queue url for relevant sqs queue */
let queueUrlCollectionOS = '';
sqs.getQueueUrl({ QueueName: process.env.COLLECTION_OS_QUEUE_NAME }, function(err, data) {
    if (err) {
        console.error(err, err.stack);
    }
    else {
        queueUrlCollectionOS = data.QueueUrl;
    }
});

const isOversizedForDynamoDB = (obj: any) => {
    return Buffer.from(JSON.stringify(obj)).length >= MAX_ITEM_LENGTH_DDB;
}

function longestCommonPrefix(words: string[]){
    // check border cases size 1 array and empty first word)
    if (!words[0] || words.length ==  1) return words[0] || "";
    let i = 0;
    // while all words have the same character at position i, increment i
    while(words[0][i] && words.every(w => w[i] === words[0][i])){
        i++;
    }
    // prefix is the substring from the beginning to the last successfully checked i
    //return words[0].substr(0, i);
    return words[0].substring(0, i);
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
        rarityEntityItems = [...new Map(rarityEntityItems.map(item =>
            [item['globalId'], item])).values()];
        for await (const item of ddbmapper.batchPut(rarityEntityItems)) {
        }
        rarityEntityItems = [];
    }
    }

    /** Put anything that's left over... */
    if (rarityEntityItems.length > 0) {
        rarityEntityItems = [...new Map(rarityEntityItems.map(item =>
            [item['globalId'], item])).values()];
        for await (const item of ddbmapper.batchPut(rarityEntityItems)) {
        }
    }
}


export const processItem = async (collectionId: string) => {

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
        relatedEntityDataItems.push(md.data);
    }

    const groupedRelatedEntityDataItems = groupBy(relatedEntityDataItems, 'type');
    /** Split by Entity Type */
    const relatedOffchainMetadataFromQuery =  groupedRelatedEntityDataItems[EntityType.MetaplexOffchainMetadata];
    if (relatedOffchainMetadataFromQuery !== undefined && relatedOffchainMetadataFromQuery.length > MAX_COLLECTION_SIZE) {
        console.log(`FAIL|LARGE_COLLECTION|collectionId=${collectionId}|size=${relatedOffchainMetadataFromQuery.length}`);
        return;
    }

    /** Batch Get Requests to get all related objects */
    const offchainMetadataEntities = await getBatchOfEntityObjects(MetaplexOffChainMetadataEntity, relatedOffchainMetadataFromQuery);
    /** Store data as { mint, attributes } */
    const offchainMetadataForCollection: AttributesWithMint[] = offchainMetadataEntities.map(item => ({ mint: item.primaryEntity, attributes: item.data.attributes}));
    const totalSupply = offchainMetadataForCollection.length;
    /** Calculate aggregate attributes for collection */
    const aggregateCollectionAttributes = calculateAggregateAttributesForCollection(offchainMetadataForCollection, totalSupply);
    /** Calculate rarity for trait/value for colleciton */
    const aggregateCollectionAttributesWithRarity = calculateStatisticalRarityPerTraitForCollection(aggregateCollectionAttributes, totalSupply);

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

    /** FIXME: The below can be cleaned up a bit I'm sure */

    /** Convert collection attribute data to required entity format (Map -> List) */
    const collectionAttributeList = convertCollectionAttributeMapToList(aggregateCollectionAttributesWithRarity);
    const collectionAttributeData: CollectionAttributeData = {
      attributes: collectionAttributeList
    } as CollectionAttributeData;

    /** Create DB item(s) for CollectionAttributeDataEntity */
    const collectionAttributeDataEntity = new CollectionAttributeDataEntity();
    collectionAttributeDataEntity.populate(collectionId, collectionId, collectionAttributeData);
    if (isOversizedForDynamoDB(collectionAttributeData)) {
        console.log(`FAIL|reason=too big|data=${JSON.stringify(collectionAttributeData)}`);
    }
    else {
        console.log(`WRITE|mode=attr|data=${JSON.stringify(collectionAttributeDataEntity)}`);
        await ddbmapper.put(collectionAttributeDataEntity);
    }

    await batchPutRarityData(rarityData, collectionId);

    let collectionData: PlaydustCollectionData;
    let collectionMetadata: CollectionMetaData = {};
    let elementCount = 0;
    const mintAddressList: string [] = [];

    /** Directly call get to fetch playdust collection  */
    const playdustCollection = new PlaydustCollectionEntity();
    playdustCollection.id = collectionId;
    playdustCollection.type = EntityType.PlaydustCollection;
    playdustCollection.globalId = playdustCollection.generateGlobalId();
    collectionData = (await ddbmapper.get(playdustCollection)).data;

    let collectionMetadataEntity: CollectionMetaDataEntity = new CollectionMetaDataEntity();
    if(collectionData){
        if(collectionData.type == CollectionType.Metaplex){
            for await (const item of ddbmapper.query( NFT4CollectionEntity, { primaryEntity: collectionData.id, type: EntityType.NFT4Collection}, { indexName: IndexNames.EntityDb.typePrimaryEntityIndex} )) {
                if(item.type == EntityType.NFT4Collection){
                    elementCount++;
                    mintAddressList.push(item.data);
                }
            }
            for await (const item of ddbmapper.query( MetaplexOnChainMetadataEntity, { primaryEntity: collectionData.id, type: EntityType.MetaplexOnChainMetadata}, { indexName: IndexNames.EntityDb.typePrimaryEntityIndex} )) {
                if(item.type == EntityType.MetaplexOnChainMetadata){
                    collectionMetadata.name = item.data.data.name;
                    collectionMetadata.symbol = item.data.data.symbol;
                    collectionMetadata.updateAuthority = item.data.updateAuthority;
                    for (const creator of item.data.data.creators.reverse()){
                        if(creator.verified){
                            collectionMetadata.creator = creator.address;
                            break;
                        }
                    }
                }
            }
            for await (const item of ddbmapper.query( MetaplexOffChainMetadataEntity, { primaryEntity: collectionData.id, type: EntityType.MetaplexOffchainMetadata}, { indexName: IndexNames.EntityDb.typePrimaryEntityIndex} )) {
                if(item.type == EntityType.MetaplexOffchainMetadata){
                    collectionMetadata.description = item.data.description;
                    collectionMetadata.family = item.data.collection?.family;
                    collectionMetadata.image = item.data.image;
                }
            }
            collectionMetadata.elementCount = elementCount;

        }else if(collectionData.type == CollectionType.Derived){
            for await (const item of ddbmapper.query( NFT4CollectionEntity, { primaryEntity: collectionData.id, type: EntityType.NFT4Collection }, { indexName: IndexNames.EntityDb.typePrimaryEntityIndex} )) {
                if(item.type == EntityType.NFT4Collection){
                    mintAddressList.push(item.data);
                    elementCount++;
                }
            }
            let onchainMetadata: Metadata[] =[];
            let offchainMetadata: OffChainMetadata[] = [];
            for (const mint of mintAddressList) {
                if (onchainMetadata.length >= 2 && offchainMetadata.length >= 2) {
                    /** We only need metadata for 2 mint addresses to calculate LCP */
                    break;
                }
                for await (const item of ddbmapper.query( MetaplexOnChainMetadataEntity, { primaryEntity: mint, type: EntityType.MetaplexOnChainMetadata }, { indexName: IndexNames.EntityDb.typePrimaryEntityIndex} )) {
                    if(item.type == EntityType.MetaplexOnChainMetadata){
                        onchainMetadata.push(item.data);
                    }
                }
                for await (const item of ddbmapper.query( MetaplexOffChainMetadataEntity, { primaryEntity: mint, type: EntityType.MetaplexOffchainMetadata }, { indexName: IndexNames.EntityDb.typePrimaryEntityIndex} )) {
                    if(item.type == EntityType.MetaplexOffchainMetadata){
                        offchainMetadata.push(item.data);
                    }
                }
            }
            collectionMetadata.elementCount = elementCount;
            if(onchainMetadata.length >= 2 && offchainMetadata.length >= 2){
                if(offchainMetadata[0].description && offchainMetadata[1].description){
                    collectionMetadata.description = longestCommonPrefix([offchainMetadata[0].description, offchainMetadata[1].description]);
                    if(collectionMetadata.description[collectionMetadata.description.length - 1] == '#')
                    {
                        collectionMetadata.description = collectionMetadata.description.substring(0, collectionMetadata.description.length - 1);
                    }
                }
                if(onchainMetadata[0].data?.name && onchainMetadata[1].data?.name){
                    collectionMetadata.name = longestCommonPrefix([onchainMetadata[0].data.name, onchainMetadata[1].data.name]);
                    collectionMetadata.name.replace(/\d+$/, ""); //remove digits at the end and then check for #
                    if(collectionMetadata.name[collectionMetadata.name.length - 1] == '#')
                    {
                        collectionMetadata.name = collectionMetadata.name.substring(0, collectionMetadata.name.length - 1);
                    }
                }
                if(onchainMetadata[0].data?.symbol && onchainMetadata[1].data?.symbol){
                    collectionMetadata.symbol = longestCommonPrefix([onchainMetadata[0].data.symbol, onchainMetadata[1].data.symbol]);
                    if(collectionMetadata.symbol[collectionMetadata.symbol.length - 1] == '#')
                    {
                        collectionMetadata.symbol = collectionMetadata.symbol.substring(0, collectionMetadata.symbol.length - 1);
                    }
                }
                if(offchainMetadata[0].collection?.family && offchainMetadata[1].collection?.family){
                    collectionMetadata.family = longestCommonPrefix([offchainMetadata[0].collection.family, offchainMetadata[1].collection.family]);
                    if(collectionMetadata.family[collectionMetadata.family.length - 1] == '#')
                    {
                        collectionMetadata.family = collectionMetadata.family.substring(0, collectionMetadata.family.length - 1);
                    } 
                }
                if(offchainMetadata[0].image && offchainMetadata[1].image){
                    collectionMetadata.image = longestCommonPrefix([offchainMetadata[0].image, offchainMetadata[1].image]);
                    if(collectionMetadata.image[collectionMetadata.image.length - 1] == '#')
                    {
                        collectionMetadata.image = collectionMetadata.image.substring(0, collectionMetadata.image.length - 1);
                    } 
                }
            }
        } else if(collectionData.type == CollectionType.MagicEden){
            collectionMetadataEntity.id = collectionId;
            collectionMetadataEntity.type = EntityType.CollectionMetaData;
            collectionMetadataEntity.globalId = collectionMetadataEntity.generateGlobalId();
            collectionMetadata = (await ddbmapper.get(collectionMetadataEntity)).data;
            for await (const item of ddbmapper.query( NFT4CollectionEntity, { primaryEntity: collectionData.id, type: EntityType.NFT4Collection }, { indexName: IndexNames.EntityDb.typePrimaryEntityIndex} )) {
                if(item.type == EntityType.NFT4Collection){
                    mintAddressList.push(item.data);
                    elementCount++;
                }
            }
            collectionMetadata.elementCount = elementCount;
        }
    }

    if(collectionData){
        collectionMetadataEntity.populate(collectionData.id, collectionData.id, collectionMetadata);
        //let's wait for the PUT to the DB to complete before ending the lambda
        if (isOversizedForDynamoDB(collectionMetadataEntity)) {
            console.log(`FAIL|reason=too big|data=${JSON.stringify(collectionAttributeData)}`);
        }
        else {
            console.log(`WRITE|mode=meta|data=${JSON.stringify(collectionMetadataEntity)}`);
            await ddbmapper.put(collectionMetadataEntity).then((values) =>{})
            .catch(error => {
                console.error(error.message);
                throw('Error inserting the elements into the DB');
            });
        }
    }
    /** Write mint address list to the SQS queue for OS ingestion*/
    await sendToQueue(sqs, queueUrlNFTOS, mintAddressList);

    /** Write CollectionId to the SQS queue for OS ingestion*/
    await sendToQueue(sqs, queueUrlCollectionOS, [collectionId]);
}
