MAX_PROMISES=10000 \
INPUT_FILE_PATH=/home/ec2-user/files/magic_eden_mint_and_collection_ids \
GLOBAL_IDS_INPUT_FILE_PATH=/home/ec2-user/files/edge_create_input/clean_off_chain_metadata_global_ids_uniq \
OUTPUT_FILE_PATH=/home/ec2-user/files/failed_edge_updates \
ACCESS_KEY=ACC35K3Y \
SECRET_ACCESS_KEY=s3cr3tacc355k3y \
REGION=us-east-1 \
	npx ts-node entrypoint2.ts
