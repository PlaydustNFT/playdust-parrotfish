import { processItem as processPriceItem } from './priceProcessorEntrypoint'
import { processItem as processAttributeMetadataItem } from './attributeMetadataProcessorEntrypoint';
export enum Mode {
    Attribute = 1,
    Price = 2,
};
export const processCollectionId = async (collectionId: string, mode: Mode) => {
    const promises = [];
    if (mode & Mode.Attribute) {
        promises.push(processAttributeMetadataItem(collectionId));
    }
    if (mode & Mode.Price) {
        promises.push(processPriceItem(collectionId));
    }
    await Promise.all(promises);
}
