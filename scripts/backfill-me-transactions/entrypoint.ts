import * as axios from 'axios';
import { createInterface } from "readline";
import { createReadStream } from 'fs';
import { processItem } from './processorEntrypoint';
import { Entity } from '../../shared/src/types';
import { ddbmapper } from '../../shared/src/service/dynamodb'

const INPUT_FILE_PATH =  // list of transaction signatures as input
      process.env.INPUT_FILE_PATH
      || "/home/ubuntu/files/reconcile/iter2/outstanding_signatures.txt";
const ENDPOINT = // Solana RPC endpoint url
      process.env.ENDPOINT
      || "https://ssc-dao.genesysgo.net/";
const MAX_SIGNATURES_PER_HTTP_REQUEST = // total number of signatures allowed per HTTP request
      Number(process.env.MAX_SIGNATURES_PER_HTTP_REQUEST)
      || 50;
const MAX_NUMBER_PARALLEL_PROMISES = // number of promises which can run in parallel 
      Number(process.env.MAX_NUMBER_PARALLEL_PROMISES) 
      || 13;
const BATCH_SIZE = // this is kinda superfluous
      Number(process.env.BATCH_SIZE) 
      || 50;

const generateGetTransactionRequests = (signatureList: string[]) => {
  let getTrasactionRequest: Object[] = [];

  for (const item in signatureList) {
      let signature = signatureList[item];
      getTrasactionRequest.push({
          "jsonrpc":"2.0",
          "id":1,
          "method":"getTransaction",
          "params":
          [
              signature, 
              {
                  "encoding":"json",
                  "transactionDetails":"full",
                  "rewards":false
              }
          ]
      });
  }
  return getTrasactionRequest;
};

const httpPostRequest = async (payload: Object[]) => {
  console.log(`httpPostRequest for ${payload.length} items`);
  let batch: Object[] = [];
  const promises = [];
  for (const item of payload) {
    batch.push(item);
    if (batch.length >= MAX_SIGNATURES_PER_HTTP_REQUEST) {
      /** Convert this into a function, it's an exact copy of what's down below */
      const promise = genericHttpRequest("post", batch);
      promise.then(async (response) => {
        /** Ensure response is valid */
        if (!(Symbol.iterator in Object(response))) {
          console.log(`Unable to process response, item is not iterable. Sorry!`);
          return;
        }
        /** Keep a list of all created entity objects */
        let entityList: Entity[] = [];

        /** Response is a list of transaction objects, iterate over each one and process it */
        for (const responseItem of response) {
          const additionalEntityList = processItem(responseItem.result);
          if (!additionalEntityList) {
            console.log(`No me transactions parsed from this response item... continue!`);
            continue;
          }
          entityList.push(...additionalEntityList);
        }
        console.log(`Checking for items to write... EntityList = ${JSON.stringify(entityList)}`);
        /** Write all entity objects to the db */
        if (entityList.length > 0) {
          /** Reduce list to only unique values */
          entityList = entityList.reduce(
            (acc,curr) => 
              acc.find((v) => v.globalId === curr.globalId) ? acc : [...acc, curr],
              []
            );
            console.log(`Preparing to write items to ddb: ${JSON.stringify(entityList)}`);
            for (const entity of entityList) {
              promises.push(ddbmapper.put(entity));
            }
        }
        entityList = [];
      });
      promises.push(promise);
      batch = [];
    }
  }
  if (batch.length > 0) {
    const promise = genericHttpRequest("post", batch);
    promise.then(async (response) => {
        if (!(Symbol.iterator in Object(response))) {
          console.log(`Unable to process response, item is not iterable. Sorry!`);
          return;
        }
        let entityList: Entity[] = [];
        for (const item of response) {
          const additionalEntityList = processItem(item.result);
          if (!additionalEntityList) {
            console.log(`No me transactions parsed from this response item... continue!`);
            continue;
          }
          entityList.push(...additionalEntityList);
        }
        console.log(`Checking for items to write... EntityList = ${JSON.stringify(entityList)}`);
        if ( entityList.length > 0 ) {
          /** Reduce list to only unique values */
          entityList = entityList.reduce(
            (acc,curr) => 
              acc.find((v) => v.globalId === curr.globalId) ? acc : [...acc, curr],
              []
          );
          for (const entity of entityList) {
            promises.push(ddbmapper.put(entity));
          }
        }
        entityList = [];
    });
    promises.push(promise);
  }
  await Promise.all(promises);
};

const genericHttpRequest = async (httpMethod: string, payload: Object[]) => {
  console.log(`genericHttpRequest for ${payload.length} items`);
  try {
    const response = await axios.default({
      url: ENDPOINT,
      method: httpMethod,
      headers: {
        "content-type": "application/json",
      },
      data: payload,
    });
    return response.data;
  } catch (error) {
    console.error(`ERROR: ${JSON.stringify(error)}`);
  }
};

const fetchAndParseTransactions = async (signatures: Array<string>) => {
    let promises = [];
    let batch: string[] = [];
    for (const signature of signatures) {
      batch.push(signature);
      if (batch.length >= BATCH_SIZE) {
        const rpcRequest = generateGetTransactionRequests(batch);
        promises.push(httpPostRequest(rpcRequest));
        batch = [];
      }
      if (promises.length > MAX_NUMBER_PARALLEL_PROMISES) {
        console.log(`Waiting for current promises to complete...`);
        await Promise.all(promises);
        console.log(`All promises complete. Continuing!`);
        promises = [];
      }
    }
    if (batch.length > 0) {
      const rpcRequest = generateGetTransactionRequests(batch);
      promises.push(httpPostRequest(rpcRequest));
      batch = [];
    }
    await Promise.all(promises);
}

(async () => {
    /** This is gonna be a massive list */
    console.log(`Reading signatures from ${JSON.stringify(INPUT_FILE_PATH)}`);
    const signatures = [];
    const rl = createInterface({
      input: createReadStream(INPUT_FILE_PATH),
      crlfDelay: Infinity,
    });
    for await (const line of rl) {
        //console.log(`Line: ${line}`);
        signatures.push(line);
    }
    console.log(`Read [${JSON.stringify(signatures.length)}] signatures from ${INPUT_FILE_PATH}`);
    await fetchAndParseTransactions(signatures);
})();