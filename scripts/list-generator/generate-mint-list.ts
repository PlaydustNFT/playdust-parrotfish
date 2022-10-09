import { ddbmapper } from '../../shared/src/service/dynamodb';
import { EntityType } from '../../shared/src/types';
import { MetaplexOnChainMetadataEntity } from "../../shared/src/entity/MetaplexOnChainMetadataEntity";
import { writeToFile } from '../util/FileIO';
import { IndexNames } from '../../shared/src/consts';

const OUTPUT_FILE = // where to write the list
    process.env.OUTPUT_FILE
    || '/home/ubuntu/files/completeMintAddressesList.txt';
const MAX_ITEMS_PER_WRITE = // max number of items to write to the file at once
    Number(process.env.MAX_ITEMS_PER_WRITE)
    || 2500;
const MAX_LIST_SIZE = // max number of items in a list at any given time
    Number(process.env.MAX_LIST_SIZE)
    || 500000;


(async () => {
    let mintAddresses: string[] = [];
    let i = 0;
    for await (const item of ddbmapper.query( 
        MetaplexOnChainMetadataEntity, 
        { type: EntityType.MetaplexOnChainMetadata }, 
        { indexName: IndexNames.EntityDb.typeIndex } 
    )) {
        mintAddresses.push(item.primaryEntity);
        if (mintAddresses.length >= MAX_LIST_SIZE) {
            i++;
            console.log(`Writing ${MAX_LIST_SIZE} signatures to file. Iteration: ${i}. Total: ${MAX_LIST_SIZE*i}`);
            writeToFile(
                mintAddresses,
                MAX_ITEMS_PER_WRITE,
                OUTPUT_FILE
            );
            mintAddresses = [];
        }
    }
    console.log(`Successfully fetched ${mintAddresses.length} collection ids`);
    writeToFile(
        mintAddresses,
        MAX_ITEMS_PER_WRITE,
        OUTPUT_FILE
    );
})()