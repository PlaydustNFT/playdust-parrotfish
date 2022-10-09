import { ddbmapper } from '../../shared/src/service/dynamodb';
import { CollectionType, EntityType } from '../../shared/src/types';
import { NFT4CollectionEntity } from "../../shared/src/entity/NFT4CollectionEntity";
import { writeToFile } from '../util/FileIO';
import { IndexNames } from '../../shared/src/consts';

import { createInterface } from "readline";
import { createReadStream } from 'fs';

const INPUT_FILE_PATH = // where to write the list
    process.env.INPUT_FILE_PATH
    || '/home/ubuntu/files/collectionIds.txt';
const OUTPUT_FILE_PATH = // where to write the list
    process.env.OUTPUT_FILE_PATH
    || '/home/ubuntu/files/collectionIds.txt';
const MAX_ITEMS_PER_WRITE = // max number of items to write to the file at once
    Number(process.env.MAX_ITEMS_PER_WRITE)
    || 2500;
const MAX_LIST_SIZE = // max number of items in a list at any given time
    Number(process.env.MAX_LIST_SIZE)
    || 900000;

(async () => {

    const outerLabel = 'outer';
    console.time(outerLabel);
    const innerLabel = 'inner';
    console.time(innerLabel);
    console.log(`Reading mint addresses from ${JSON.stringify(INPUT_FILE_PATH)}`);
    const rl = createInterface({
      input: createReadStream(INPUT_FILE_PATH),
      crlfDelay: Infinity,
    });

    let i = 1;
    let mintAddresses: string[] = [];
    for await (const collectionId of rl) {
        for await (const mint of ddbmapper.query( 
                NFT4CollectionEntity, 
                { type: EntityType.NFT4Collection, primaryEntity: collectionId }, 
                { indexName: IndexNames.EntityDb.typePrimaryEntityIndex } 
            )) {
                mintAddresses.push(mint.data+' '+collectionId);
        }
        if (mintAddresses.length >= MAX_LIST_SIZE) {
            i++;
            console.log(`Writing ${MAX_LIST_SIZE} items to file. Iteration: ${i}. Total: ${MAX_LIST_SIZE*i}`);
            writeToFile(
                mintAddresses,
                MAX_ITEMS_PER_WRITE,
                OUTPUT_FILE_PATH
            );
            mintAddresses = [];
            console.time(innerLabel);
            console.timeEnd(innerLabel);
        }
    }

    writeToFile(
        mintAddresses,
        MAX_ITEMS_PER_WRITE,
        OUTPUT_FILE_PATH
    );
    console.timeEnd(outerLabel);
})()