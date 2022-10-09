import {
  attribute,
  hashKey,
  table,
} from "@aws/dynamodb-data-mapper-annotations";

import { GlobalIdDelimiter, TableNames } from "../../consts";
import { Entity, EntityType, MarketplaceTransactionEntityData } from "../../types";

// type alias to make code easier to read
type PrimaryEntityGlobalId = string;
type WalletAddress = string;

@table(TableNames.Entity)
export class MarketplaceTransactionForWalletEntity implements Entity {
  @hashKey()
  globalId: string;

  @attribute()
  id: string;

  @attribute()
  primaryEntity: WalletAddress;

  @attribute()
  type = EntityType.MarketplaceTransactionForWallet;

  @attribute()
  createdAt: Date;

  @attribute()
  updatedAt: Date;

  @attribute()
  data: PrimaryEntityGlobalId;

  generateGlobalId = () => {
    return [this.type, this.id].join(GlobalIdDelimiter);
  }

  populate = (order: MarketplaceTransactionEntityData, primaryEntityGlobalId: PrimaryEntityGlobalId, primaryEntity: WalletAddress) => {
    this.id = primaryEntityGlobalId;
    this.globalId = this.generateGlobalId();
    this.primaryEntity = primaryEntity; 
    this.data = primaryEntityGlobalId;

    const now = new Date();
    this.createdAt = now; 
    this.updatedAt = now; 
  }
}
