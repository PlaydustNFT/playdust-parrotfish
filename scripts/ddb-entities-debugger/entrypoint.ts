
import { ddbmapper } from '../../shared/src/service/dynamodb'
import { EntityType, RelatedEntityData } from '../../shared/src/types'
import { createInterface } from "readline";
import { IndexNames } from '../../shared/src/consts'
import { createReadStream } from 'fs';
import { createOffchainMetadata4CollectionObjects, getCollectionIds } from '../../shared/src/util';
import {
    fetchLatestActionsForMintByWallet,
    Action,
    ActionType
} from '../util/fetchEntities';
import {BatchRpcClient } from './BatchRpcClient'
import { MetaplexOnChainMetadataEntity } from "../../shared/src/entity/MetaplexOnChainMetadataEntity";
import { MetaplexOffChainMetadataEntity } from "../../shared/src/entity/MetaplexOffChainMetadataEntity";
import { PlaydustCollectionEntity } from "../../shared/src/entity/PlaydustCollectionEntity";
import { Collection4NFTEntity } from "../../shared/src/entity/Collection4NFTEntity";
import { NFT4CollectionEntity } from "../../shared/src/entity/NFT4CollectionEntity";
import { NFTRarityEntity } from "../../shared/src/entity/NFTRarityEntity";
import { OffchainMetadata4CollectionEntity } from "../../shared/src/entity/OffchainMetadata4CollectionEntity";
import { MintAddressEntity } from "../../shared/src/entity/MintAddressEntity";


const INPUT_FILE_PATH = // where to source the mintAddresses file
    process.env.INPUT_FILE_PATH
    || '/home/ubuntu/files/mintAddresses.txt'; //CHANGE PATH

(async () => 
{
    /** Read all mints from file */
    console.log(`Reading mint addresses from ${JSON.stringify(INPUT_FILE_PATH)}`);
    const mintAddresses: string[] = [];
    const rl = createInterface({
      input: createReadStream(INPUT_FILE_PATH),
      crlfDelay: Infinity,
    });
    for await (const line of rl) {
        mintAddresses.push(line);
    }
    console.log(`Read [${JSON.stringify(mintAddresses.length)}] items from ${INPUT_FILE_PATH}`);

    const promises = [];
    for (const mint of mintAddresses) {
        /** calculate & create active order state */
        promises.push(checkEntities(mint));
    }

    await Promise.all(promises);

    //await Promise.all(promises);
})();

const checkEntities = async (mint: string) => {
    let checks = {};
    const collectionIds = [];


    for await (const item of ddbmapper.query( MetaplexOnChainMetadataEntity, 
        { type: EntityType.MetaplexOnChainMetadata, primaryEntity: mint}, 
        { indexName: IndexNames.EntityDb.typePrimaryEntityIndex} )) {
        checks["OnChainMetadata"] = true;
        for (const creator of item.data?.data.creators){
            if(creator.verified){
                const collectionId: string = item.data.data.symbol + '-' + creator.address;
                for await (const itemCollection of ddbmapper.query( PlaydustCollectionEntity, 
                    { type: EntityType.PlaydustCollection, primaryEntity: creator.address}, 
                    { indexName: IndexNames.EntityDb.typePrimaryEntityIndex} )) {
                    checks["PlaydustCollection-" + collectionId] = true;  
                    collectionIds.push(collectionId);                  
                }

                const relationEntityNFTCollection: NFT4CollectionEntity = new NFT4CollectionEntity();
                relationEntityNFTCollection.populate(mint, collectionId);
                await ddbmapper.get(relationEntityNFTCollection)
                .then(item => {
                    checks["NFT4Collection-" + collectionId] = true;
                })
                .catch(err => {});
                
                const collection4NFT: Collection4NFTEntity = new Collection4NFTEntity();
                collection4NFT.populate(/** data= */ collectionId, /** primaryEntity= */ mint);
                await ddbmapper.get(relationEntityNFTCollection)
                .then(item => {
                    checks["Collection4NFT-" + collectionId] = true;
                })
                .catch(err => {});
                break;
            }
        }
        if(item.data?.collection?.key){
            if(item.data.collection.verified){
                const payloadCollection = [];
                const client = new BatchRpcClient("https://api.mainnet-beta.solana.com", 100);
                payloadCollection.push(client.generateGetAccountInfoRequests(item.data.collection.key, 1)); //Id doesn't matter now
                const resultCollection = await client.genericHttpRequest('post', payloadCollection);
                if(resultCollection[0]?.result?.value?.data?.program == 'spl-token'){ 
                    
                    for await (const itemCollection of ddbmapper.query( PlaydustCollectionEntity, 
                        { type: EntityType.PlaydustCollection, primaryEntity: item.data.collection.key}, 
                        { indexName: IndexNames.EntityDb.typePrimaryEntityIndex} )) {
                        checks["PlaydustCollection-" + item.data.collection.key] = true;   
                        collectionIds.push(item.data.collection.key);              
                    }

                    const relationEntityNFTCollection: NFT4CollectionEntity = new NFT4CollectionEntity();
                    relationEntityNFTCollection.populate(mint, item.data.collection.key);
                    await ddbmapper.get(relationEntityNFTCollection)
                    .then(item1 => {
                        checks["NFT4Collection-" + item.data.collection.key] = true;
                    })
                    .catch(err => {});
                    
                    const collection4NFT: Collection4NFTEntity = new Collection4NFTEntity();
                    collection4NFT.populate(/** data= */ item.data.collection.key, /** primaryEntity= */ mint);
                    await ddbmapper.get(relationEntityNFTCollection)
                    .then(item1 => {
                        checks["Collection4NFT-" + item.data.collection.key] = true;
                    })
                    .catch(err => {});
                }
            }
        }else{
            checks["playdustCollection-OnChain"] = "doesn't have onchain collection"; 
            checks["PlaydustCollection-OnChain"] = "doesn't have onchain collection"; 
            checks["NFT4Collection-OnChain"] = "doesn't have onchain collection"; 
            checks["Collection4NFT-OnChain"] = "doesn't have onchain collection"; 
        }
    }
    for await (const item of ddbmapper.query( MetaplexOffChainMetadataEntity, 
        { type: EntityType.MetaplexOffchainMetadata, primaryEntity: mint}, 
        { indexName: IndexNames.EntityDb.typePrimaryEntityIndex} )) {
        checks["OffChainMetadata"] = true;
        const relatedEntityData: RelatedEntityData = { globalId: item.globalId, type: EntityType.MetaplexOffchainMetadata }; 
        const offchainMetadata4Collections = createOffchainMetadata4CollectionObjects(relatedEntityData, collectionIds);
        /** Update db with OffchainMetadata4Collection objects */
        for (const offchainMetadata4Collection of offchainMetadata4Collections) {
            await ddbmapper.get(offchainMetadata4Collection)
            .then(item => {
                checks["offchainMetadata4Collection-" + item.primaryEntity] = true;
            })
            .catch(err => {});
        }
    }
    const rarityEntities = [];
    for await (const item of ddbmapper.query( NFTRarityEntity, 
        { type: EntityType.NFTRarity, primaryEntity: mint}, 
        { indexName: IndexNames.EntityDb.typePrimaryEntityIndex} )) {
            rarityEntities.push(item);              
    }
    for(const rarity of rarityEntities){
        checks["NFTRarity-" + rarity.id] = true;
    }

    return checks;
}