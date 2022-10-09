import fs from 'fs';
import readline from 'readline';
import { ddbmapper } from '../../shared/src/service/dynamodb';
import { EntityType } from '../../shared/src/types'
import { NFT4CollectionEntity } from '../../shared/src/entity/NFT4CollectionEntity';
import { OffchainMetadata4CollectionEntity } from '../../shared/src/entity/OffchainMetadata4CollectionEntity';
import { Collection4NFTEntity } from '../../shared/src/entity/Collection4NFTEntity';
import { Entity } from '../../shared/src/entity/Entity';

const METADATA_FILE = "../../../../onchain-data/metadata2.out.json";

async function entrypoint() {
    const fileStream = fs.createReadStream(METADATA_FILE);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let i = 0;
    let promises: Promise<any>[] = [];

    for await (const line of rl) {
        console.log('processing ' + i + '-th line');
        
        const metadata = JSON.parse(line);
        const mint = metadata.mint;
        const verifiedCreators = metadata.data.creators?.filter(creator => creator.verified === 1);

        let globalIdsToDelete: string[] = [];
        let entitiesToCreate: any[] = [];
        if (hasMultipleVerifiedCreators(metadata)) {
            const symbol = metadata.data.symbol === '' ? 'null' : metadata.data.symbol;
            const newCollectionId = symbol + '-' + verifiedCreators[0].address;
            const oldCollectionId = symbol + '-' + verifiedCreators[verifiedCreators.length - 1].address;
            const offchainMetadataGlobalId = [EntityType.MetaplexOffchainMetadata, metadata.data.uri].join('-');
            
            // delete NFT4collection entity
            const badNFT4CollectionEntity = new NFT4CollectionEntity();
            badNFT4CollectionEntity.populate(mint, oldCollectionId);
            globalIdsToDelete.push(badNFT4CollectionEntity.globalId);

            // delete collection4NFT entity
            const badCollection4NFTEntity = new Collection4NFTEntity();
            badCollection4NFTEntity.populate(oldCollectionId, mint);
            globalIdsToDelete.push(badCollection4NFTEntity.globalId);
            
            // delete offchainMetadata4Collection entity
            const badOffchainMetadata4Collection = new OffchainMetadata4CollectionEntity();
            badOffchainMetadata4Collection.populate({ globalId: offchainMetadataGlobalId, type: EntityType.MetaplexOnChainMetadata }, oldCollectionId);
            globalIdsToDelete.push(badOffchainMetadata4Collection.globalId);
            
            console.log('bad globalIds')
            console.log(globalIdsToDelete);
            
            console.log('new collections');

            const nft4CollectionEntity = new NFT4CollectionEntity();
            nft4CollectionEntity.populate(mint, newCollectionId);
            entitiesToCreate.push(nft4CollectionEntity);
            console.log(JSON.stringify(nft4CollectionEntity));

            const collection4NFTEntity = new Collection4NFTEntity();
            collection4NFTEntity.populate(newCollectionId, mint);
            entitiesToCreate.push(collection4NFTEntity);
            console.log(JSON.stringify(collection4NFTEntity));
            
            const offchainMetadata4Collection = new OffchainMetadata4CollectionEntity();
            offchainMetadata4Collection.populate({ globalId: offchainMetadataGlobalId, type: EntityType.MetaplexOnChainMetadata }, newCollectionId);
            entitiesToCreate.push(offchainMetadata4Collection);
            console.log(JSON.stringify(offchainMetadata4Collection));
        }

        /** ddbmapper -> delete object */
        for (const globalId of globalIdsToDelete) {
            const entity = new Entity();
            entity.globalId = globalId;
            promises.push(ddbmapper.delete(entity));
        }

        /** ddb mapper -> create object */
        for (const entity of entitiesToCreate) {
            promises.push(ddbmapper.put(entity));
        }

        if (promises.length > 30) {
            await Promise.all(promises);
            promises = [];
        }
        i++;
    }
}

function hasMultipleVerifiedCreators(metadata): boolean {
    return metadata.data.creators?.filter(creator => creator.verified === 1).length > 1;
}

entrypoint();
