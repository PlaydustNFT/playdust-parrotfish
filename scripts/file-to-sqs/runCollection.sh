INPUT_FILE_PATH=/home/ec2-user/files/collections/test/one_collection_id \
AWS_ACCESS_KEY_ID=ACC35K3Y \
AWS_SECRET_ACCESS_KEY=s3cr3tacc355k3y \
REGION=us-east-1 \
QUEUE_NAME=CollectionMetadata-to-OS \
    npx ts-node entrypoint.ts
