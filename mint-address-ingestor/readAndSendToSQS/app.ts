/*
    This app open a folder, read the data inside, filter just metadata addresses
    and send them to the SQS 
*/
import * as readline from 'readline';
import * as fs from 'fs';
import AWS from 'aws-sdk';
import { sendToQueue } from './AwsUtils';

//************************
//TODO
//Change FOLDER path
//************************
const FOLDER = './files/';

const sqs = new AWS.SQS({apiVersion: '2012-11-05',
                         region: 'us-east-1'});

const run = async () => {
    //READ MULTIPLE FILES
    const folder = fs.readdirSync(FOLDER);
    for(let file in folder){
        let addresses = []; //array containing the singatures

        const allFileContents = fs.readFileSync(FOLDER + folder[file].toString(), 'utf-8');
        console.log('Processing file: ' + folder[file].toString());
        allFileContents.split(/\r?\n/).forEach(line =>  {
            //console.log(`Line from file: ${line}`);
            addresses.push(line);
        });
        
        //SEND ADDRESSES TO SQS
        await sendToQueue(sqs, addresses);
    }
}

console.log('starting the ingestion to SQS');
run();
console.log('Completed!');