import { DataMapper } from "@aws/dynamodb-data-mapper";
import { config, DynamoDB } from "aws-sdk";

const dynamoDBOptions: DynamoDB.ClientConfiguration = {
};

if (process.env.CONFIG_PATH) {
  config.loadFromPath(process.env.CONFIG_PATH);
}
if (process.env.ACCESS_KEY) {
  dynamoDBOptions.accessKeyId = process.env.ACCESS_KEY;
}
if (process.env.SECRET_ACCESS_KEY) {
  dynamoDBOptions.secretAccessKey = process.env.SECRET_ACCESS_KEY;
}
if (process.env.REGION) {
  dynamoDBOptions.region = process.env.REGION;
}
if (process.env.DYNAMODB_ENDPOINT) {
  dynamoDBOptions.endpoint = process.env.DYNAMODB_ENDPOINT;
}

class WrappedDataMapper extends DataMapper {
  hasTable = async (tableName: string) : Promise<boolean> => {
    const response = await ddbclient.listTables().promise();
    if (!response.TableNames.includes(tableName)) {
        return false;
    }
    return true;
  };
}

export const ddbclient = new DynamoDB(dynamoDBOptions);
export const ddbmapper = new WrappedDataMapper({ client: ddbclient });