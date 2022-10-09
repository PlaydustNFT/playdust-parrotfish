import { ddbmapper } from '../../shared/src/service/dynamodb';
import { EntityType } from '../../shared/src/types';
import { NFT4CollectionEntity } from "../../shared/src/entity/NFT4CollectionEntity";
import { writeToFile } from '../util/FileIO';
import { IndexNames } from '../../shared/src/consts';

const OUTPUT_FILE = // where to write the list
    process.env.OUTPUT_FILE
    || '/home/ec2-user/files/mint-4-collection_ids';
const MAX_ITEMS_PER_WRITE = // max number of items to write to the file at once
    Number(process.env.MAX_ITEMS_PER_WRITE)
    || 2500;
const COLLECTION_ID =
    process.env.COLLECTION_ID
    || '';


(async () => {
    if (COLLECTION_ID === undefined || COLLECTION_ID === null || COLLECTION_ID === '') {
        console.log(`status=FAIL|COLLECTION_ID=${COLLECTION_ID}|reason=invalid`);
        return;
    }
    else {
        console.log(`status=FETCH|COLLECTION_ID=${COLLECTION_ID}`);
    }
    const mints: string[] = [];
    for await (const item of ddbmapper.query( 
        NFT4CollectionEntity, 
        { type: EntityType.NFT4Collection, primaryEntity: COLLECTION_ID }, 
        { indexName: IndexNames.EntityDb.typePrimaryEntityIndex } 
    )) {
        mints.push(item.data);
    }

    console.log(`Successfully fetched ${mints.length} items`);
    writeToFile(
        mints,
        MAX_ITEMS_PER_WRITE,
        OUTPUT_FILE
    );
})()