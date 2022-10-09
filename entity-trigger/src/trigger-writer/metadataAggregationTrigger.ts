import { Entity, TriggerSubtype } from "../../../shared/src/types";
import { TriggerEntity } from "../../../shared/src/entity/TriggerEntity";
import { ddbmapper } from "../../../shared/src/service/dynamodb";

/**
 * Example of a trigger writer that writes the whole entity in the trigger data field.
 * When writing real triggers, only the data that is needed for trigger processing
 * should be written to the data field.
 * @param entity for which trigger should be created.
 */
export async function metadataAggregationTriggerWriter(entity: Entity) {
    let trigger = new TriggerEntity<string>();    
    trigger.populate(entity.globalId, TriggerSubtype.MetadataAggregation, entity.primaryEntity);
    await ddbmapper.update(trigger);
}
