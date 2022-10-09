#!/bin/bash

# file names:
# - outstanding_signatures.txt
# - on_chain_failures_list.log
# - current_signatures_list.log

echo Reconciling signatures to generate a new outstanding signatures list...

mkdir -p files
cd files

echo Current Working Directory: $(pwd)

cat current_signatures_list.log | sort | uniq > current_signatures_list.log.uniq
cat on_chain_failures_list.log | sort | uniq > on_chain_failures_list.log.uniq
cat outstanding_signatures.txt | sort | uniq > outstanding_signatures.txt.uniq
comm -23 outstanding_signatures.txt.uniq on_chain_failures_list.log.uniq > expected_signatures_list.txt
comm -23 expected_signatures_list.txt current_signatures_list.log.uniq > outstanding_signatures.txt

echo Remaining signatures: $(wc -l outstanding_signatures.txt | awk '{print $1}')

echo Cleaning up old files
rm current_signatures_list.log* on_chain_failures_list.log* expected_signatures_list.txt
