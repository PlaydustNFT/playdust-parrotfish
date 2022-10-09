import { decodeMetadata } from './metaplex-utils'
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from "stream/promises"
const JSONStream = require('JSONStream')

const inputFile = './metadata2.data';
const outputFile = './metadata2.out.json';

async function getNft() {
	try {
		await pipeline(
			createReadStream(inputFile, { encoding: 'utf8' }),
			JSONStream.parse(['result', true], (res: any) => {
				try {
					const deserialized = JSON.stringify(decodeMetadata(Buffer.from(res?.account?.data[0], 'base64'))) + '\n'
					return deserialized;
				} catch (e) {
					console.log(e);
					console.log(JSON.stringify(res));
				}
			}),
			createWriteStream(outputFile, { encoding: 'utf8' })
		)

		console.log('Done!');
	} catch (e) {
		console.log(e)
	}
}

getNft()
