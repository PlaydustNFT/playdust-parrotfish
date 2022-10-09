import { CollectionType, PlaydustCollectionData, CollectionMetaData, OffChainMetadata, Metadata, EntityType } from '../../shared/src/types';
import { ddbmapper } from '../../shared/src/service/dynamodb';
import { Entity } from '../../shared/src/entity/Entity';
import { CollectionMetaDataEntity } from '../../shared/src/entity/CollectionMetaDataEntity';


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


export const processItem = async (collectionData: PlaydustCollectionData) => {
    
    let collectionMetadata: CollectionMetaData = {};
    let elementCount = 0;
    console.log(collectionData);
    if(collectionData.type == CollectionType.Metaplex){
        for await (const item of ddbmapper.query( Entity, { primaryEntity: collectionData.id }, { indexName: 'PrimaryEntityIndex'} )) {
            if(item.type == EntityType.NFT4Collection){
                elementCount++;
            }
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
            if(item.type == EntityType.MetaplexOffchainMetadata){
                collectionMetadata.description = item.data.description;
                collectionMetadata.family = item.data.collection?.family;
                collectionMetadata.image = item.data.image;
            }
        }
        collectionMetadata.elementCount = elementCount;

    }else if(collectionData.type == CollectionType.Derived){
        let mintAddress: string[] = [];
        for await (const item of ddbmapper.query( Entity, { primaryEntity: collectionData.id }, { indexName: 'PrimaryEntityIndex'} )) {
            if(item.type == EntityType.NFT4Collection){
                if(elementCount < 2){
                    mintAddress.push(item.data);
                }
                elementCount++;
            }
        }
        let onchainMetadata: Metadata[] =[];
        let offchainMetadata: OffChainMetadata[] = [];
        console.log('retrieving Onchain and Offchain metadata of NFT belonging to the collection');
        for(const mint of mintAddress){
            for await (const item of ddbmapper.query( Entity, { primaryEntity: mint }, { indexName: 'PrimaryEntityIndex'} )) {
                if(item.type == EntityType.MetaplexOnChainMetadata){
                    onchainMetadata.push(item.data);
                }
                if(item.type == EntityType.MetaplexOffchainMetadata){
                    offchainMetadata.push(item.data);
                }
            }
        }
        collectionMetadata.elementCount = elementCount;
        console.log('OnchainMetadata array length: ' + onchainMetadata.length);
        console.log(onchainMetadata);
        console.log('OffchainMetadata array length: ' + offchainMetadata.length);
        console.log(offchainMetadata);
        if(onchainMetadata.length >= 2 && offchainMetadata.length >= 2){
            collectionMetadata.description = longestCommonPrefix([offchainMetadata[0].description, offchainMetadata[1].description]);
            if(collectionMetadata.description[collectionMetadata.description.length - 1] == '#')
            {
                collectionMetadata.description = collectionMetadata.description.substring(0, collectionMetadata.description.length - 1);
            }
            collectionMetadata.name = longestCommonPrefix([onchainMetadata[0].data.name, onchainMetadata[1].data.name]);
            if(collectionMetadata.name[collectionMetadata.name.length - 1] == '#')
            {
                collectionMetadata.name = collectionMetadata.name.substring(0, collectionMetadata.name.length - 1);
            }
            collectionMetadata.symbol = longestCommonPrefix([onchainMetadata[0].data.symbol, onchainMetadata[1].data.symbol]);
            if(collectionMetadata.symbol[collectionMetadata.symbol.length - 1] == '#')
            {
                collectionMetadata.symbol = collectionMetadata.symbol.substring(0, collectionMetadata.symbol.length - 1);
            }
            collectionMetadata.family = longestCommonPrefix([offchainMetadata[0].collection.family, offchainMetadata[1].collection.family]);
            if(collectionMetadata.family[collectionMetadata.family.length - 1] == '#')
            {
                collectionMetadata.family = collectionMetadata.family.substring(0, collectionMetadata.family.length - 1);
            } 
            collectionMetadata.image = longestCommonPrefix([offchainMetadata[0].image, offchainMetadata[1].image]);
            if(collectionMetadata.image[collectionMetadata.image.length - 1] == '#')
            {
                collectionMetadata.image = collectionMetadata.image.substring(0, collectionMetadata.image.length - 1);
            } 
        }
        
    }
    
    console.log(collectionMetadata);
    let entity: CollectionMetaDataEntity = new CollectionMetaDataEntity();
    entity.populate(collectionData.id, collectionData.id, collectionMetadata);

    
    //let's wait for the PUT to the DB to complete before ending the lambda
    console.log('Entities to put into the db: ');
    await ddbmapper.put(entity).then((values) =>{
        console.log(values);
    }).catch(error => {
        console.log(error.message);
        throw('Error inserting the elements into the DB');
    });


}