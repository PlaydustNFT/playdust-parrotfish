import {  APIGatewayProxyResult} from 'aws-lambda';
import * as base58 from 'bs58';
import * as AWS from 'aws-sdk';
import {  decodeCreateMetadata, decodeCreateMetadataV2, CreateMetadataArgs,   decodeUpdateMetadata, decodeUpdateMetadataV2, decodeMetadata } from './metaplex-utils';
import { MetaplexOnChainMetadataEntity } from '../../shared/src/entity/MetaplexOnChainMetadataEntity';
import { MintAddressEntity } from '../../shared/src/entity/MintAddressEntity';
import { NFT4CollectionEntity } from '../../shared/src/entity/NFT4CollectionEntity'
import { Collection4NFTEntity } from '../../shared/src/entity/Collection4NFTEntity'
import { PlaydustCollectionEntity } from '../../shared/src/entity/PlaydustCollectionEntity' 
import { ddbmapper } from '../../shared/src/service/dynamodb';
import { EntityType, Data, Metadata, OffChainMetadata, MintEntityData, CollectionType, PlaydustCollectionData} from '../../shared/src/types';
import {BatchRpcClient } from './BatchRpcClient'

//The address is the same both for devnet and mainnet-beta
const METADATA_ACCOUNT = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
const CANDY_MACHINE = 'CMZYPASGWeTz7RNGHaRJfCq2XQ5pYK6nDvVQxzkH51zb';
const RPC_ENDPOINT = 
    String(process.env.RPC_ENDPOINT)
    || 'https://ssc-dao.genesysgo.net/';

//instructionDiscriminator
const CreateMetadataAccount = 0;
const CreateMetadataAccountV2 = 16;
const MintNewEditionFromMasterEditionViaToken = 11;
const MintNewEditionFromMasterEditionViaVaultProxy = 13;   
const UpdateMetadataAccount = 1;           
const UpdateMetadataAccountV2 = 15;
const UpdatePrimarySaleHappenedViaToken = 4;
const SignMetadata = 7;
const CreateMasterEdition = 10;
const CreateMasterEditionV3 = 17;
const VerifyCollection = 18;
const UnverifyCollection = 22;
const SetAndVerifyCollection = 25;
const Utilize = 19;
const MintNft = 211;


function onlyUnique(value: any, index: any, self: string | any[]) {
    return self.indexOf(value) === index;
}

export const processTransaction = async (transaction: any) => {
    let response: APIGatewayProxyResult;
    let metadataAddresses: string[] = [];
    let mintAddresses: string[] = [];

    const accountKeys = transaction.transaction.message.accountKeys;
    let instructions = transaction.transaction.message.instructions;
    const tmpArray: any[] = [];
    for(const innerInstruction of transaction.meta.innerInstructions){
        for(const instruction of innerInstruction.instructions){
            tmpArray.push(instruction);
        }
    }

    instructions = instructions.concat(tmpArray);
    for(const element of instructions){
        //filter metadata program instructions
        if(accountKeys[element.programIdIndex] == METADATA_ACCOUNT){
            const databs58 = base58.decode(element.data); //Uint8 array 
            const buf = Buffer.from(databs58); //Hex representation of the instruction data -> like on the explorer

            //the first byte define which function is used
            //each program can have different settings for this
            const instructionId = buf.readUInt8(0);
            console.log(`instructionId: ${JSON.stringify(instructionId)}`);

            // 0 = CreateMetadataAccount
            // 16 = CreateMetadataAccountV2
            if(instructionId == CreateMetadataAccount || instructionId == CreateMetadataAccountV2){
                //[0] metadata account
                metadataAddresses.push(accountKeys[element.accounts[0]]);
                //[1] mint account
                mintAddresses.push(accountKeys[element.accounts[1]]);
            }

            // 1 = UpdateMetadataAccount
            // 15 = UpdateMetadataAccountV2
            else if(instructionId == UpdateMetadataAccount || instructionId == UpdateMetadataAccountV2){                    
                //[0] metadata account
                metadataAddresses.push(accountKeys[element.accounts[0]]);
            }
            
            // 11 = MintNewEditionFromMasterEditionViaToken
            // 13 = MintNewEditionFromMasterEditionViaVaultProxy
            else if(instructionId == MintNewEditionFromMasterEditionViaToken || instructionId == MintNewEditionFromMasterEditionViaVaultProxy){
                //[0] new metadata account
                metadataAddresses.push(accountKeys[element.accounts[0]]);
                //[3] new mint account
                mintAddresses.push(accountKeys[element.accounts[3]]);
            }

            // 4 = UpdatePrimarySaleHappenedViaToken
            else if(instructionId == UpdatePrimarySaleHappenedViaToken){
                //[0] metadata account
                 metadataAddresses.push(accountKeys[element.accounts[0]]);
            }

            // 7 = SignMetadata
            else if(instructionId == SignMetadata){
                //[0] metadata account
                metadataAddresses.push(accountKeys[element.accounts[0]]);
            }

            // 10 = CreateMasterEdition
            // 17 = CreateMasterEditionV3
            else if(instructionId == CreateMasterEdition || instructionId == CreateMasterEditionV3){
                //[5] metadata account
                metadataAddresses.push(accountKeys[element.accounts[5]]);
                //[1] mint account
                mintAddresses.push(accountKeys[element.accounts[1]]);
            }

            // 18 = VerifyCollection
            // 22 = UnverifyCollection
            // 25 = SetAndVerifyCollection
            else if(instructionId == VerifyCollection || instructionId == UnverifyCollection || instructionId == SetAndVerifyCollection){
                //[0] metadata account
                metadataAddresses.push(accountKeys[element.accounts[0]]);
            }
            
            // 19 = Utilize
            else if(instructionId == Utilize ){
                //[0] metadata account
                metadataAddresses.push(accountKeys[element.accounts[0]]);
                //[2] mint account
                mintAddresses.push(accountKeys[element.accounts[2]]);
            }
            
            // 211 = MintNft (hack?)
            else if (instructionId == MintNft) {
                // metadata account --> test this because I'm not sure it'll work!!
                metadataAddresses.push(accountKeys[element.accounts[9]]);
                // mint account --> test this because I'm not sure it'll work!!
                mintAddresses.push(accountKeys[element.accounts[10]]);
            }
        }
        else if(accountKeys[element.programIdIndex] == CANDY_MACHINE){
            const databs58 = base58.decode(element.data); //Uint8 array 
            const buf = Buffer.from(databs58); //Hex representation of the instruction data -> like on the explorer

            //the first byte define which function is used
            //each program can have different settings for this
            const instructionId = buf.readUInt8(0);
            console.log(`instructionId: ${JSON.stringify(instructionId)}`);
            // 211 = MintNft (hack?)
            if (instructionId == MintNft) {
                // metadata account --> test this because I'm not sure it'll work!!
                metadataAddresses.push(accountKeys[element.accounts[9]]);
                // mint account --> test this because I'm not sure it'll work!!
                mintAddresses.push(accountKeys[element.accounts[10]]);
            }
        }
        else {
            console.log(`Failed to lookup parser for programId: ${JSON.stringify(accountKeys[element.programIdIndex])}`);
        }
    };

    //we want addresses to appear just once
    metadataAddresses = metadataAddresses.filter(onlyUnique);
    mintAddresses = mintAddresses.filter(onlyUnique);
    //client to perform RPC call
    // https://api.mainnet-beta.solana.com
    // https://api.devnet.solana.com
    // https://polished-young-mountain.solana-mainnet.quiknode.pro/53eaa4a0729b507f78443988672faf40c0a29eb5/
    const client = new BatchRpcClient(RPC_ENDPOINT, 100);
    let entities: (MetaplexOnChainMetadataEntity | MintAddressEntity | PlaydustCollectionEntity | NFT4CollectionEntity | Collection4NFTEntity )[] = [];


    //METADATA ACCOUNT FETCHING
    let payloadMetadataAddresses = [];
    let id = 0; //not sure if responses are in the same order so let's keep trac of it
    for(const item of metadataAddresses){
        payloadMetadataAddresses.push(client.generateGetAccountInfoRequests(item, id));
        id++;
    }
    const result = await client.genericHttpRequest('post', payloadMetadataAddresses);
    for(const item of result){
        const ResultId = item.id; //use the response id as index of the original array to get the correct metadataAddress
        const data = item.result.value.data[0];
        const metadata: Metadata = decodeMetadata(Buffer.from(data, 'base64'));
        //let's create the entity now 
        const onchainMetadataEntity: MetaplexOnChainMetadataEntity = new MetaplexOnChainMetadataEntity();
        onchainMetadataEntity.populate(metadata, payloadMetadataAddresses[ResultId].params[0], metadata.mint);
        entities.push(onchainMetadataEntity);
        
        /*  ONCHAIN COLLECTION
        In Order to check if a collection is valid on an NFT you MUST
            -Check that the Collection struct is set
            -That the pubkey in the collection struct is owned on chain by the spl-token program
            -That verified is true
        If those 3 steps are not followed you could be exposing fradulent NFTs on real collections
        */
        if(metadata?.collection?.key){
            if(metadata.collection.verified){
                const payloadCollection = [];
                payloadCollection.push(client.generateGetAccountInfoRequests(metadata.collection.key, 1)); //Id doesn't matter now
                const resultCollection = await client.genericHttpRequest('post', payloadCollection);
                if(resultCollection[0]?.result?.value?.data?.program == 'spl-token'){  
                    //create collectionEntity
                    const collectionEntity: PlaydustCollectionEntity = new PlaydustCollectionEntity();
                    const collectionData: PlaydustCollectionData = {
                        type: CollectionType.Metaplex,
                        id: metadata.collection.key,
                    }
                    collectionEntity.populate(metadata.collection.key, collectionData, {});
                    entities.push(collectionEntity);

                    //create relationEntity
                    const relationEntityNFTCollection: NFT4CollectionEntity = new NFT4CollectionEntity();
                    relationEntityNFTCollection.populate(metadata.mint, metadata.collection.key);
                    entities.push(relationEntityNFTCollection);

                    // create inverse relation entity
                    const collection4NFT: Collection4NFTEntity = new Collection4NFTEntity();
                    collection4NFT.populate(/** data= */ metadata.collection.key, /** primaryEntity= */ metadata.mint);
                    entities.push(collection4NFT);
                }
            }
        }
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
                relationEntityNFTCollection.populate(metadata.mint, collectionId );
                entities.push(relationEntityNFTCollection);

                // create inverse relation entity
                const collection4NFT: Collection4NFTEntity = new Collection4NFTEntity();
                collection4NFT.populate(/** data= */ collectionId, /** primaryEntity= */ metadata.mint);
                entities.push(collection4NFT);
                //TODO ADD COLLECTION ID
                break;
            }
        }

    }

    //MINT ACCOUNT FETCHING
    let payloadMintAddresses = [];
    let id2 = 0; //not sure if responses are in the same order so let's keep trac of it
    for(const item of mintAddresses){
        payloadMintAddresses.push(client.generateGetAccountInfoRequests(item, id2));
        id2++;
    }
    const result2 = await client.genericHttpRequest('post', payloadMintAddresses);
    for(const item of result2){
        const ResultId = item.id; //use the response id as index of the original array to get the correct metadataAddress
        const data: MintEntityData = new MintEntityData(item.result.value.data.parsed.info);
        //let's create the entity now 
        const mintAddressEntity: MintAddressEntity = new MintAddressEntity();
        mintAddressEntity.populate(data, payloadMintAddresses[ResultId].params[0]);
        entities.push(mintAddressEntity);
    }

    response = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Lambda finished',
        }),
    };

    let entityUpdate: Promise< MetaplexOnChainMetadataEntity | MintAddressEntity | PlaydustCollectionEntity | NFT4CollectionEntity | Collection4NFTEntity>[] = [];
    entities.forEach(async element => {
        entityUpdate.push(ddbmapper.put(element));
    });
    
    //let's wait for the PUT to the DB to complete before ending the lambda
    await Promise.all(entityUpdate).then((values) =>{
    })
    .catch(error => {
        console.log(error.message);
        throw('Error inserting the elements into the DB');
    });
    
    return response;
};
