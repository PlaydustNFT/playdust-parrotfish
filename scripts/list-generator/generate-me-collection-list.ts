import { ddbmapper } from '../../shared/src/service/dynamodb';
import { CollectionType, EntityType } from '../../shared/src/types';
import { PlaydustCollectionEntity } from "../../shared/src/entity/PlaydustCollectionEntity";
import { writeToFile } from '../util/FileIO';
import { IndexNames } from '../../shared/src/consts';

const OUTPUT_FILE = // where to write the list
    process.env.OUTPUT_FILE
    || '/home/ubuntu/files/collectionIds.txt';
const MAX_ITEMS_PER_WRITE = // max number of items to write to the file at once
    Number(process.env.MAX_ITEMS_PER_WRITE)
    || 2500;


(async () => {
    const collectionIds: string[] = [];
    for await (const item of ddbmapper.query( 
        PlaydustCollectionEntity, 
        { type: EntityType.PlaydustCollection }, 
        { indexName: IndexNames.EntityDb.typeIndex } 
    )) {
        if (item.data.type != CollectionType.MagicEden) {
            continue;
        }
        collectionIds.push(item.data.id);
    }

    console.log(`Successfully fetched ${collectionIds.length} ME collection ids`);
    writeToFile(
        collectionIds,
        MAX_ITEMS_PER_WRITE,
        OUTPUT_FILE
    );
})()