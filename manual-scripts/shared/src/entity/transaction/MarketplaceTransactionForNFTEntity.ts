import {
  attribute,
  hashKey,
  table,
} from "@aws/dynamodb-data-mapper-annotations";

import { GlobalIdDelimiter, TableNames } from "../../consts";
import { Entity, EntityType, MarketplaceTransactionEntityData } from "../../types";

// type alias to make code easier to read
type PrimaryEntityGlobalId = string;
type TokenMintAddress = string;

@table(TableNames.Entity)
export class MarketplaceTransactionForNFTEntity implements Entity {
  @hashKey()
  globalId: string;

  @attribute()
  id: string;

  @attribute()
  primaryEntity: TokenMintAddress;

  @attribute()
  type = EntityType.MarketplaceTransactionForNFT;

  @attribute()
  createdAt: Date;

  @attribute()
  updatedAt: Date;

  @attribute()
  data: PrimaryEntityGlobalId;

  generateGlobalId = () => {
    return [this.type, this.id].join(GlobalIdDelimiter);
  }

  populate = (order: MarketplaceTransactionEntityData, primaryEntityGlobalId: PrimaryEntityGlobalId, primaryEntity: TokenMintAddress) => {
    this.id = primaryEntityGlobalId;
    this.primaryEntity = primaryEntity; 
    this.globalId = this.generateGlobalId();
    this.data = primaryEntityGlobalId;

    const now = new Date();
    this.createdAt = now; 
    this.updatedAt = now; 
  }

}
