import { SQS } from 'aws-sdk';
import { SendMessageBatchRequest } from 'aws-sdk/clients/sqs';

const MESSAGES_PER_BATCH = 10;

export async function  sendToQueue<T>(sqs: SQS, queueUrl: string, objects: T[]) {
    const promises = [];
    const numberOfBatches = Math.ceil(objects.length / MESSAGES_PER_BATCH);
    for (let i = 0; i < numberOfBatches; i++) {
        promises.push(sendBatchToQueue(sqs, queueUrl, objects.slice(i * MESSAGES_PER_BATCH, (i + 1) * MESSAGES_PER_BATCH)));
    }
    await Promise.all(promises);
}

export async function sendBatchToQueue<T>(sqs: SQS, queueUrl: string, objects: T[]) {
    const request: SendMessageBatchRequest = {
        QueueUrl: queueUrl,
        Entries: objects.map((slot) => {
            return { Id: slot + '', MessageBody: slot + '' };
        }),
    };
    // send to sqs
    await sqs.sendMessageBatch(request).promise();
}
