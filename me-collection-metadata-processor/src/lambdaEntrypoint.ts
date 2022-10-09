import { S3Event } from 'aws-lambda';
import { PlaydustCollectionEntity } from '../../shared/src/entity/PlaydustCollectionEntity';
import AWS from 'aws-sdk';
import { CollectionMetaData, CollectionType, PlaydustCollectionData } from '../../shared/src/types';
import { MagicEdenCollectionRawData } from '../../shared/src/types';
import { CollectionMetaDataEntity } from '../../shared/src/entity/CollectionMetaDataEntity';
import { CollectionRawDataEntity } from '../../shared/src/entity/CollectionRawDataEntity';
import { ddbmapper } from '../../shared/src/service/dynamodb';

const s3 = new AWS.S3();

export const handler = async (event: S3Event) => {
    // Retrieve the bucket & key for the uploaded S3 object that
    // caused this Lambda function to be triggered
    const Bucket = event.Records[0].s3.bucket.name
    const Key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '))
    
    try {
        // Retrieve the data
        const response = await s3.getObject({ Bucket, Key }).promise();
        const rawData = JSON.parse(response.Body.toString('ascii')) as MagicEdenCollectionRawData;
        
        // construct collection objects
        // ----------------------------

        // instantiate PlaydustCollectionEntity
        let playdustCollectionEntity = new PlaydustCollectionEntity();
        const collectionData: PlaydustCollectionData = {
            type: CollectionType.MagicEden,
            id: rawData.symbol,
        }
        playdustCollectionEntity.populate(rawData.symbol, collectionData);
        
        // instantiate CollectionMetaDataEntity
        let metadataCollectionEntity = new CollectionMetaDataEntity();
        const metaData: CollectionMetaData = {
            name: rawData.name,
            symbol: rawData.symbol,
            elementCount: rawData.totalItems,
            description: rawData.description,
            image: rawData.image
        }
        metadataCollectionEntity.populate(
            rawData.symbol,
            playdustCollectionEntity.globalId,
            metaData
        );
        
        // instantiate CollectionRawDataEntity
        let collectionRawDataEntity = new CollectionRawDataEntity();
        collectionRawDataEntity.populate(
            rawData.symbol,
            playdustCollectionEntity.globalId,
            rawData
        );
        
        console.log(JSON.stringify(playdustCollectionEntity));
        console.log(JSON.stringify(metadataCollectionEntity));
        console.log(JSON.stringify(collectionRawDataEntity));
        
        // save playdust collection objects
        // -------------------------------
        let entityUpdate = [];
        entityUpdate.push(ddbmapper.put(playdustCollectionEntity));
        entityUpdate.push(ddbmapper.put(metadataCollectionEntity));
        entityUpdate.push(ddbmapper.put(collectionRawDataEntity));

        console.log('Putting entities into DDB');
        await Promise.all(entityUpdate).then((values) =>{
            console.log(values);
        }).catch(error => {
            console.log(error.message);
            throw('Error inserting the elements into the DB');
        });

    } catch (err) {
        console.log(err, err.stack);
        throw('Error processing the raw data.');
    }
}