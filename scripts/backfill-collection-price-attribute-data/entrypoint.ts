import { createInterface } from "readline";
import { createReadStream } from 'fs';
import { processCollectionId } from './module';

const DELAY =
        Number(process.env.DELAY)
        || 3000;

const MAX_PROMISES = // max concurrent promises
        Number(process.env.MAX_PROMISES)
        || 50;

const MODE = // controls which mode operates: { PRICE, ATTRIBUTE }
        Number(process.env.MODE)
        || 1;

const INPUT_FILE_PATH = // where to source the collection ids file
        process.env.INPUT_FILE_PATH
        || '/home/ubuntu/files/collectionIds.txt';
(async () => 
{
    /** Fetch all collection ids from file */
    const outerTimerLabel = 'outer';
    console.time(outerTimerLabel);
    const innerTimerLabel = 'inner';
    console.time(innerTimerLabel);
    const collectionIds: string[] = [];
    console.log(`Reading collection ids from ${JSON.stringify(INPUT_FILE_PATH)}`);

    const rl = createInterface({
      input: createReadStream(INPUT_FILE_PATH),
      crlfDelay: Infinity,
    });
    for await (const line of rl) {
        //console.log(`Line: ${line}`);
        collectionIds.push(line);
    }
    console.log(`Read [${JSON.stringify(collectionIds.length)}] items from ${INPUT_FILE_PATH}`);


    let promises = [];
    let i = 0;
    let batchNumber = 0;
    /** process each individual collection id */
    for (const collectionId of collectionIds) {
        i+=1;
        console.log(`Processing collectionId: ${collectionId}; (${i}/${collectionIds.length})`);
        if (promises.length >= MAX_PROMISES) {
	    	await Promise.all(promises);
            console.timeEnd(innerTimerLabel)
	    	console.log(`COMPLETE=${MAX_PROMISES*batchNumber}|PROMISES_PER_BATCH=${MAX_PROMISES}|BATCH_NUMBER=${batchNumber}`);
	    	batchNumber += 1;
	    	promises = [];
            console.time(innerTimerLabel)
        }
        promises.push(processCollectionId(collectionId, MODE));
    }
    console.log(`READ COMPLETE | AWAITING FINAL PROMISES`);

    await Promise.all(promises);
    console.timeEnd(outerTimerLabel)

    /** reduce marketdata4Collection objects to their data / reference global id */
})();
