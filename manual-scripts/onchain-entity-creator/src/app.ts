import fs from 'fs';
import readline from 'readline';
import { getMetadataAccount } from './metadata';
import { MetaplexOnChainMetadataEntity } from '../../shared/src/entity/MetaplexOnChainMetadataEntity';
import { ddbmapper } from '../../shared/src/service/dynamodb';
import { backOff } from 'exponential-backoff';

async function entrypoint() {
    console.log('starting...');
    const fileStream = fs.createReadStream('../../metadata2.out.json');

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
            console.log('saving ' + i + '-th:');
            console.log(metadata.mint);
            await backOff(() => ddbmapper.put(onchainMetadataEntity));
            console.log('saved!');
        } catch (e) {
            console.error('could not save item:');
            console.error(metadata.mint);
        }
        i++;
    }
}

entrypoint();
