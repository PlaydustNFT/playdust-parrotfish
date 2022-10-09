#!/bin/bash

# If an error occurs, terminate the script so that the data doesn't get corrupted
set -x

#echo $ENTITY_TABLE_NAME

printf '\n'
echo 'Starting metaplex metadata backfilling...'

# make sure the initial data exists

touch -a ./old-metadata.decoded.sorted

# cp the necessary file until a proper monorepo mechanism for referencing is implemented

cp ../../shared/src/types.ts decoder/src/

# download the new dataset

printf '\n'
echo "Downloading the new dataset..."
printf '\n'

start_time=$(date +%s)

curl https://api.mainnet-beta.solana.com
    -X POST \
    -H "Content-Type: application/json" \
    -d '
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getProgramAccounts",
            "params": [
                "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
                {
                    "filters": [
                        {
                            "dataSize": 679
                        }
                    ],
                    "encoding": "jsonParsed"
              }
            ]
        }
        ' > new-metadata.encoded

end_time=$(date +%s)

printf '\n'
echo "New dataset downloaded!"
echo "-- Elapsed time: $(( end_time - start_time )) seconds --"
printf '\n'

# decode the newly downloaded files

echo 'Decoding the downloaded metadata...'
printf '\n'
start_time=$(date +%s)

cd decoder
npm install typescript
npx tsc
node ./dist/app.js
cd ..

end_time=$(date +%s)
echo 'Metadata decoded!'
echo "-- Elapsed time: $(( end_time - start_time )) seconds --"

# diff the datasets
printf '\n'
echo 'Looking for new items'
start_time=$(date +%s)

# diff the datasets

printf '\n'
echo 'Looking for new items'
start_time=$(date +%s)

sort new-metadata.decoded > new-metadata.decoded.sorted
comm -13 old-metadata.decoded.sorted new-metadata.decoded.sorted > diff-metadata.decoded
mv new-metadata.decoded.sorted old-metadata.decoded.sorted

end_time=$(date +%s)
printf '\n'
echo 'New items extracted!'
echo "-- Elapsed time: $(( end_time - start_time )) seconds --"

cd onchain-entity-creator

# build the entities script
yarn build
# run the script
node build/entrypoint.js

cd ..
