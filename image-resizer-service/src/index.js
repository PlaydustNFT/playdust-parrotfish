const url = require('url');
const {original, resize} = require("./image");
const { hashFunction } = require("./util");

exports.handler = (event) => new Promise((resolve, reject) => {
    const imageBucket = process.env.IMAGE_BUCKET;

    console.log("image bucket:" + imageBucket)
    if (!imageBucket) {
        return reject(`Error: Set environment variable IMAGE_BUCKET`);
    }

    console.log(event.queryStringParameters)

    const queryParameters = event.queryStringParameters || {};

    const url = queryParameters.url;
    console.log("URL IS: "+ url)
    const objectKey = hashFunction(url).toString()
    if (!queryParameters.d) {
        console.log('into original')
        return original(imageBucket, objectKey, url)
            .then(resolve)
            .catch(reject);
    }

    const dimensions = queryParameters.d

    return resize(imageBucket, objectKey, url, dimensions)
        .then(resolve)
        .catch(reject);
});
