import { SQS } from 'aws-sdk';
import { SendMessageBatchRequest } from 'aws-sdk/clients/sqs';

const MESSAGES_PER_BATCH = 10;
//************************
//TODO
//Change SQSURL path
//************************
const SQSURL = 'URL';


export async function sendToQueue(sqs: SQS, addresses: string[]) {
    const promises = [];
    const numberOfBatches = Math.ceil(addresses.length / MESSAGES_PER_BATCH);
    for (let i = 0; i < numberOfBatches; i++) {
        promises.push(sendBatchToQueue(sqs, addresses.slice(i * MESSAGES_PER_BATCH, (i + 1) * MESSAGES_PER_BATCH)));
    }
    await Promise.all(promises);
}

export async function sendBatchToQueue(sqs: SQS, addresses: string[]) {
    const request: SendMessageBatchRequest = {
        QueueUrl: SQSURL,
        Entries: addresses.map((item) => {
            return { Id: item + '', MessageBody: item + '' };
        }),
    };
    // send to sqs
    await sqs.sendMessageBatch(request).promise();
}
