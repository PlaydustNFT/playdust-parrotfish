import { Entity, TriggerSubtype } from "../../../shared/src/types";
import { TriggerEntity } from "../../../shared/src/entity/TriggerEntity";
import { ddbmapper } from "../../../shared/src/service/dynamodb";

/**
 * Example of a trigger writer that writes the whole entity in the trigger data field.
 * When writing real triggers, only the data that is needed for trigger processing
 * should be written to the data field.
 * @param entity for which trigger should be created.
 */
export async function defaultTriggerWriter(entity: Entity) {
    let trigger = new TriggerEntity<Entity>();    
    trigger.populate(entity.globalId, TriggerSubtype.Default, entity);
    await ddbmapper.update(trigger);
}
