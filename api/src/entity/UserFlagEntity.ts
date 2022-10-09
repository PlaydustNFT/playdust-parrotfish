import {
  attribute,
  hashKey,
  table,
} from "@aws/dynamodb-data-mapper-annotations";
import { v4 as uuid } from "uuid";
import { UserFlag } from "../helpers/types";
import { EntityType } from "../../../shared/src/types";
import { TableNames } from "../../../shared/src/consts";

@table(TableNames.Entity)
export class UserFlagEntity {
  @hashKey()
  globalId?: string;

  @attribute()
  id?: string;

  @attribute()
  primaryEntity?: string;

  @attribute()
  type: EntityType.UserFlag;

  @attribute()
  createdAt: Date;

  @attribute()
  updatedAt: Date;

  @attribute()
  pipelines: null;

  @attribute()
  data: UserFlag;

  populate = (data: UserFlag, primaryEntity: string) => {
    this.id = uuid();
    this.globalId = this.id + "-" + EntityType.UserFlag;
    this.type = EntityType.UserFlag;
    this.primaryEntity = primaryEntity;
    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
    this.data = data;
  };
}
