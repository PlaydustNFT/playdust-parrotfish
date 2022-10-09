import { sendToQueue } from '../../shared/src/util/aws';
import * as AWS from 'aws-sdk';
import { createInterface } from "readline";
import { createReadStream } from 'fs';

const QUEUE_NAME = 
      process.env.QUEUE_NAME as string // the desired program address to fetch signatures for
      || "NFTMetadata-to-OS";

const INPUT_FILE_PATH =
      process.env.INPUT_FILE_PATH // the desired program address to fetch signatures for
      || "/home/ec2-user/files/mint_addresses";

const sqs = new AWS.SQS({apiVersion: '2012-11-05', region: 'us-east-1'});

(async () => 
{
  console.log(`Reading file`);
  // read in a file, store it in a list
  const listOfItems: string[] = [];
  const rl = createInterface({
    input: createReadStream(INPUT_FILE_PATH),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
      listOfItems.push(line);
  }

  console.log(`Read [${JSON.stringify(listOfItems.length)}] items from ${INPUT_FILE_PATH}`);
  /** Fetch queue url for relevant sqs queue */
  console.log(`getQueueUrl for QueueName: ${QUEUE_NAME}`);
  let queueUrl = '';
  await sqs.getQueueUrl({ QueueName: QUEUE_NAME }, async function(err, data) {
      if (err) {
          console.error(err, err.stack);
      }
      else {
          queueUrl = data.QueueUrl as string;
          console.log(`Sending items to queue ${queueUrl}...`);
          await sendToQueue(sqs, queueUrl, listOfItems);
      }
  });
})();
