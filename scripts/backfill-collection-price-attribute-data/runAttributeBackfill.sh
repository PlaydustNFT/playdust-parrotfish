MODE=1 \
INPUT_FILE_PATH=/home/ec2-user/files/collection_ids_test-degods \
DELAY=3500 \
MAX_COLLECTION_SIZE=10000 \
MAX_PROMISES=10000 \
LARGE_COLLECTIONS_FILE=/home/ec2-user/files/large_collections \
ACCESS_KEY=ACC35K3Y \
SECRET_ACCESS_KEY=5ecR3tAcc355K3y \
REGION=us-east-1 \
	npx ts-node entrypoint.ts
