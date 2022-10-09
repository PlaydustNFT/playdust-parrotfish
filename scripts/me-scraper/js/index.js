const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const HTMLParser = require('node-html-parser');
const axios = require('axios').default;
const fs = require('fs');

// add stealth plugin and use defaults (all evasion techniques)
puppeteer.use(StealthPlugin());

const MAGIC_EDEN_API = 'https://api-mainnet.magiceden.io';
const ALL_COLLECTIONS =  'all_collections_with_escrow_data';
const ME_COLLECTIONS = [MAGIC_EDEN_API, ALL_COLLECTIONS].join('/');
const MAGIC_EDEN_RPC = [MAGIC_EDEN_API, 'rpc'].join('/');
const GET_LISTED_NFTS_BY_QUERY_LITE = [MAGIC_EDEN_RPC, 'getListedNFTsByQueryLite'].join('/');

// Opens a stream in write mode - keeps the file but removes the content
var collectionMetadataStream = fs.createWriteStream('collectionMetadata.json', {flags: 'w'});
// Opens a stream in append mode
var collectionNFTsStream = fs.createWriteStream('collectionNFTs.json', {flags: 'a'});

/**
 * Puppeteer-extra is a drop-in replacement for puppeteer,
 * it augments the installed puppeteer with plugin functionality
 * @file Fetch data from Magic Eden Rpc without getting cloudflare captchas
 * @author Enver Podgorcevic
 */
(async function main() {
   // fetching collection symbols
   const allCollections = await fetchCollectionSymbols();
   collectionMetadataStream.write(JSON.stringify(allCollections));
   // diffing
   const collectionSymbols = diffCollectionSymbols(allCollections.map(c => c.symbol));
   // fetching collections
   await fetchCollectionData(collectionSymbols);
})();

async function fetchCollectionNFTs(collectionSymbol) {
   const result = await fetchUrl(createGetNFTsQuery(collectionSymbol, 100000));
   return result;
}

async function fetchUrl(url) {
   try {
      const browser = await puppeteer.launch();
      const [page] = await browser.pages();

      await page.setDefaultNavigationTimeout(0);
      await page.setUserAgent('5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');
      await page.goto(url, {
         waitUntil: 'networkidle0'
      });
      const bodyHTML = await page.evaluate(() => document.body.innerHTML);
      const json = HTMLParser.parse(bodyHTML).firstChild.innerText;

      await browser.close();
      return json;
   } catch (err) {
      console.error(err);
   }
}

function createGetNFTsQuery(collectionSymbol, limit) {
    const query =
    'q={%22$match%22:{%22collectionSymbol%22:%22' +
    collectionSymbol +
    '%22},%22$sort%22:{%22createdAt%22:-1},%22$skip%22:0,%22$limit%22:'+
    limit +
    ',%22status%22:[%22all%22]}';
    return [
        GET_LISTED_NFTS_BY_QUERY_LITE,
        query
    ].join('?');
}

async function fetchCollectionSymbols() {
  const resp = await axios.get(ME_COLLECTIONS); 
  return resp.data.collections;
}

function diffCollectionSymbols(allCollectionSymbols) {
  return allCollectionSymbols;
}

async function fetchCollectionData(collectionSymbols) {
   for (const collectionSymbol of collectionSymbols) {
      try {
         console.log('fetching collection: ' + collectionSymbol);
         const allNFTs = await fetchCollectionNFTs(collectionSymbol);
         collectionNFTsStream.write(allNFTs + '\n');
         await delay(10);
      } catch (e) {
         console.log('Could not fetch collection: ' + collectionSymbol);
         console.log(e)
      }
   }
}

function delay(n){
   return new Promise(function(resolve){
       setTimeout(resolve,n*1000);
   });
}