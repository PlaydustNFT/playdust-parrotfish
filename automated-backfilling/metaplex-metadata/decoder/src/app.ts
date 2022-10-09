import { decodeMetadata } from './metaplex-utils'
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from "stream/promises"
const JSONStream = require('JSONStream')

const inputFile = '../new-metadata.encoded';
const outputFile = '../new-metadata.decoded';


/**
 * Reads RPC response from a file and decodes the encoded Metaplex metadata part.
 * Writes the output to a file.
 *
 * FIXME: This function is currently a bottlenecs and needs performance optimizations!
 */
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
	} catch (e) {
		console.log(e)
	}
}

getNft()
