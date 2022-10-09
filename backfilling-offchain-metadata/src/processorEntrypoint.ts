

import { ddbmapper } from '../../shared/src/service/dynamodb'
import { EntityType, OffChainMetadata, RelatedEntityData } from '../../shared/src/types'
import axios from 'axios'
import {normalizeOffChainMetadata} from './utils';
import { Metadata } from '../../shared/src/types';
import { Client } from '@opensearch-project/opensearch';
import { IndexNames } from '../../shared/src/consts';
import {BatchRpcClient } from './BatchRpcClient';

import { MetaplexOffChainMetadataEntity } from '../../shared/src/entity/MetaplexOffChainMetadataEntity';
import { OffchainMetadata4CollectionEntity } from '../../shared/src/entity/OffchainMetadata4CollectionEntity';
import { Collection4NFTEntity } from '../../shared/src/entity/Collection4NFTEntity';
import { NFT4CollectionEntity } from '../../shared/src/entity/NFT4CollectionEntity';
import { createOffchainMetadata4CollectionObjects } from '../../shared/src/util';


const indexName = 'index-name';
const url = 'https://opensearch-index-endpoint-url';
const auth = {
    username: 'username',
    password: 'password'
};
function buildGetRequestURI(uri) {
    let payloadLines;
    let optionsObject = {
        "query": {
          "bool": {
            "filter": [
              {
                "term": {
                  "data.uri": uri
                }
              }
            ]
          }
        }
      };
    
    payloadLines = {
        index: indexName,
        body: optionsObject
    };
    
    return payloadLines;
}

export const addOffchainMetadata = async (sourceTriggerEntity: any) => {
    const rawMetadata: Metadata = sourceTriggerEntity.data;
    let exists = false;

    console.log(`Processing metadata: ${JSON.stringify(rawMetadata)}`);
    let offChainData: OffChainMetadata;
    let offChainDataEntity: MetaplexOffChainMetadataEntity = new MetaplexOffChainMetadataEntity();

    const uri: string = rawMetadata.data.uri;
    var client = new Client({
        node: url,
        auth: auth,
    })

    const data = buildGetRequestURI(uri);
    let responseBulk = await client.search(data); 
    console.log(responseBulk.body.hits);
    //try to fetch it from the old OS cluster
    if(responseBulk.body.hits.hits[0]){
        console.log('record found in OS');
        const respNormalized: OffChainMetadata = normalizeOffChainMetadata(responseBulk.body.hits.hits[0]._source.offChainData);
        offChainData = new OffChainMetadata(respNormalized);
        console.log(offChainData);
    }else{
        //item not found in OS let's try in the DB
        try{
            offChainDataEntity.globalId = EntityType.MetaplexOffchainMetadata + '-' + uri;
            await ddbmapper.get(offChainDataEntity)
            .then(item => {
                //we find an item
                if(item){
                    exists = true;
                    offChainDataEntity = item;
                }
            })
            .catch(err => {
                console.log(err);
                console.log('OffchainEntity doesn\'t exists, let\'s fetch it!');
            });

            if(!exists){
                for(let i=0; i<3; i++){
                    try{
                        const resp = await axios.get(uri, {timeout: 30000});
                        const respNormalized: OffChainMetadata = normalizeOffChainMetadata(resp.data);
                        offChainData = new OffChainMetadata(respNormalized);
                        if(offChainData){
                            break;
                        }
                    }catch(e){
                        console.log(e);
                        console.log('no offchain metadata for this NFT!');
                    }
                }
            }
        }catch(e){
            console.log(e);
        }
    }
    
    if(offChainData){
        offChainDataEntity.populate(offChainData, rawMetadata.mint, uri);
        console.log(offChainDataEntity);

        let entityUpdate: Promise<MetaplexOffChainMetadataEntity>[] = [];
        entityUpdate.push(ddbmapper.put(offChainDataEntity));

        //let's wait for the PUT to the DB to complete before ending the lambda
        console.log('Metadata entities to put into the db: ');
        await Promise.all(entityUpdate).then((values) =>{
            console.log(values);
        }).catch(error => {
            console.log(error.message);
            throw('Error inserting the elements into the DB');
        });
    }


    let entities: (NFT4CollectionEntity | Collection4NFTEntity )[] = [];
    const clientRPC = new BatchRpcClient("https://api.mainnet-beta.solana.com", 100);
    const collectionIds: string[] = [];

    if(rawMetadata?.collection?.key){
        if(rawMetadata.collection.verified){
            const payloadCollection = [];
            payloadCollection.push(clientRPC.generateGetAccountInfoRequests(rawMetadata.collection.key, 1)); //Id doesn't matter now
            const resultCollection = await clientRPC.genericHttpRequest('post', payloadCollection);
            if(resultCollection[0]?.result?.value?.data?.program == 'spl-token'){  

                //create relationEntity
                const relationEntityNFTCollection: NFT4CollectionEntity = new NFT4CollectionEntity();
                relationEntityNFTCollection.populate(rawMetadata.mint, rawMetadata.collection.key);
                entities.push(relationEntityNFTCollection);

                // create inverse relation entity
                const collection4NFT: Collection4NFTEntity = new Collection4NFTEntity();
                collection4NFT.populate(/** data= */ rawMetadata.collection.key, /** primaryEntity= */ rawMetadata.mint);
                entities.push(collection4NFT);

                collectionIds.push(rawMetadata.collection.key);
            }
        }
    }
    //DERIVED COLLECTION
    for (const creator of rawMetadata.data.creators){
        if(creator.verified){
            //create collectionEntity
            const collectionId: string = rawMetadata.data.symbol + '-' + creator.address;

            //create relationEntity
            const relationEntityNFTCollection: NFT4CollectionEntity = new NFT4CollectionEntity();
            relationEntityNFTCollection.populate(rawMetadata.mint, collectionId );
            entities.push(relationEntityNFTCollection);

            // create inverse relation entity
            const collection4NFT: Collection4NFTEntity = new Collection4NFTEntity();
            collection4NFT.populate(/** data= */ collectionId, /** primaryEntity= */ rawMetadata.mint);
            entities.push(collection4NFT);
            
            collectionIds.push(collectionId)
            break;
        }
    }


    const promises: Promise<(NFT4CollectionEntity | Collection4NFTEntity)>[] = [];
    for (const relation of entities) {
        promises.push(ddbmapper.update(relation));
    }
    console.log('OffchainMetadata4Collection entities to put into the db: ');
    await Promise.all(promises).then((values) =>{
        console.log(values);
    }).catch(error => {
        console.log(error.message);
        throw('Error inserting the elements into the DB');
    });

    if(offChainData){
        const mintAddress = rawMetadata.mint;

        for(const collectionId of collectionIds){
            let offchainMetadata4Collection: OffchainMetadata4CollectionEntity = new OffchainMetadata4CollectionEntity();
            offchainMetadata4Collection.globalId = EntityType.OffchainMetadata4Collection + '-' + offChainDataEntity.globalId + '-' + collectionId;
            await ddbmapper.get(offchainMetadata4Collection)
            .then(async item => {
                //we find an item
                if(item){
                    await ddbmapper.delete(item)
                    .then(item => {
                    })
                    .catch(err => {
                        console.log(err);
                        console.log('Deletion of the old entity failed!');
                    });
    
                }
            })
            .catch(err => {
                console.log(err);
                console.log('Offchain4ColelctionEntity doesn\'t exists, no need to delete anything!');
            });
        }

        /** Create metadata 4 collection entity objects */
        const metadata4CollectionEntityUpdates: Promise<OffchainMetadata4CollectionEntity>[] = [];

        /** Create offchainMetadata4Collection object(s) */
        const relatedEntityData: RelatedEntityData = { globalId: offChainDataEntity.globalId, type: EntityType.MetaplexOffchainMetadata }; 
        const offchainMetadata4Collections = createOffchainMetadata4CollectionObjects(relatedEntityData, collectionIds, mintAddress);
        /** Update db with OffchainMetadata4Collection objects */
        for (const offchainMetadata4Collection of offchainMetadata4Collections) {
            metadata4CollectionEntityUpdates.push(ddbmapper.update(offchainMetadata4Collection));
        }

        console.log('OffchainMetadata4Collection entities to put into the db: ' + JSON.stringify(metadata4CollectionEntityUpdates));
        await Promise.all(metadata4CollectionEntityUpdates).then((values) =>{
            console.log(values);
        }).catch(error => {
            console.log(error.message);
            throw('Error inserting the elements into the DB');
        });
    }
}
