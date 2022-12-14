import { CollectionPriceDataEntity } from '../../shared/src/entity/CollectionPriceDataEntity'
import { ExecuteSaleTransactionEntity } from '../../shared/src/entity/transaction/ExecuteSaleTransactionEntity'
import { AskOrderStateEntity } from '../../shared/src/entity/order_state/AskOrderStateEntity'
import { CollectionPriceData, EntityType, RelatedEntityData } from '../../shared/src/types'
import { ddbmapper } from '../../shared/src/service/dynamodb';
import {
  equals,
} from "@aws/dynamodb-expressions";
import { IndexNames } from '../../shared/src/consts';
import { 
  calculateCeilingPriceByMarketplace,
  calculateFloorPriceByMarketplace 
} from './calculator/price';
import {
  calculateVolumeByMarketplace
} from './calculator/volume'
import { MarketData4CollectionEntity } from '../../shared/src/entity/MarketData4CollectionEntity';
import { groupBy, getBatchOfEntityObjects } from '../../shared/src/util/collection';

const MAX_ITEM_LENGTH_DDB =
        process.env.MAX_ITEM_LENGTH_DDB
        || 400000;

const isOversizedForDynamoDB = (obj: any) => {
    return Buffer.from(JSON.stringify(obj)).length >= MAX_ITEM_LENGTH_DDB;
}

export const processItem = async (collectionId: string) => {
    /** List of global ids of the primary entities */
    const relatedEntityDataItems: RelatedEntityData[] = [];

    /** Get all nft4collectionId objects from db for this collection (use typeIndex) */
    for await (const marketData of 
        ddbmapper.query(
            MarketData4CollectionEntity,
            { 
              type: EntityType.MarketData4Collection,
              primaryEntity: collectionId  
            },
            {
              indexName: IndexNames.EntityDb.typePrimaryEntityIndex,
            }
        )) 
    {
        relatedEntityDataItems.push(marketData.data);
    }

    const groupedRelatedEntityDataItems = groupBy(relatedEntityDataItems, 'type');
    /** Split by Entity Type */
    const expectedAskOrderStates =  groupedRelatedEntityDataItems[EntityType.AskOrderState];
    const relatedExecuteSales =  groupedRelatedEntityDataItems[EntityType.ExecuteSaleTransaction];

    const collectionPriceData = {} as CollectionPriceData;
    let updated = false;
    if (expectedAskOrderStates && expectedAskOrderStates !== undefined) {
      // self correct an issue generated by the active orders backfill processor 
      // issue: we created items with bidOrderState type (correct) but askOrderState in related entity (incorrect)
      // here, we will update the items with bidOrderState related entities global id to have the accurate type (bidOrderState)
      const bidOrderStateErrors = expectedAskOrderStates.filter(item => item.globalId.split("-")[0] === "bidOrderState");
      const relatedAskOrderStates = expectedAskOrderStates.filter(item => item.globalId.split("-")[0] === "askOrderState");
      const fixBrokenBidsPromises = []
      for (const bid of bidOrderStateErrors) {
        const md = new MarketData4CollectionEntity();
        md.populate({globalId: bid.globalId, type: EntityType.BidOrderState }, collectionId);
        fixBrokenBidsPromises.push(ddbmapper.update(md));
      }

      await Promise.all(fixBrokenBidsPromises);
      /** Batch Get Requests to get all related objects */
      const askOrderStateEntitiesForCollection = await getBatchOfEntityObjects(AskOrderStateEntity, relatedAskOrderStates);
      const askOrdersForCollection = askOrderStateEntitiesForCollection.map(item => item.data).filter(item => item.active);
      /** calculate floor price, ceiling price */
      collectionPriceData.floorPrice = calculateFloorPriceByMarketplace(askOrdersForCollection);
      collectionPriceData.ceilingPrice = calculateCeilingPriceByMarketplace(askOrdersForCollection);
      updated = true;
    }

    if (relatedExecuteSales && relatedExecuteSales !== undefined && relatedExecuteSales != null) {
      /** calculate volume */
      const tradeEntitiesForCollection = await getBatchOfEntityObjects(ExecuteSaleTransactionEntity, relatedExecuteSales);
      const tradesForCollection = tradeEntitiesForCollection.map(item => item.data);
      collectionPriceData.volume = calculateVolumeByMarketplace(tradesForCollection);
      updated = true;
    }

    if (updated) {
      /** Update database */
      const target = new CollectionPriceDataEntity();
      target.id = collectionId;
      target.globalId = target.generateGlobalId();

      await ddbmapper.get(target)
        .then(async (item) => {
          /** Lookup successful, update existing object */
          item.data = collectionPriceData;
          item.updatedAt = new Date();
          if (isOversizedForDynamoDB(item)) {
            console.log(`FAIL|reason=too big|data=${JSON.stringify(item)}`);
          }
          else {
            console.log(`WRITE|mode=price|data=${JSON.stringify(item)}`);
            await ddbmapper.update(item);
          }
        })
        .catch(async (err) => {
          /** Failed to lookup, populate & put "target" */
          target.populate(collectionId, collectionId, collectionPriceData);
          if (isOversizedForDynamoDB(target)) {
            console.log(`FAIL|reason=too big|data=${JSON.stringify(target)}`);
          }
          else {
            console.log(`WRITE|mode=price|data=${JSON.stringify(target)}`);
            await ddbmapper.update(target);
          }
        });
    }
}
