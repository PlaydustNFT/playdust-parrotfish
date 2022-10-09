# Overview
The collection-attribute-processor is designed to aggregate the attributes of all NFTs in a collection, store their statistical rarity & generate a ranking for each NFT in the collection


## Input
OffchainMetadata4Collection objects

## Output
* CollectionAttributeData object which includes the following calculations:

### Calculations
- Attribute aggregation
    * List of all attributes, with each attribute value including 
        * a count for how many NFTs have that attribute/value
        * a statistical rarity (% of total collection which have this attribute/value)
- NFTCollectionRanking
    * The ranking of an NFT for a given collection based on statistical rarity calculation

## Trigger
* TriggerEntity.triggerSubtype == collectionAttributeProcessor

Please refer to the README at the repository root for techinical details about code layout, building, testing, etc. 