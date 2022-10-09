import { CollectionType, EntityType, NFTSource } from '../../shared/src/types';
import { ddbmapper } from '../../shared/src/service/dynamodb';
import { CollectionMetaDataEntity } from '../../shared/src/entity/CollectionMetaDataEntity';
import { MetaplexOffChainMetadataEntity } from '../../shared/src/entity/MetaplexOffChainMetadataEntity';
import { MetaplexOnChainMetadataEntity } from '../../shared/src/entity/MetaplexOnChainMetadataEntity';
import { NFTRarityEntity } from '../../shared/src/entity/NFTRarityEntity'
import { IndexNames } from '../../shared/src/consts'
import axios from 'axios';
import { getCollectionIds } from '../../shared/src/util';
import { PlaydustCollectionEntity } from '../../shared/src/entity/PlaydustCollectionEntity';

/** Comment to trigger build from changed shared code */

const MAX_DOCUMENTS_LENGTH =
    Number(process.env.MAX_DOCUMENTS_LENGTH)
    || 5000;

const indexName = 
    String(process.env.MINT_OPEN_SEARCH_INDEX)
    || 'nft-metadata';
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
                _index: indexName,
                _id: documents[i].mint
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
function onlyUnique(value: any, index: any, self: string | any[]) {
    return self.indexOf(value) === index;
}

export const processMintMetadataAggregation = async (mintAddresses:string[], indexName:string, url:string, auth:any, collectionId: string) => {
    console.log(`OPEN_SEARCH_INDEX=${indexName}|url=${url}|auth=${JSON.stringify(auth)}`);
    let documents = [];
    /*
    let mintArray: string[] = [];
    for(const mint of mintAddresses){
        mintArray.push(mint.Body);
    }
    //filter duplicate mintAddresses
    mintArray = mintArray.filter(onlyUnique);
    */
    console.log(`Received ${mintAddresses.length} mint addresses to process`);
    let mintArray = mintAddresses.filter(onlyUnique);
    console.log(`Received ${mintArray.length} unique mint addresses to process`);
    for(const mintAddress of mintArray){
        //1)
        //We receive the mint address only
        let itemArray: any[] = [];
        let itemOS: NFTSource = {};
        
        //2)
        //First we query the DB for blockchainAddress == MintAddress

        for await (const item of ddbmapper.query( PlaydustCollectionEntity, { type: EntityType.PlaydustCollection, primaryEntity: mintAddress}, { indexName: IndexNames.EntityDb.typePrimaryEntityIndex} )) {
            //if this item exists it means the NFT is a CollectionNFT
            itemArray.push(item)
        }

        for await (const item of ddbmapper.query( MetaplexOnChainMetadataEntity, { type: EntityType.MetaplexOnChainMetadata, primaryEntity: mintAddress}, { indexName: IndexNames.EntityDb.typePrimaryEntityIndex} )) {
            //if this item exists it means the NFT is a CollectionNFT
            itemArray.push(item)
            const uri: string = item.data.data.uri;
            let offChainDataEntity: MetaplexOffChainMetadataEntity = new MetaplexOffChainMetadataEntity();
            offChainDataEntity.globalId = EntityType.MetaplexOffchainMetadata + '-' + uri;
            await ddbmapper.get(offChainDataEntity)
            .then(item2 => {
                //we find an item
                itemArray.push(item2)
            })
            .catch(err => {
                console.log(err);
                console.log('OffchainEntity doesn\'t exists for this mint');
            });
        }

        console.log('Start NFTRarity fetch!');
        for await (const item of ddbmapper.query( NFTRarityEntity, { type: EntityType.NFTRarity, primaryEntity: mintAddress}, { indexName: IndexNames.EntityDb.typePrimaryEntityIndex} )) {
            //if this item exists it means the NFT is a CollectionNFT
            console.log('Fetched:' + item.data);
            itemArray.push(item)
        }
        console.log('Finished NFTRarity fetch!');

        //3)
        //retrieve collections IDs
        const collections = await getCollectionIds(mintAddress);
        let tempCollections = [];
        for(const item of collections){
            let entity: PlaydustCollectionEntity = new PlaydustCollectionEntity();
            entity.globalId = EntityType.PlaydustCollection + '-' + item;
            await ddbmapper.get(entity)
            .then(item => {
                tempCollections.push(item.data);
            })
            .catch(err => {
                console.log(err);
            });
        }

        //Custom order of the collections
        itemOS['collections'] = [];
        //1
        for(const item of tempCollections){
            if(item.type == CollectionType.MagicEden){
                itemOS['collections'].push(item);
            }
        }
        //2
        for(const item of tempCollections){
            if(item.type == CollectionType.Manual){
                itemOS['collections'].push(item);
            }
        }
        //3
        for(const item of tempCollections){
            if(item.type == CollectionType.Metaplex){
                itemOS['collections'].push(item);
            }
        }
        //4
        for(const item of tempCollections){
            if(item.type == CollectionType.Derived){
                itemOS['collections'].push(item);
            }
        }

        //We suppose that collectionName, collectionSymbol and collectionDescription are the same for the 4 collections (metaplex,derived,ME,manual)
        if(itemOS['collections'].length > 0){
            itemOS['primaryCollection'] = itemOS['collections'][0].id;
            for await (const item of ddbmapper.query( CollectionMetaDataEntity, {type: EntityType.CollectionMetaData, primaryEntity: itemOS['collections'][0].id}, { indexName: 'TypePrimaryEntityIndex'} )) {
                console.log('Collection Metadata fetched');
                if(item.type == EntityType.CollectionMetaData){
                    itemOS['collectionName'] = item.data.name;
                    if (typeof itemOS['collectionName'] === 'string' && itemOS['collectionName'].trim().length === 0) {
                        delete itemOS['collectionName'];
                    }
                    itemOS['collectionSymbol'] = item.data.symbol;
                    if (typeof itemOS['collectionSymbol'] === 'string' && itemOS['collectionSymbol'].trim().length === 0) {
                        delete itemOS['collectionSymbol'];
                    }
                    itemOS['collectionDescription'] = item.data.description;
                    if (typeof itemOS['collectionDescription'] === 'string' && itemOS['collectionDescription'].trim().length === 0) {
                        delete itemOS['collectionDescription'];
                    }
                }
            }
        }
        //4)
        //aggregate data
        itemOS['isCollection'] = false;
        for(const item of itemArray){
            if(item.type == EntityType.MetaplexOnChainMetadata){
                console.log('Onchain data fetched');
                itemOS['mint'] = item.data.mint;
                itemOS['uri'] = item.data?.data?.uri;
                if (typeof itemOS['uri'] === 'string' && itemOS['uri'].trim().length === 0) {
                    delete itemOS['uri'];
                }

                if(!itemOS.hasOwnProperty('name') || !itemOS['name']){
                    itemOS['name'] = item.data?.data?.name;
                    if (typeof itemOS['name'] === 'string' && itemOS['name'].trim().length === 0) {
                        delete itemOS['name'];
                    }
                }
                if(!itemOS.hasOwnProperty('symbol') || !itemOS['symbol']){
                    itemOS['symbol'] = item.data?.data?.symbol;
                    if (typeof itemOS['symbol'] === 'string' && itemOS['symbol'].trim().length === 0) {
                        delete itemOS['symbol'];
                    }
                }
                
                switch (item.data.token_standard) {
                    case 0:
                        itemOS['tokenStandard'] = 'NonFungible'
                        break;
                
                    case 1:
                        itemOS['tokenStandard'] = 'FungibleAsset'
                        break;
                    case 2:
                        itemOS['tokenStandard'] = 'Fungible'
                        break;
                    case 3:
                        itemOS['tokenStandard'] = 'NonFungibleEdition'
                        break;
                    default:
                        break;
                }
                
            }else if(item.type == EntityType.MetaplexOffchainMetadata){
                itemOS['image'] = item.data?.image;
                if (typeof itemOS['image'] === 'string' && itemOS['image'].trim().length === 0) {
                    delete itemOS['image'];
                }
                const tempAttributes: {
                    key: string;
                    value: string;
                }[] = [];
                if(item.data?.attributes){
                    for(const att of item.data.attributes){
                        tempAttributes.push({
                            key: att.trait_type,
                            value: att.value,
                        });
                    }
                    itemOS['attributes'] = tempAttributes;
                }

                //check the onchain field, if we don't have a value we use the offchain values
                if(!itemOS.hasOwnProperty('name') || !itemOS['name']){
                    itemOS['name'] = item.data?.name;
                    if (typeof itemOS['name'] === 'string' && itemOS['name'].trim().length === 0) {
                        delete itemOS['name'];
                    }
                }
                if(!itemOS.hasOwnProperty('symbol') || !itemOS['symbol']){
                    itemOS['symbol'] = item.data?.symbol;
                    if (typeof itemOS['symbol'] === 'string' && itemOS['symbol'].trim().length === 0) {
                        delete itemOS['symbol'];
                    }
                }

            }else if(item.type == EntityType.PlaydustCollection){
                itemOS['isCollection'] = true;
            }else if(item.type == EntityType.NFTRarity){
                console.log('Rarity found for collection ' + item.id);
                if(item.id == itemOS['collections'][0]?.id){
                    console.log('Rarity valid:');
                    itemOS['normalizedRarityScore'] = item.data.normalizedRarityScore;
                    itemOS['normalizedStatisticalRarity'] = item.data.normalizedStatisticalRarity;
                }
            }
        }

        if('mint' in itemOS){
            documents.push(itemOS);
            console.log(itemOS);
        }
    }
    for (let i = 0; i*MAX_DOCUMENTS_LENGTH < documents.length; i++) {
        const start = i*MAX_DOCUMENTS_LENGTH;
        const end = Math.min((i+1)*MAX_DOCUMENTS_LENGTH, documents.length);
        console.log(`Sending documents to OpenSearch! #${documents.length}`);
        console.log(`Attempt to process documents... URL=${url}|auth=${auth}`);
        try {
            await axios.post(
                url,
                buildBulkRequestPayload(documents.slice(start,end)),
                {
                    auth: auth,
                    headers: {
                        'Content-Type': 'application/x-ndjson;'
                    } 
                }
            );
        } catch(err) {
            console.log(err);
            console.log(`FAILED_TO_INSERT_METADATA|collectionId=${collectionId}`);
        }
    }
}

export const processItem = async (mintAddresses: string[], collectionId: string = '') => {
    processMintMetadataAggregation(mintAddresses, indexName, url, auth, collectionId);
}
