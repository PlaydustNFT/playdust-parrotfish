import { MetaplexOnChainMetadataEntity } from "../../shared/src/entity/MetaplexOnChainMetadataEntity";
import { MetaplexOffChainMetadataEntity } from "../../shared/src/entity/MetaplexOffChainMetadataEntity";
import { ddbmapper } from '../../shared/src/service/dynamodb'
import { EntityType, RelatedEntityData } from '../../shared/src/types'
import { createInterface } from "readline";
import { createReadStream } from 'fs';

import { GlobalIdDelimiter, IndexNames } from '../../shared/src/consts';
import { createOffchainMetadata4CollectionObjects, getCollectionIds } from "../../shared/src/util";

const INPUT_FILE_PATH = // where to source the collection ids file
    process.env.INPUT_FILE_PATH
    || '/home/ubuntu/files/mintAddresses.txt';

const MAX_PROMISES =
    Number(process.env.MAX_PROMISES)
    || 10000;

const MAX_ITEMS_PER_WRITE = 
    Number(process.env.MAX_ITEMS_PER_WRITE)
    || 5000;
const OUTPUT_FILE_PATH = 
    process.env.OUTPUT_FILE_PATH
    || '/home/ec2-user/files/off_chain/missing_mints';
const SKIP_LOOKUP =
    Boolean(process.env.SKIP_LOOKUP)
    || false;

(async () => 
{
    /** Read all mints from file */
    const outerLabel = 'outer';
    console.time(outerLabel);
    const innerLabel = 'inner';
    console.time(innerLabel);
    console.log(`Reading lines from ${JSON.stringify(INPUT_FILE_PATH)} | SKIP_LOOKUP=${SKIP_LOOKUP}`);
    let promises = [];
    const rl = createInterface({
      input: createReadStream(INPUT_FILE_PATH),
      crlfDelay: Infinity,
    });
    let i = 1;
    let batchNumber = 1;
    let missingOffChainMetadata = [];
    let itemsProcessed = 0;
    let itemsEdgesOnly = 0;
    for await (const data of rl) {
        console.log(`MISSING|mint=${data}`);
        missingOffChainMetadata.push(data)
    }
    console.log(`mints_missing=${missingOffChainMetadata.length}`);
    for await (const mint of missingOffChainMetadata) {
        for await (let item of ddbmapper.query( 
                MetaplexOnChainMetadataEntity, 
                { type: EntityType.MetaplexOnChainMetadata, primaryEntity: mint }, 
                { indexName: IndexNames.EntityDb.typePrimaryEntityIndex } 
        )) {
            //lookup offchain item
            const offChainEntity = new MetaplexOffChainMetadataEntity();
            offChainEntity.globalId = EntityType.MetaplexOffchainMetadata + GlobalIdDelimiter + item.data.data.uri;
            ddbmapper.get(offChainEntity).then(async (offchainItem) => {
                console.log(`edgesOnly=${itemsEdgesOnly}|total=${itemsEdgesOnly+itemsProcessed}|mint=${mint}|globalId=${item.globalId}|uri=${item.data.data.uri}`);
                // ensure we create any missing entities
                const collectionIds = await getCollectionIds(mint);
                const relatedEntityData: RelatedEntityData = { globalId: offChainEntity.globalId, type: EntityType.MetaplexOffchainMetadata }; 
                const offchainMetadata4Collections = createOffchainMetadata4CollectionObjects(relatedEntityData, collectionIds, mint);
                /** Update db with OffchainMetadata4Collection objects */
                for (const offchainMetadata4Collection of offchainMetadata4Collections) {
                    promises.push(ddbmapper.update(offchainMetadata4Collection));
                }
                itemsEdgesOnly++;
            }).catch(async (err) => {
                item.updatedAt = new Date();
                promises.push(ddbmapper.put(item));

                console.log(`processed=${itemsProcessed}|total=${itemsEdgesOnly+itemsProcessed}|mint=${mint}|globalId=${item.globalId}`);
                itemsProcessed += 1;

                // await promises
                if (promises.length >= MAX_PROMISES) {
                    await Promise.all(promises);
                    console.timeEnd(innerLabel)
                    console.log(`PROMISES COMPLETE: ${MAX_PROMISES*batchNumber}`);
                    batchNumber += 1;
                    promises = [];
                    console.time(innerLabel)
                }
            });
        }
    }
    console.log(`READ COMPLETE | AWAITING FINAL PROMISES `);

    await Promise.all(promises);

    console.timeEnd(outerLabel)
})();