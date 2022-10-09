# playdust-api

Marketplace private api including auction house trading module as well as wallet based authentication mechanism.

## Installation
```bash
npm install
```

## E2E test for local api server
```bash
# run api server first
npm run dev

# run test in other terminal
npm test
```

## OpenApi UI

http://localhost:3000/api-docs

## dynamodb-local

```bash
docker pull amazon/dynamodb-local
docker run -p 8000:8000 amazon/dynamodb-local
```

Files for DynamoDB are queryDynamoDB.py and dataForDynamo.json
queryDynamoDB.py consists of creating DynamoDB tables and inserting data.
dataForDynamo.json is imported in queryDynamoDB and for every new inserting, just change data and run again queryDynamoDB.py again. 

To run queryDynamoDB.py if using python3 run 
```bash
python3 queryDynamoDB.py
```
# RUN API LOCALLY

Environment variables are set in runApi.sh.

To run API locally run script 
```bash
./runApi.sh
```




