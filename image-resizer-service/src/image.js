const s3 = require("./s3");
const {successResponse, errorResponse} = require("../src/response");
const axios = require('axios').default;
const sharp = require('sharp');
const aws = require("aws-sdk");
const lambda = new aws.Lambda({
    apiVersion: "2015-03-31",
    endpoint: `lambda.us-east-1.amazonaws.com`
  });
const secondLambda = process.env.SECOND_LAMBDA;

const getFile = (imageBucket, objectKey, url, reject) => s3.getFileFromBucket(imageBucket, objectKey).catch(err => {
    if(err.code==='NoSuchKey') {
        console.log(objectKey)

    return axios.get(url, {responseType: 'arraybuffer'})

    }
    reject(errorResponse(err.code, 404, err))

})

exports.original = (imageBucket, objectKey, url) => new Promise((resolve, reject) =>

    getFile(imageBucket, objectKey, url, reject).then(data => {

        console.log("URL: "+url)
        if(data.Body) {
        data.data = data.Body
        resolve(successResponse(data.data.toString('base64'), 'image/jpeg'))
        } else {
            const payload = {
                    url: url,     
            }
            console.log("secondLambda "+secondLambda)
            const payloadToSend = JSON.stringify(payload)
            lambda.invoke({
              FunctionName: secondLambda,
              InvocationType: "Event",
              Payload: payloadToSend
            })
            .promise().then((res)=>{resolve(successResponse(data.data.toString('base64'), 'image/jpeg'))});}
    }));

exports.resize = (imageBucket, objectKey, url, dimensions) => new Promise((resolve, reject) =>


    getFile(imageBucket, objectKey, url, reject).then(data => {

        if(data.Body) {
            data.data = data.Body
        }
        const formatDimensions = dimensions.split('x')
        const width = Number(formatDimensions[0])
        const height = Number(formatDimensions[1])
        console.log("width: " + width)
        console.log("height: " + height)

        sharp(data.data).resize(width, height).toBuffer()
            .then((resizedImage)=>{
                const payload = {
                    url: url,     
            }
            console.log("secondLambda "+secondLambda)
            const payloadToSend = JSON.stringify(payload)
            lambda.invoke({
              FunctionName: secondLambda,
              InvocationType: "Event",
              Payload: payloadToSend
            })
            .promise().then((res)=>{resolve(successResponse(resizedImage.toString('base64'), 'image/jpeg'))});})
            .catch((err)=>{
                console.log(err)
                reject(errorResponse(err.code, 500, err))
            })
    
    }));