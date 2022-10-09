import { defaultTriggerWriter } from "./trigger-writer/default";
import { Entity, EntityType } from "../../shared/src/types";
import { offchainTriggerWriter } from "./trigger-writer/offchainTrigger";
import { metadataAggregationTriggerWriter } from "./trigger-writer/metadataAggregationTrigger";
import { collectionAttributeProcessorTriggerWriter } from "./trigger-writer/collection-attribute-processor";
import { collectionMetadataProcessorTriggerWriter } from './trigger-writer/collectionMetadataProcessorTrigger'; 

/** Adding this comment to trigger Github Actions */
/** Adding this 2 comment to trigger Github Actions */

export async function handleEntityWrite(entity: Entity) {
    console.log(`handleEntityWrite: EntityType = ${entity.type}`);
    switch (entity.type) {
        case EntityType.MetaplexOnChainMetadata: {
            console.log(`handleEntityWrite: MetaplexOnChainMetadata: ${entity.type}`);
            await offchainTriggerWriter(entity);
            break;
        }
        case EntityType.MetaplexOffchainMetadata: {
            console.log(`handleEntityWrite: MetaplexOffChainMetadata: ${entity.type}`);
            await metadataAggregationTriggerWriter(entity);
            break;
        }
        case EntityType.PlaydustCollection:
            await collectionMetadataProcessorTriggerWriter(entity);
            break;
        case EntityType.OffchainMetadata4Collection: {
            console.log(`handleEntityWrite: OffchainMetadata4Collection: ${entity.type}`);
            await collectionAttributeProcessorTriggerWriter(entity);
            break;
        }
        default: {
            console.log(`handleEntityWrite: defaultTriggerWriter: ${entity.type}`);
            await defaultTriggerWriter(entity);
            break;
        }
    }
}