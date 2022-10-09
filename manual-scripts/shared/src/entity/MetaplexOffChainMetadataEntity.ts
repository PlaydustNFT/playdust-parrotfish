import {
  attribute,
  hashKey,
  table,
} from "@aws/dynamodb-data-mapper-annotations";
import {v4 as uuidv4} from 'uuid';
import {buildOffchainMetadataEntityGlobalId} from '../../../shared/src/util';
import { Entity, EntityType, OffChainMetadata} from "../types";
 

type mintAddress = string;

// TODO: table name should be read from environment var rather than defined in consts
@table('playdust-parrotfish-prod-entitydb')
export class MetaplexOffChainMetadataEntity implements Entity {
  @hashKey()
  globalId: string;

  @attribute()
  id: string;

  @attribute()
  primaryEntity: mintAddress;

  @attribute()
  type: EntityType.MetaplexOffchainMetadata;

  @attribute()
  createdAt: Date;

  @attribute()
  updatedAt: Date;

  //TODO PIPELINE
  @attribute()
  pipelines: null;

  @attribute()
  data: OffChainMetadata;

  populate = (data: OffChainMetadata, mintAddress: mintAddress, lastVisit: Date) => {
    this.id = uuidv4();
    this.globalId = buildOffchainMetadataEntityGlobalId(this.id);
    this.type = EntityType.MetaplexOffchainMetadata;
    this.primaryEntity = mintAddress;
    this.createdAt = lastVisit; 
    this.updatedAt = lastVisit; 
    this.data = data;
  }
}