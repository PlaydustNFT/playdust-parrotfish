import fs from 'fs';
import readline from 'readline';
import { getMetadataAccount } from './metadata';
import { MetaplexOnChainMetadataEntity } from '../../../../shared/src/entity/MetaplexOnChainMetadataEntity';
import { ddbmapper } from '../../../../shared/src/service/dynamodb'
import { backOff } from 'exponential-backoff';

async function entrypoint() {
    const fileStream = fs.createReadStream('../diff-metadata.decoded');

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let i = 0;
    for await (const line of rl) {
        const metadata = JSON.parse(line);
        const metadataAddress = await getMetadataAccount(metadata.mint);
        const onchainMetadataEntity: MetaplexOnChainMetadataEntity = new MetaplexOnChainMetadataEntity();
        onchainMetadataEntity.populate(metadata, metadataAddress, metadata.mint);
        try {
            await backOff(() => ddbmapper.put(onchainMetadataEntity));
            console.log(`saved ${i}-th item.`);
        } catch (e) {
            console.error(`Could not save item: ${metadata.mint}`);
        }
        i++;
    }
}

entrypoint();
