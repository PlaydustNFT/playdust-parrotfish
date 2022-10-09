import { createInterface } from "readline";
import { createReadStream } from 'fs';
import { calculateAndCreateActiveOrderState } from './module'

const INPUT_FILE_PATH = // where to source the collection ids file
    process.env.INPUT_FILE_PATH
    || '/home/ubuntu/files/mintAddresses.txt';

const MAX_PROMISES =
    Number(process.env.MAX_PROMISES)
    || 100000;

(async () => 
{
    /** Read all mints from file */
    const activeOrdersTimerLabel = 'active-orders';
    console.time(activeOrdersTimerLabel);
    const activeOrdersInnerTimerLabel = 'active-orders-inner';
    console.time(activeOrdersInnerTimerLabel);
    console.log(`Reading mint addresses from ${JSON.stringify(INPUT_FILE_PATH)}`);
    let promises = [];
    const rl = createInterface({
      input: createReadStream(INPUT_FILE_PATH),
      crlfDelay: Infinity,
    });
    let i = 1;
    let batchNumber = 1;
    for await (const mint of rl) {
        /** check if there's existing bid/ask order state items in the db to avoid wasting cycles! */
        // REMOVE ME IF NOT NEEDED let dbItemsExist = false;
        // REMOVE ME IF NOT NEEDED for await (const _ of ddbmapper.query(BidOrderStateEntity, {
        // REMOVE ME IF NOT NEEDED     type: EntityType.BidOrderState,
        // REMOVE ME IF NOT NEEDED     primaryEntity: mint,
        // REMOVE ME IF NOT NEEDED },
        // REMOVE ME IF NOT NEEDED {
        // REMOVE ME IF NOT NEEDED     indexName: IndexNames.EntityDb.typePrimaryEntityIndex
        // REMOVE ME IF NOT NEEDED })) {
        // REMOVE ME IF NOT NEEDED     dbItemsExist = true;
        // REMOVE ME IF NOT NEEDED     break;
        // REMOVE ME IF NOT NEEDED }
        // REMOVE ME IF NOT NEEDED if (dbItemsExist) {
        // REMOVE ME IF NOT NEEDED     console.log(`Skipping item: ${mint}`);
        // REMOVE ME IF NOT NEEDED     continue;
        // REMOVE ME IF NOT NEEDED }
        // REMOVE ME IF NOT NEEDED for await (const _ of ddbmapper.query(AskOrderStateEntity, {
        // REMOVE ME IF NOT NEEDED     type: EntityType.AskOrderState,
        // REMOVE ME IF NOT NEEDED     primaryEntity: mint,
        // REMOVE ME IF NOT NEEDED },
        // REMOVE ME IF NOT NEEDED {
        // REMOVE ME IF NOT NEEDED     indexName: IndexNames.EntityDb.typePrimaryEntityIndex
        // REMOVE ME IF NOT NEEDED })) {
        // REMOVE ME IF NOT NEEDED     dbItemsExist = true;
        // REMOVE ME IF NOT NEEDED     break;
        // REMOVE ME IF NOT NEEDED }
        // REMOVE ME IF NOT NEEDED if (dbItemsExist) {
        // REMOVE ME IF NOT NEEDED     console.log(`SKIP ${mint}`);
        // REMOVE ME IF NOT NEEDED     continue;
        // REMOVE ME IF NOT NEEDED }
	    // await promises
	    if (promises.length >= MAX_PROMISES) {
	    	await Promise.all(promises);
            console.timeEnd(activeOrdersInnerTimerLabel)
	    	console.log(`COMPLETE=${MAX_PROMISES*batchNumber}|PROMISES_PER_BATCH=${MAX_PROMISES}|BATCH_NUMBER=${batchNumber}`);
	    	batchNumber += 1;
	    	promises = [];
            console.time(activeOrdersInnerTimerLabel)
	    }
        promises.push(calculateAndCreateActiveOrderState(mint));
        i+=1;
    }
    console.log(`READ COMPLETE | AWAITING FINAL PROMISES`);

    await Promise.all(promises);

    console.timeEnd(activeOrdersTimerLabel)
    //await Promise.all(promises);
})();