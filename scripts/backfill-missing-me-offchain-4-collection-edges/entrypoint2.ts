
import { MetaplexOffChainMetadataEntity } from "../../shared/src/entity/MetaplexOffChainMetadataEntity";
import { ddbmapper } from '../../shared/src/service/dynamodb'
import { EntityType } from '../../shared/src/types'
import { createInterface } from "readline";
import { createReadStream } from 'fs';
import { writeToFile } from '../util/FileIO';

import { OffchainMetadata4CollectionEntity } from '../../shared/src/entity/OffchainMetadata4CollectionEntity';
import { IndexNames } from '../../shared/src/consts';

const INPUT_FILE_PATH = // where to source the collection ids file
    process.env.INPUT_FILE_PATH
    || '/home/ubuntu/files/mintAddresses.txt';

const GLOBAL_IDS_INPUT_FILE_PATH = // where to source the collection ids file
    process.env.GLOBAL_IDS_INPUT_FILE_PATH
    || '/home/ubuntu/files/mintAddresses.txt';

const MAX_PROMISES =
    Number(process.env.MAX_PROMISES)
    || 10000;
const MAX_ITEMS_PER_WRITE = 
    Number(process.env.MAX_ITEMS_PER_WRITE)
    || 5000;
const OUTPUT_FILE_PATH = 
    process.env.OUTPUT_FILE_PATH
    || '/home/ec2-user/files/skipped_mints';
const MAX_LIST_SIZE =
    Number(process.env.MAX_LIST_SIZE)
    || 500;
(async () => 
{
    /** Read all mints from file */
    const outerLabel = 'outer';
    console.time(outerLabel);
    const innerLabel = 'inner';
    console.time(innerLabel);
    console.log(`Reading lines from ${JSON.stringify(INPUT_FILE_PATH)}`);
    let promises = [];
    let batchNumber = 1;
    const rl_global_ids = createInterface({
      input: createReadStream(GLOBAL_IDS_INPUT_FILE_PATH),
      crlfDelay: Infinity,
    });

    const mintToGlobalId = new Map<string,string>();
    let itemsProcessed = 0;
    for await (const line of rl_global_ids) {
        const [globalId, mint] = line.split(" ");
        if (!mint) {
            continue;
        }
        mintToGlobalId.set(mint, globalId);
    }
    console.log(`Read all global ids!`);

    const rl = createInterface({
      input: createReadStream(INPUT_FILE_PATH),
      crlfDelay: Infinity,
    });
    for await (const data of rl) {
        const [mint, collectionId] = data.split(" ");
        const globalId = mintToGlobalId.get(mint);
        if (!mint) {
            console.log(`FAIL|reason=no mint|data=${data}`);
            continue;
        }
        if (!collectionId) {
            console.log(`FAIL|reason=no collection|mint=${mint}`);
            continue;
        }
        if (!globalId) {
            console.log(`FAIL|reason=no globalId|mint=${mint}|collection=${collectionId}`);
            continue;
        }

        const md = new OffchainMetadata4CollectionEntity();
        md.populate({ globalId: globalId, type: EntityType.MetaplexOffchainMetadata }, collectionId);
        promises.push(ddbmapper.put(md));

        if (itemsProcessed % 1000 == 0) {
            console.log(`processed=${itemsProcessed}`);
            console.log(`Created new entity: ${md.globalId}`);
        }
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
    }

    console.log(`READ COMPLETE | AWAITING FINAL PROMISES `);

    await Promise.all(promises);

    console.timeEnd(outerLabel)
})();