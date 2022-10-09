# Overview
The collection-price-processor is designed to calculate the current floor/ceiling price & volumes executed for a given collection on a per-marketplace basis.


## Input
* MarketData4CollectionEntity

## Output
* CollectionPriceData object which includes the following calculations:

### Calculations
- Floor/Ceiling Price
    * Calculated globally and per-marketplace
- Traded Volume
    * Contains volume for 1d, 7d, 30d & total periods
    * Calculated globally and per-marketplace

## Trigger
* TriggerEntity.triggerSubtype == collectionPriceProcessor

Please refer to the README at the repository root for techinical details about code layout, building, testing, etc. 