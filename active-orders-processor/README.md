The active-orders-processor is designed to read MarketplaceTransactionEntity objects which include a given instruction type. According to the instruction type, the buyer/seller wallet address, the marketplace & the token address, this code determines which orders are active for that token/wallet/marketplace/side.

This code defines it's own Entity which it reads from/writes to the Entity database, the OrderEntity. This object includes a boolean flag (active) which represents the state of the order. 

The trigger:
- pipelines.ActiveOrdersProcessor: true

Please refer to the README at the repository root for techinical details about code layout, building, testing, etc. 