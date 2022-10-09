import { MetaplexOnChainMetadataEntity } from '../../shared/src/entity/MetaplexOnChainMetadataEntity';
import { MintAddressEntity } from '../../shared/src/entity/MintAddressEntity';
import { NFT4CollectionEntity } from '../../shared/src/entity/NFT4CollectionEntity'
import { Collection4NFTEntity } from '../../shared/src/entity/Collection4NFTEntity'
import { PlaydustCollectionEntity } from '../../shared/src/entity/PlaydustCollectionEntity' 
import { ddbmapper } from '../../shared/src/service/dynamodb';
import { Metadata, MintEntityData, CollectionType, PlaydustCollectionData} from '../../shared/src/types';

const BATCH_SIZE = 200;

function generateMetadataPDA(mint: string) {
    // generate
    return mint;
}

export const processMetadataAddresses = async (addresses: string[]) => {
    let onchainCollection = [[]];
    const metadatas: Metadata[] = [];
    let mintAddresses = [];

    let entities = [];
    for(const metadata of metadatas){
        const onchainMetadataEntity: MetaplexOnChainMetadataEntity = new MetaplexOnChainMetadataEntity();
        const metadataAddress = generateMetadataPDA(metadata.mint);
        onchainMetadataEntity.populate(metadata, metadataAddress, metadata.mint);
        entities.push(onchainMetadataEntity);
        mintAddresses.push(metadata.mint);
        
        //DERIVED COLLECTION
        for (const creator of metadata.data.creators){
            if(creator.verified){
                //create collectionEntity
                const collectionEntity: PlaydustCollectionEntity = new PlaydustCollectionEntity();
                const collectionId: string = metadata.data.symbol + '-' + creator.address;
                const collectionData: PlaydustCollectionData = {
                    type: CollectionType.Derived,
                    id: collectionId,
                }
                collectionEntity.populate(collectionId , collectionData, {candyMachine: creator.address});
                entities.push(collectionEntity);

                //create relationEntity
                const relationEntityNFTCollection: NFT4CollectionEntity = new NFT4CollectionEntity();
                relationEntityNFTCollection.populate(metadata.mint, collectionId);
                entities.push(relationEntityNFTCollection);

                // create inverse relation entity
                const collection4NFT: Collection4NFTEntity = new Collection4NFTEntity();
                collection4NFT.populate(/** data= */ collectionId, /** primaryEntity= */ metadata.mint);
                entities.push(collection4NFT);
                break;
            }
        }

        /*  ONCHAIN COLLECTION
        In Order to check if a collection is valid on an NFT you MUST
            -Check that the Collection struct is set
            -That the pubkey in the collection struct is owned on chain by the spl-token program
            -That verified is true
        If those 3 steps are not followed you could be exposing fradulent NFTs on real collections
        */
        if(metadata?.collection?.key){
            if(metadata.collection.verified){
                onchainCollection.push([metadata.collection.key, metadata.mint])
            }
        }
    }

    let entityUpdate: Promise< MetaplexOnChainMetadataEntity | MintAddressEntity | PlaydustCollectionEntity | NFT4CollectionEntity | Collection4NFTEntity>[] = [];
    entities.forEach(async element => {
        entityUpdate.push(ddbmapper.put(element));
    });
    
    //let's wait for the PUT to the DB to complete before ending the lambda
    console.log('Entities to put into the db: ');
    await Promise.all(entityUpdate).then((values) =>{
        console.log(values);
    }).catch(error => {
        console.log(error.message);
        throw('Error inserting the elements into the DB');
    });
    
};
