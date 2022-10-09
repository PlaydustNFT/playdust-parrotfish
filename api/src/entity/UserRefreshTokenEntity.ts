/**
 * TODO move this to shared once we combine the playdust-api with playdust-parrotfish
 * 
 * Merge copied versions of consts, types, util into the shared repository
 */
import {
  attribute,
  hashKey,
  table,
} from "@aws/dynamodb-data-mapper-annotations";

import { TableNames } from "../../../shared/src/consts";
import { Entity, EntityType, UserRefreshTokenEntityData, PipelineConfig } from "../../../shared/src/types";
import { buildUserRefreshTokenEntityGlobalId } from "../../../shared/src/util";

type MintAddress = string;

@table(TableNames.Entity)
export class UserRefreshTokenEntity implements Entity {
  @hashKey()
  globalId: string;

  @attribute()
  id: string;

  @attribute()
  primaryEntity: null;

  @attribute()
  type: EntityType.UserRefreshTokenEntity;

  @attribute()
  createdAt: Date;

  @attribute()
  updatedAt: Date;

  @attribute()
  pipelines: PipelineConfig;

  @attribute()
  data: UserRefreshTokenEntityData;

  /**
   * 
   * The blockchain address is empty for this object
   * 
   * @param data UserRefreshTokenEntityData
   * @param wallet 
   */
  populate = (data: UserRefreshTokenEntityData, wallet: string) => {
    this.data = data;
    this.id = wallet;
    this.type = EntityType.UserRefreshTokenEntity;
    this.globalId = buildUserRefreshTokenEntityGlobalId(this.type, wallet);
    const now = new Date();
    this.createdAt = now; 
    this.updatedAt = now; 
  }
}
