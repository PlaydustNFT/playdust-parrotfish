import boto3
import json
from boto3.dynamodb.conditions import Key

f = open('dataForDynamo.json')
data = json.load(f)
def main():
    # 1 - Create Client
    ddb = boto3.resource('dynamodb',
                         endpoint_url='http://localhost:8000',
                         region_name='local',
                         aws_access_key_id='awsaccesskey',
                         aws_secret_access_key='awssecretaccesskey')
    # 2 - Create the Table

    #When first time runnning script uncomment this part for creating table,
    #and after it, comment it. And just run script for every new insertion.

    #Table is created with two indicies. One with PrimaryEntity and the other one with Type


    # ddb.create_table(TableName='playdust-parrotfish-entitydb',
    #                  AttributeDefinitions=[
    #                      {
    #                          'AttributeName': 'globalId',
    #                          'AttributeType': 'S'
    #                      },
    #                      {
    #                          'AttributeName': 'type',
    #                          'AttributeType': 'S'
    #                      },
    #                      {
    #                          'AttributeName': 'primaryEntity',
    #                          'AttributeType': 'S'
    #                      }
    #                  ],
    #                  KeySchema=[
    #                      {
    #                          'AttributeName': 'globalId',
    #                          'KeyType': 'HASH'
    #                      }
    #                  ],
    # GlobalSecondaryIndexes=[
    #     {
    #         'IndexName': 'typeIndex',
    #         'KeySchema': [
    #             {
    #                 'AttributeName': 'type',
    #                 'KeyType': 'HASH'
    #             },
    #         ],
    #         'Projection': {
    #             'ProjectionType': 'ALL'
       
    #         },
    #         'ProvisionedThroughput': {
    #             'ReadCapacityUnits': 123,
    #             'WriteCapacityUnits': 123
    #         }
    #     },
    # {
    #         'IndexName': 'PrimaryEntityIndex',
    #         'KeySchema': [
    #             {
    #                 'AttributeName': 'primaryEntity',
    #                 'KeyType': 'HASH'
    #             },
    #         ],
    #         'Projection': {
    #             'ProjectionType': 'ALL'
       
    #         },
    #         'ProvisionedThroughput': {
    #             'ReadCapacityUnits': 123,
    #             'WriteCapacityUnits': 123
    #         }
    #     },
    # ],
    #                  ProvisionedThroughput= {
    #                      'ReadCapacityUnits': 10,
    #                      'WriteCapacityUnits': 10
    #                  }
    #                  )
    # print('Successfully created Table')

   

    table = ddb.Table('playdust-parrotfish-entitydb')

    input = data

    # #3 - Insert Data

    table.put_item(Item=input)
    print('Successfully put item')

    #4 - Scan Table
    scanResponse2 = table.scan(TableName='playdust-parrotfish-entitydb')

    items = scanResponse2['Items']
    print(table.name)
    for item in items:
        print(item)



main()