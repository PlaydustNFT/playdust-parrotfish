import createError from "http-errors";
import { Request, Response, NextFunction } from "express";
import { MetaplexOffChainMetadataEntity } from "../../../shared/src/entity/MetaplexOffChainMetadataEntity"
import { MetaplexOnChainMetadataEntity } from "../../../shared/src/entity/MetaplexOnChainMetadataEntity"
import { PlaydustCollectionEntity } from "../../../shared/src/entity/PlaydustCollectionEntity"
import { CollectionMetaDataEntity } from "../../../shared/src/entity/CollectionMetaDataEntity"
import { CollectionPriceDataEntity } from "../../../shared/src/entity/CollectionPriceDataEntity"
import { BidOrderStateEntity } from "../../../shared/src/entity/order_state/BidOrderStateEntity"
import { AskOrderStateEntity } from "../../../shared/src/entity/order_state/AskOrderStateEntity"
import { CollectionAttributeDataEntity } from "../../../shared/src/entity/CollectionAttributeDataEntity"
import { NFTRarityEntity } from "../../../shared/src/entity/NFTRarityEntity"
import { Entity } from "../../../shared/src/entity/Entity"
import { ddbmapper } from "../services/dynamodb";
import { CollectionAttributeData, CollectionMetaData, CollectionPriceData, CollectionType, EntityType, Metadata, NFTRarityData, OffChainMetadata, OrderStateEntityData, OrderStateEntityDataWithWallet, PlaydustCollectionData } from "../../../shared/src/types";
import { IndexNames } from "../../../shared/src/consts";
import { getCollectionIds } from "../../../shared/src/util";

export interface MintDetails {
  mintOffChainMetadata: OffChainMetadata;
  mintOnChainMetadata: Metadata;
  mintRarity: NFTRarityData;
  playdustCollection: PlaydustCollectionData;
  collectionMetadata: CollectionMetaData;
  collectionPriceData: CollectionPriceData;
  collectionAttributeData: CollectionAttributeData;
  mintBids: [OrderStateEntityDataWithWallet];
  mintAsks: [OrderStateEntityDataWithWallet];
};

export default class MintController {

  /**
   * 
   * 
   * @param req 
   * @param res 
   * @param next
   */
  static async getAggregatedMintDetails(
    req: Request<Record<string, string>, Record<string, unknown>>,
    res: Response,
    next: NextFunction
  ) {
      /** Verify mint address is present in query */
      if (!req.query.mintAddress) {
        const errorMessage = 'Query missing "mintAddress" parameter, failed to get mint details';
        console.log(errorMessage);
        next(new createError.PreconditionFailed(errorMessage));
      }

      /** Get mint address from query */
      const mintAddress = String(req.query.mintAddress);

      try {
        console.log(`Mint endpoint for ${mintAddress}`);

        // get all collections for mint
        const collections = await getCollectionIds(mintAddress);
        console.log(`Collections: ${JSON.stringify(collections)}`);

        let allCollections: PlaydustCollectionData[] = [];
        for(const item of collections){
            let entity: PlaydustCollectionEntity = new PlaydustCollectionEntity();
            entity.globalId = EntityType.PlaydustCollection + '-' + item;
            console.log(`Getting entity: ${JSON.stringify(entity)}`);
            await ddbmapper.get(entity)
            .then(item => {
                allCollections.push(item.data);
                console.log('collection retrieved!');
            })
            .catch(err => {
                console.log('Error retrieving the collection');
                console.log(err);
            });
        }

        let playdustCollectionData: PlaydustCollectionData = MintController.getHighestOrderCollection(allCollections);
        /** Get Collection Metadata */
        let collectionMetadata: CollectionMetaData;
        if (playdustCollectionData.id) {
          console.log(`Requesting collectionMetadata for collection: ${JSON.stringify(playdustCollectionData.id)}`);
          for await (const item of ddbmapper.query( CollectionMetaDataEntity, { type: EntityType.CollectionMetaData, primaryEntity: playdustCollectionData.id}, { indexName: IndexNames.EntityDb.typePrimaryEntityIndex } )) {
            collectionMetadata = item.data;
            break;
          }
        }
        let collectionPriceData: CollectionPriceData;
        let collectionAttributeData: CollectionAttributeData;
        let nftRarityItem: NFTRarityData;
        if (playdustCollectionData.id) {
          console.log(`Requesting CollectionPriceData for collection: ${JSON.stringify(playdustCollectionData.id)}`)
          for await (const item of ddbmapper.query( CollectionPriceDataEntity, { type: EntityType.CollectionPriceData, primaryEntity: playdustCollectionData.id}, { indexName: IndexNames.EntityDb.typePrimaryEntityIndex } )) {
            collectionPriceData = item.data;
            break;
          }
          console.log(`Got CollectionPriceData for collection: ${JSON.stringify(collectionPriceData)}`)
          console.log(`Requesting CollectionAttribute for collection: ${JSON.stringify(playdustCollectionData.id)}`)
          for await (const item of ddbmapper.query( CollectionAttributeDataEntity, { type: EntityType.CollectionAttributeData, primaryEntity: playdustCollectionData.id}, { indexName: IndexNames.EntityDb.typePrimaryEntityIndex } )) {
            collectionAttributeData = item.data;
            break;
          }
          console.log(`Got CollectionAttribute for collection: ${JSON.stringify(collectionAttributeData)}`)
          console.log(`Requesting NFTRarity for mint: ${JSON.stringify(mintAddress)} and collection: ${JSON.stringify(playdustCollectionData.id)}`)
          for await (const item of ddbmapper.query( NFTRarityEntity, { type: EntityType.NFTRarity, primaryEntity: mintAddress}, { indexName: IndexNames.EntityDb.typePrimaryEntityIndex } )) {
            if (item.id === playdustCollectionData.id) {
              nftRarityItem = item.data;
              break;
            }
          }
          console.log(`Got NFTRarity for mint/collection: ${JSON.stringify(nftRarityItem)}`);
        }

        /** Get on chain metadata */
        console.log(`Requesting on chain metadata from database.`);
        let onChainMetadata: Metadata;
        for await (const item of ddbmapper.query( MetaplexOnChainMetadataEntity, { type: EntityType.MetaplexOnChainMetadata, primaryEntity: mintAddress}, { indexName: IndexNames.EntityDb.typePrimaryEntityIndex } )) {
          onChainMetadata = item.data;
          break;
        }
        console.log(`on chain metadata: ${JSON.stringify(onChainMetadata)}`);
        /** Get off chain metadata */
        console.log(`Requesting off chain metadata from database.`);
        let offChainMetadata: OffChainMetadata;
        for await (const item of ddbmapper.query( MetaplexOffChainMetadataEntity, { type: EntityType.MetaplexOffchainMetadata, primaryEntity: mintAddress}, { indexName: IndexNames.EntityDb.typePrimaryEntityIndex } )) {
          offChainMetadata = item.data;
          break;
        }
        console.log(`off chain metadata: ${JSON.stringify(offChainMetadata)}`);

        /* Get Bids for an NFT */
        console.log(`Requesting bids from database.`);
        let mintBids = [];
        for await (const item of ddbmapper.query( BidOrderStateEntity, { type: EntityType.BidOrderState, primaryEntity: mintAddress}, { indexName: IndexNames.EntityDb.typePrimaryEntityIndex } )) {
          if(item.data.active === true) {
            const bidRecord = new OrderStateEntityDataWithWallet(item.data, item.id)
            mintBids.push(bidRecord);
          }
        }
        console.log(`bids: ${JSON.stringify(mintBids)}`);

        /* Get Asks for an NFT */
        console.log(`Requesting asks from database.`);
        let mintAsks = [];
        for await (const item of ddbmapper.query( AskOrderStateEntity, { type: EntityType.AskOrderState, primaryEntity: mintAddress}, { indexName: IndexNames.EntityDb.typePrimaryEntityIndex } )) {
          if(item.data.active === true) {
            const askRecord = new OrderStateEntityDataWithWallet(item.data, item.id)
            mintAsks.push(askRecord);
          }
        }
        console.log(`asks: ${JSON.stringify(mintAsks)}`);

        const mintDetailsResponse = {
          mintOnChainMetadata: onChainMetadata,
          mintOffChainMetadata: offChainMetadata,
          mintRarity: nftRarityItem,
          playdustCollection: playdustCollectionData,
          collectionAttributeData: collectionAttributeData,
          collectionMetadata: collectionMetadata,
          collectionPriceData: collectionPriceData,
          mintBids: mintBids,
          mintAsks: mintAsks,
        } as MintDetails;
        console.log(`Sending mint details: ${JSON.stringify(mintDetailsResponse)}`);
        res.send(mintDetailsResponse);
      }
      catch (err) {
        console.log(`Failed to get mint details for mint address: ${mintAddress}; error: ${JSON.stringify(err)}`);
        next(err);
      }
  }

  static getHighestOrderCollection = (allCollections: PlaydustCollectionData[]): PlaydustCollectionData => {
    console.log(`getHighestOrderCollection: allCollections: ${JSON.stringify(allCollections)}`);
    for(const item of allCollections){
      if(item.type == CollectionType.MagicEden){
        return item;
      }
    }
    //2
    for(const item of allCollections){
      if(item.type == CollectionType.Metaplex){
        return item;
      }
    }
    //3
    for(const item of allCollections){
      if(item.type == CollectionType.Manual){
        return item;
      }
    }
    //4
    for(const item of allCollections){
      if(item.type == CollectionType.Derived){
        return item;
      }
    }
    return {} as PlaydustCollectionData;
  }
}
