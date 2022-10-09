const AWS = require("aws-sdk");
const s3 = new AWS.S3();

exports.getFileFromBucket = (bucket, key) => s3.getObject({
    Bucket: bucket,
    Key: key
}).promise();

exports.saveFileToBucket = (bucket, key, buffer) => s3.putObject({
    Bucket: bucket,
    Key: key,
    Body: buffer,
  }).promise();