#!/bin/bash

echo 'Starting the backfilling process'

export "CONFIG_PATH=$1"
export "ENTITY_TABLE_NAME=$2"

cd metaplex-metadata
./start.sh
cd ..

cd magic-eden-metadata
./start.sh
cd ..