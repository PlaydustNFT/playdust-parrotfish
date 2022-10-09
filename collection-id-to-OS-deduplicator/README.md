The   collection-id-deduplicator is a lightweight service which sits between the Offchain metadata processor & the collection-metadata-attribute-processor.

It's main purpose is to deduplicate any collection ids which it reads from it's inbound SQS queue.

The trigger:
- 5 mins scheduled event

Please refer to the README at the repository root for techinical details about code layout, building, testing, etc. 