The me-transaction-processor is designed to read raw transactions scraped from the blockchain
and convert those into the playdust normalized format. This code will also generate 2 types of related entities:
- MarketplaceTransactionEntityForNFT
- MarketplaceTransactionEntityForWallet 

Using these related entities we can perform complex search queries over our dataset, perform joins in a document database, and maintain relationships of various entities however we need.


The trigger:
- pipelines.MagicEdenV2TransactionProcessor: true

Please refer to the README at the repository root for techinical details about code layout, building, testing, etc. 