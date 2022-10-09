import { fetchCollections } from "./OpenSearchUtils";
import { extractAttributeData, extractMetaData, extractPlaydustCollectionData, extractPriceData } from "./Transform";
import { CollectionMetaDataEntity } from "../../../../shared/src/entity/CollectionMetaDataEntity";
import { CollectionAttributeDataEntity } from "../../../../shared/src/entity/CollectionAttributeDataEntity";
import { CollectionPriceDataEntity } from "../../../../shared/src/entity/CollectionPriceDataEntity";
import { PlaydustCollectionEntity } from "../../../../shared/src/entity/PlaydustCollectionEntity";
import { ddbmapper } from "../../../../shared/src/service/dynamodb";

/**
 * This is a script that ingests some of the readymade collections from
 * an existing OpenSearch index, transforms them into proper entities 
 * and saves them to the entitydb.
 */
export async function main() {
    // define collection IDs
    let collectionIds = [
        '5c50fbae-d7ff-456f-8f9a-f79cc9396743', // DAPE
        '360c9265-6a01-435a-8783-fd38661a36c5', // Boryoku Dragonz
    ];

    // fetch collections from opensearch
    let collections = await fetchCollections(collectionIds);

    // extract the data
    let playdustCollectionData = extractPlaydustCollectionData(collections);
    let collectionMetaData = extractMetaData(collections);
    let collectionAttributeData = extractAttributeData(collections);
    let collectionPriceData = extractPriceData(collections);
    
    // instantiate entities
    let playdustCollectionEntities: PlaydustCollectionEntity[] = [];
    for (const colData of playdustCollectionData) {
        let entity = new PlaydustCollectionEntity();
        entity.populate(colData.id, colData.primaryEntity, colData.data);
        playdustCollectionEntities.push(entity);
    }

    let collectionMetaDataEntities: CollectionMetaDataEntity[] = [];
    for (const colData of collectionMetaData) { 
        let entity = new CollectionMetaDataEntity();
        entity.populate(colData.id, colData.primaryEntity, colData.data);
        collectionMetaDataEntities.push(entity);
    }

    let collectionAttributeDataEntities: CollectionAttributeDataEntity[] = [];
    for (const colData of collectionAttributeData) { 
        let entity = new CollectionAttributeDataEntity();
        entity.populate(colData.id, colData.primaryEntity, colData.data);
        collectionAttributeDataEntities.push(entity);
    }

    let collectionPriceDataEntities: CollectionPriceDataEntity[] = [];
    for (const colData of collectionPriceData) { 
        let entity = new CollectionPriceDataEntity();
        entity.populate(colData.id, colData.primaryEntity, colData.data);
        collectionPriceDataEntities.push(entity);
    }

    console.log(JSON.stringify(playdustCollectionEntities));
    console.log(JSON.stringify(collectionMetaDataEntities));
    console.log(JSON.stringify(collectionAttributeDataEntities));
    console.log(JSON.stringify(collectionPriceDataEntities));

    // save to entitydb
    ddbmapper.batchPut(collectionMetaDataEntities);
    ddbmapper.batchPut(collectionAttributeDataEntities);
    ddbmapper.batchPut(collectionPriceDataEntities);
     
}

main();