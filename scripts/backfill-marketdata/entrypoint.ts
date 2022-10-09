
import { ddbmapper } from '../../shared/src/service/dynamodb'
import { EntityType, } from '../../shared/src/types'
import { groupBy } from '../../shared/src/util/collection';
import { createMarketData4CollectionObjects, getCollectionIds, } from '../../shared/src/util';
import {
    fetchExecuteSaleTransactionEntitiesFromDatabaseForMarketData,
    fetchMD4CollectionEntitiesFromDatabase,
} from '../util/fetchEntities'

(async () => 
{
    /** Fetch current marketdata4Collection objects from database */
    const md4CollectionGlobalIds = (await fetchMD4CollectionEntitiesFromDatabase()).map(element => element.globalId);
    /** reduce marketdata4Collection objects to their data / reference global id */
 
    /** Fetch current execute sale signatures from the database only needs global id & mint! */ 
    let executeSaleTransactionData = await fetchExecuteSaleTransactionEntitiesFromDatabaseForMarketData();
    /** reduce relevant execute sale signatures to only those who's globalIds are not in the marketdata 4 collection list */
    executeSaleTransactionData = executeSaleTransactionData.filter(element => !md4CollectionGlobalIds.includes(element.globalId));
 
    /** execute sale -> groupby mint address  */
    const salesGroupedByMint = groupBy(executeSaleTransactionData, 'mint');
 
    /** for each mint, get collection ids, write marketdata4colleciton for each collection for each globalid */
    const promises = [];
    for (const [mint, sales] of salesGroupedByMint) {
        console.log(`Processing sales for mint: ${JSON.stringify(mint)}`);
        const collectionIds = await getCollectionIds(mint);
        console.log(`Got collection ids for mint: ${JSON.stringify(collectionIds)}`);
        console.log(`Processing [${sales.length}] sales for mint`);
        for (const sale of sales) {
            console.log(`Processing sale for mint: ${JSON.stringify(sale)}`);
            /** create md4 collection for each sale + collection combo! */
            const md4Collections = createMarketData4CollectionObjects({ globalId: sale.globalId, type: EntityType.ExecuteSaleTransaction }, collectionIds);
            for (const md of md4Collections) {
                console.log(`Writing object to the db: ${JSON.stringify(md)}`);
                promises.push(ddbmapper.update(md));
            }
        }
    }
    await Promise.all(promises);
})();