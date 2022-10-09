import { Entity, TriggerSubtype } from "../../../shared/src/types";
import { TriggerEntity } from "../../../shared/src/entity/TriggerEntity";
import { ddbmapper } from "../../../shared/src/service/dynamodb";

export async function collectionAttributeProcessorTriggerWriter(entity: Entity) {
    const collectionId = entity.primaryEntity;
    let trigger = new TriggerEntity<string>();
    trigger.populate(entity.globalId, TriggerSubtype.CollectionAttributeProcessor, collectionId);
    await ddbmapper.update(trigger);
}
