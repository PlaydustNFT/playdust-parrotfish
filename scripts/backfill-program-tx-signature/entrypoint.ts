// This simply needs to fetch all the signatures for a given program address and save them to a file

/**
input:
via environment variables
- program address
- output file path
- max number of signatures per request
output:
- file populated with list of transaction signatures for the program
*/
import { logger } from "../util/logger";
import { ConfirmedSignatureInfo, Connection, PublicKey, SignaturesForAddressOptions } from "@solana/web3.js";
import { writeFile } from 'fs';

const PROGRAM_ADDRESS = process.env.PROGRAM_ADDRESS  // the desired program address to fetch signatures for
      || "M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K";
const OUTPUT_FILE_PATH = process.env.OUTPUT_FILE_PATH  // file path to write the fetched signatures 
      || "/home/ubuntu/files/me_v2_transaction_signatures.txt";
const MAX_SIGNATURES_PER_REQUEST = Number(process.env.MAX_SIGNATURES_PER_REQUEST)  // # of signatures per request, ceiling == 1k
      || 1000;
const ENDPOINT = process.env.ENDPOINT  // Solana RPC endpoint url
      || "https://api.mainnet-beta.solana.com";//"https://ssc-dao.genesysgo.net/";
const THROTTLE_DURATION_MS = Number(process.env.THROTTLE_DURATION_MS)  // small delay to wait between requests
      || 7000; // ms
const START_SIGNATURE = String(process.env.START_SIGNATURE) // to start from a certain point in history
      || '';
const STOP_SIGNATURE = String(process.env.STOP_SIGNATURE) // to start from a certain point in history
      || '';


const writeSignatures = (signatureBatch: Array<ConfirmedSignatureInfo>) => {
    let data = "";
    signatureBatch.forEach(element => {
        data += element.signature + '\r\n';
    })
    writeFile(OUTPUT_FILE_PATH, data, {flag: 'a+'}, err => {
        if (err) {
            console.error(`Failed to write file: ${JSON.stringify(err)}`);
            return;
        }
    });
}

  //the only parameter required is the program address
const requestSignaturesFromProgramAccount = async (
  programAccount: string,
  start: string,
  stop: string,
) => {
  console.log(`requestSignaturesFromProgramAccount: Using endpoint: ${ENDPOINT}`);
  console.time("SignatureScraperSubscribe");

  const connection = new Connection(ENDPOINT);

  let signatures = [];
  let option: SignaturesForAddressOptions = {limit: MAX_SIGNATURES_PER_REQUEST};
  if (start && start !== '') {
        option.before = start;
  }
  if (stop && stop !== '') {
    option.until = stop;
  }
  console.log(`Getting signatures with options: ${JSON.stringify(option)}`);
  let signatureBatch = await connection.getSignaturesForAddress(new PublicKey(programAccount), option);
  writeSignatures(signatureBatch);

  //if the batch is smaller than 1k it means we reached the end
  //either because we fetch all the available transactions or because we reach endSignature
  while(signatureBatch.length == MAX_SIGNATURES_PER_REQUEST) {
      await new Promise((r) => setTimeout(r, THROTTLE_DURATION_MS));
      option['before'] = signatureBatch[MAX_SIGNATURES_PER_REQUEST - 1].signature;

      signatureBatch = await connection.getSignaturesForAddress(new PublicKey(programAccount), option);
      writeSignatures(signatureBatch);
  }   
  console.timeEnd("SignatureScraperSubscribe");
};

(() => 
{
  console.log(`Calling requestSignaturesFromProgramAccount...`);
  requestSignaturesFromProgramAccount(PROGRAM_ADDRESS, START_SIGNATURE, STOP_SIGNATURE);
})();
