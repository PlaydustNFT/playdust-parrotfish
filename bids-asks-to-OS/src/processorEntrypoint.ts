import { AskOrderStateEntity } from '../../shared/src/entity/order_state/AskOrderStateEntity';
import { BidOrderStateEntity } from '../../shared/src/entity/order_state/BidOrderStateEntity';
import { ExecuteSaleTransactionEntity} from '../../shared/src/entity/transaction/ExecuteSaleTransactionEntity'
import { EntityType, OrderStateEntityData } from '../../shared/src/types';
import { ddbmapper } from '../../shared/src/service/dynamodb'
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import axios from 'axios';
import { IndexNames } from '../../shared/src/consts';
//random comment to trigger the build
const indexName = 
    String(process.env.MINT_OPEN_SEARCH_INDEX)
    || 'nft-metadata';
// FIXME: Move these somewhere else...
const url = 
    String(process.env.OPEN_SEARCH_URL)
    || 'https://opensearch-url/_bulk';
const auth = {
    username: String(process.env.OPEN_SEARCH_USERNAME) || 'playdust',
    password: String(process.env.OPEN_SEARCH_PASSWORD) || 'fdj.rya9ady.VYJ_mrg'
};

function buildBulkRequestPayload(documents) {
    let payloadLines = [];
    for (let i = 0; i < documents.length; i++) {
        let optionsObject = {
            update: {
                _index: indexName,
                _id: documents[i].mint
            }
        }
        payloadLines.push(JSON.stringify(optionsObject));
        let docObject = {
            doc: documents[i],
            doc_as_upsert: true
        }
        payloadLines.push(JSON.stringify(docObject));
    }
    return payloadLines.join('\n') + '\n';
}


export const processItem = async (mintAddresses: string[]) => {
    console.log(`OPEN_SEARCH_INDEX=${indexName}`);
    let documents = [];

    for(const mintAddress of mintAddresses){
        //1)
        //input: mint address
        //Let's suppose we receive the mint address only
        
        //2)
        //First we query the DB for blockchainAddress == MintAddress
        //get back all the OrderEntities
        let itemArray: any[] = [];
        for await (const item of ddbmapper.query(AskOrderStateEntity, 
            { type: EntityType.AskOrderState, primaryEntity: mintAddress }, 
            { indexName: IndexNames.EntityDb.typePrimaryEntityIndex }
        )) {
            // individual items with a hash key of "foo" will be yielded as the query is performed
            itemArray.push(item);
        }

        for await (const item of ddbmapper.query(BidOrderStateEntity, 
            { type: EntityType.BidOrderState, primaryEntity: mintAddress }, 
            { indexName: IndexNames.EntityDb.typePrimaryEntityIndex }
        )) {
            // individual items with a hash key of "foo" will be yielded as the query is performed
            itemArray.push(item);
        }

        //3)
        //Save active bids and asks
        let activeBid: OrderStateEntityData[] = [];
        let activeAsk: OrderStateEntityData[] = [];
        for(const item of itemArray){
            //filter for only the active bids/asks
            if(item.data.active){
                if(item.type == EntityType.AskOrderState){
                    // ask entity
                    const ask = {
                        marketplace: item.data.marketplace,
                        price: item.data.price / LAMPORTS_PER_SOL,
                        blockTime: item.data.blockTime
                    }
                    activeAsk.push(ask);

                }else if(item.type == EntityType.BidOrderState){
                    // bid entity
                    const bid = {
                        marketplace: item.data.marketplace,
                        price: item.data.price / LAMPORTS_PER_SOL,
                        blockTime: item.data.blockTime
                    }
                    activeBid.push(bid);

                }
            }
        }

        //4)
        //query again the DB for all the transactions
        //needed to calculate lastSalePrice and totalVolume ofr a single NFT
        let transactionArray: ExecuteSaleTransactionEntity[] = [];
        for await (const item of ddbmapper.query(ExecuteSaleTransactionEntity, 
            { type: EntityType.ExecuteSaleTransaction, primaryEntity: mintAddress }, 
            { indexName: IndexNames.EntityDb.typePrimaryEntityIndex }
        )) {
            //let's filter for the execute sale transaction
            //if execute sale is not present in the globalId then index returned will be -1
            transactionArray.push(item);
        }

        //Now loop over all the executeSaleTransaction array and compute totalVolume and lastSale
        
        let lastSale: number;
        if(transactionArray.length > 0){
            transactionArray.sort(function(a,b){return a.data.created - b.data.created});
            lastSale = transactionArray[transactionArray.length - 1]?.data.price / LAMPORTS_PER_SOL;
        }
    
        let totalVolume: number = 0;
        for(const item of transactionArray){  
            totalVolume += item.data.price;
        }


        //Sort the array based on price
        activeAsk.sort(function(a,b){return a.price - b.price});
        activeBid.sort(function(a,b){return a.price - b.price});
        //this obj needs to be added to OS metadata index
        const objOS = {
            mint: mintAddress,
            bids: activeBid,
            asks: activeAsk,
            lastSalePrice: lastSale,
            totalVolume: (totalVolume == 0) ? 0 : (totalVolume / LAMPORTS_PER_SOL)
        }
        if(!objOS.lastSalePrice){
            delete objOS.lastSalePrice;
        }
        if (activeAsk.length > 0) {
            objOS['listedPrice'] = activeAsk[0].price;
        }else{
            objOS['listedPrice'] = null;
        }
        if('mint' in objOS){
            documents.push(objOS);
        }
    }

    if (documents.length > 0) {
        try {
            await axios.post(
                url,
                buildBulkRequestPayload(documents),
                {
                    auth: auth,
                    headers: {
                        'Content-Type': 'application/x-ndjson;'
                    }
                }
            );
        } catch(err) {
            console.error(err);
        }
    }
}



