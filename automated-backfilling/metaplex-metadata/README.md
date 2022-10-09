# Automatic Metaplex Onchain Data Ingestor
## Prerequisites
Have `npm`, `yarn` and `webpack` installed on your machine.
# build the entities script
## Basic Usage
Run the following commands:
```
chmod +x start.sh
./start.sh
```
## Explanation
The script works by first downloading all of the onchain metadata instances from a solana RPC node.
It does so by requesting all of the solana sccounts owned by the _Metaplex Token Metadata Program_ (`metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s`) whose `data` field has length `679`.

These accounts contain the onchain metadata in the `data` field, but this data first needs to be decoded,
which is done by invoking the `nodejs` script contained in the `decoder` directory.
The script works by opening two streams: one to the file downloaded by the RPC call and the second one to a new file which will contain decoded data.
The script holds only one metadata instance in memory at a time so it's pretty RAM efficient.

After the `data` is decoded for each obtained account, if the script is run for the first time,  it just saves all the relevant entities to the database. For each next invoke of the script, before saving all the data to the DB a diffing step is done to determine only the new metadata accounts. Once this is determined, only the new ones are saved to the DB.