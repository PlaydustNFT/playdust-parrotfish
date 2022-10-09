import {
  attribute,
  hashKey,
  table,
} from "@aws/dynamodb-data-mapper-annotations";
import { v4 as uuid } from "uuid";
import { StaleFlag } from "../helpers/types";
import { EntityType } from "../../../shared/src/types";
import { TableNames } from "../../../shared/src/consts";

@table(TableNames.Entity)
export class UserStaleFlagEntity {
  @hashKey()
  globalId?: string;

  @attribute()
  id?: string;

  @attribute()
  primaryEntity?: string;

  @attribute()
  type: EntityType.StaleFlag;

  @attribute()
  createdAt: Date;

  @attribute()
  updatedAt: Date;

  @attribute()
  pipelines: null;

  @attribute()
  data: StaleFlag;

  populate = (data: StaleFlag, primaryEntity: string) => {
    this.id = uuid();
    this.globalId = this.id + "-" + EntityType.StaleFlag;
    this.type = EntityType.StaleFlag;
    this.primaryEntity = primaryEntity;
    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
    this.data = data;
  };
}
