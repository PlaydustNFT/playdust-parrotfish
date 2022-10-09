import { EntityType, CollectionSource } from '../../shared/src/types';
import { ddbmapper } from '../../shared/src/service/dynamodb';
import { Entity } from '../../shared/src/entity/Entity';
import { PlaydustCollectionEntity } from '../../shared/src/entity/PlaydustCollectionEntity';
import { CollectionAttributeDataEntity } from '../../shared/src/entity/CollectionAttributeDataEntity';
import { CollectionMetaDataEntity } from '../../shared/src/entity/CollectionMetaDataEntity';
import { CollectionPriceDataEntity } from '../../shared/src/entity/CollectionPriceDataEntity';
import axios from 'axios';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { IndexNames } from '../../shared/src/consts';

const indexCollection = 
    String(process.env.COLLECTION_OPEN_SEARCH_INDEX)
    || 'nft-collection';
// FIXME: Move these somewhere else...
const url = 
    String(process.env.OPEN_SEARCH_URL)
    || 'https://opensearch-url/_bulk';
const auth = {
    username: String(process.env.OPEN_SEARCH_USERNAME) || 'playdust',
    password: String(process.env.OPEN_SEARCH_PASSWORD) || 'fdj.rya9ady.VYJ_mrg'
};

function buildBulkRequestPayload(documents) {
    let payloadLines = [];
    for (let i = 0; i < documents.length; i++) {
        let optionsObject = {
            update: {
                _index: indexCollection,
                _id: documents[i].id
            }
        }
        payloadLines.push(JSON.stringify(optionsObject));
        let docObject = {
            doc: documents[i],
            doc_as_upsert: true
        }
        payloadLines.push(JSON.stringify(docObject));
    }
    return payloadLines.join('\n') + '\n';
}

export const processItem = async (collectionIds: string[]) => {
    console.log(`OPEN_SEARCH_INDEX=${indexCollection}`);
    let documents = [];

    let i = 0;
    for(const collectionId of collectionIds){
        try {
            console.log('processing ' + i + '-th item');
            //CollectionId
            let itemArray: any[] = [];
            let collectionOS: CollectionSource = {};
        
                let entity: PlaydustCollectionEntity = new PlaydustCollectionEntity();
                // FIXME: avoid creating expected global ids in client code
                entity.globalId = EntityType.PlaydustCollection + '-' + collectionId;

            try {
                let item = await ddbmapper.get(entity)
                console.log(JSON.stringify(item));
                itemArray.push(item);
            } catch(err) {
                console.error(`Collection not found! Ending processor! ${err}`);
                return;
            }
        
            /** CollectionAttributeData */
            for await (const item of ddbmapper.query(CollectionAttributeDataEntity,
                { type: EntityType.CollectionAttributeData, primaryEntity: collectionId },
                { indexName: IndexNames.EntityDb.typePrimaryEntityIndex }
            )) {
                console.log(JSON.stringify(item));
                itemArray.push(item);
            }
            /** CollectionMetaData */
            for await (const item of ddbmapper.query(CollectionMetaDataEntity,
                { type: EntityType.CollectionMetaData, primaryEntity: collectionId },
                { indexName: IndexNames.EntityDb.typePrimaryEntityIndex }
            )) {
                console.log(JSON.stringify(item));
                itemArray.push(item);
            }
            /** CollectionPriceData */
            for await (const item of ddbmapper.query(CollectionPriceDataEntity,
                { type: EntityType.CollectionPriceData, primaryEntity: collectionId },
                { indexName: IndexNames.EntityDb.typePrimaryEntityIndex }
            )) {
                console.log(JSON.stringify(item));
                itemArray.push(item);
            }


            for(const item of itemArray){
                console.log(JSON.stringify(item));
                switch(item.type){
                    case EntityType.PlaydustCollection:
                        collectionOS['id'] = item.data.id;
                        collectionOS['collectionType'] = item.data.type;
                        break;
                    case EntityType.CollectionAttributeData: 
                        collectionOS['attributes'] = [];
                        for(const attribute of item.data.attributes){
                            let tmpObj = {
                                key: attribute.name,
                                values: []
                            }
                            for(const item of attribute.values)
                            {
                                tmpObj.values.push({
                                    count: item.count,
                                    value: item.value
                                })
                            }
                            collectionOS['attributes'].push(tmpObj);
                        }
                        break;
                    case EntityType.CollectionMetaData:
                        collectionOS['symbol'] = item.data.symbol;
                        collectionOS['description'] = item.data.description;
                        collectionOS['elementCount'] = item.data.elementCount;
                        collectionOS['name'] = item.data.name;
                        collectionOS['image'] = item.data.image;
                        break;
                    case EntityType.CollectionPriceData:
                        const priceData = item.data;
                        collectionOS['volume'] = {
                            global: {
                                d1: priceData.volume?.global ? (priceData.volume.global.d1 / LAMPORTS_PER_SOL) : 0,
                                d7: priceData.volume?.global ? (priceData.volume.global.d7 / LAMPORTS_PER_SOL) : 0,
                                d30: priceData.volume?.global ? (priceData.volume.global.d30 / LAMPORTS_PER_SOL) : 0,
                                total: priceData.volume?.global ? (priceData.volume.global.total / LAMPORTS_PER_SOL) : 0
                            }
                            //ADD BYMARKETPLACE VOLUME => Later On when we want it!
                        };
                        collectionOS['floorPrice'] = {
                            global: priceData.floorPrice ? (priceData.floorPrice.global / LAMPORTS_PER_SOL) : 0,
                        };
                        collectionOS['ceilingPrice'] = {
                            global: priceData.ceilingPrice ? (priceData.ceilingPrice.global / LAMPORTS_PER_SOL) : 0,
                        };
                        break;
                    default:
                        break;
                }
            }
        
            if('id' in collectionOS){
                documents.push(collectionOS);
            }
        } catch (err) {
            console.error(`FAIL|collectionId=${collectionId}|err=${JSON.stringify(err)}`)
        }
    }

    if (documents.length > 0) {
        try {
            await axios.post(
                url,
                buildBulkRequestPayload(documents),
                {
                    auth: auth,
                    headers: {
                        'Content-Type': 'application/x-ndjson;'
                    } 
                }
            );
        } catch(err) {
            console.error(err);
        }
    }
    i++;
}