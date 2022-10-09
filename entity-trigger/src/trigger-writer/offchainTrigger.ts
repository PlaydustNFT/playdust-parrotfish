import { Entity, TriggerSubtype, Metadata } from "../../../shared/src/types";
import { TriggerEntity } from "../../../shared/src/entity/TriggerEntity";
import { ddbmapper } from "../../../shared/src/service/dynamodb";

/**
 * Trigger writer that writes onchain Metadata in the trigger data field.
 */
export async function offchainTriggerWriter(entity: Entity) {
    let trigger = new TriggerEntity<Metadata>();    
    trigger.populate(entity.globalId, TriggerSubtype.OffChainMetadata, entity.data);
    await ddbmapper.update(trigger);
}
