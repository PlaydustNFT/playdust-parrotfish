import {
  attribute,
  hashKey,
  table,
} from "@aws/dynamodb-data-mapper-annotations";
import { v4 as uuid } from "uuid";
import { CensorData } from "../helpers/types";
import { EntityType } from "../../../shared/src/types";
import { TableNames } from "../../../shared/src/consts";

@table(TableNames.Entity)
export class CensorEntity {
  @hashKey()
  globalId?: string;

  @attribute()
  id?: string;

  @attribute()
  primaryEntity?: string;

  @attribute()
  type: EntityType.CensorTag;

  @attribute()
  createdAt: Date;

  @attribute()
  updatedAt: Date;

  @attribute()
  pipelines: null;

  @attribute()
  data: CensorData;

  populate = (data: CensorData, primaryEntity: string) => {
    this.id = uuid();
    this.globalId = this.id + "-" + EntityType.CensorTag;
    this.type = EntityType.CensorTag;
    this.primaryEntity = primaryEntity;
    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
    this.data = data;
  };

  populateWithoutChangingID = (
    id: string,
    data: CensorData,
    primaryEntity: string,
    createdAt: Date
  ) => {
    this.id = id;
    this.globalId = this.id + "-" + EntityType.CensorTag;
    this.type = EntityType.CensorTag;
    this.primaryEntity = primaryEntity;
    const now = new Date();
    this.createdAt = createdAt;
    this.updatedAt = now;
    this.data = data;
  };
}
