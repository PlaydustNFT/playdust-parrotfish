import { ddbmapper } from '../../shared/src/service/dynamodb';
import { EntityType } from '../../shared/src/types';
import { MetaplexOffChainMetadataEntity } from "../../shared/src/entity/MetaplexOffChainMetadataEntity";
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
    let fileItems: string[] = [];
    let i = 0;

    for await (const item of ddbmapper.query( 
            MetaplexOffChainMetadataEntity, 
            { type: EntityType.MetaplexOffchainMetadata }, 
            { indexName: IndexNames.EntityDb.typeIndex } 
    )) {
        fileItems.push(item.globalId+' '+item.primaryEntity);
        if (fileItems.length >= MAX_LIST_SIZE) {
            i++;
            console.log(`Writing ${MAX_LIST_SIZE} items to file. Iteration: ${i}. Total: ${MAX_LIST_SIZE*i}`);
            writeToFile(
                fileItems,
                MAX_ITEMS_PER_WRITE,
                OUTPUT_FILE_PATH
            );
            fileItems = [];
            console.time(innerLabel);
            console.timeEnd(innerLabel);
        }
    }

    writeToFile(
        fileItems,
        MAX_ITEMS_PER_WRITE,
        OUTPUT_FILE_PATH
    );
    console.timeEnd(outerLabel);
})()