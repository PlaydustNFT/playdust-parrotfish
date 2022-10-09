const sharp = require('sharp');
import { saveFileToBucket } from "./../s3";
const axios = require('axios').default;
const { hashFunction } = require("./../util");
export async function handler(event) {
    const imageBucket = process.env.IMAGE_BUCKET;
    console.log('URL of image to save'+ event.url)
    const imageUrl = event.url
    const newKey = hashFunction(imageUrl).toString()
    console.log('Image hash to be saved: '+ newKey)
    let image
    try{
        image = await axios.get(imageUrl, {responseType: 'arraybuffer'})
        console.log("Successfully fetched image")
    } catch(err){
        console.log("Error fetching image. Error: "+image)
    }
    try{
        image = await sharp(image.data).jpeg({ quality: 60, progressive: true }).toBuffer()
        await saveFileToBucket(imageBucket, newKey, image)
        console.log("Successfully saved image to S3")
    } catch(err){
        console.log('Image '+imageUrl+" "+newKey+" is not saved to S3. Error: "+ err)
    }
}
