import { deserializeUnchecked, serialize, BinaryReader, BinaryWriter } from 'borsh';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js'
import base58 from 'bs58'
import { Metadata, Data, Creator, Collection, Uses, MetadataKey} from './types'


export type StringPublicKey = string;

export const extendBorsh = () => {
	(BinaryReader.prototype as any).readPubkey = function () {
		const reader = this as unknown as BinaryReader;
		const array = reader.readFixedArray(32);
		return new PublicKey(array);
	};

	(BinaryWriter.prototype as any).writePubkey = function (value: PublicKey) {
		const writer = this as unknown as BinaryWriter;
		writer.writeFixedArray(value.toBuffer());
	};

	(BinaryReader.prototype as any).readPubkeyAsString = function () {
		const reader = this as unknown as BinaryReader;
		const array = reader.readFixedArray(32);
		return base58.encode(array) as StringPublicKey;
	};

	(BinaryWriter.prototype as any).writePubkeyAsString = function (
		value: StringPublicKey,
	) {
		const writer = this as unknown as BinaryWriter;
		writer.writeFixedArray(base58.decode(value));
	};
};

extendBorsh();


export enum MetadataCategory {
	Audio = 'audio',
	Video = 'video',
	Image = 'image',
	VR = 'vr',
}

export type MetadataFile = {
	uri: string;
	type: string;
};

export type FileOrString = MetadataFile | String;

export type Attribute = {
	trait_type?: string;
	display_type?: string;
	value: string | number;
};

export class DataV2 {
	name: string;
	symbol: string;
	uri: string;
	sellerFeeBasisPoints: number;
	creators: Creator[] | null;
	collection: Collection | null;
	uses: Uses | null;
	constructor(args: {
		name: string;
		symbol: string;
		uri: string;
		sellerFeeBasisPoints: number;
		creators: Creator[] | null;
		collection: Collection | null;
    	uses: Uses | null;
	}) {
		this.name = args.name;
		this.symbol = args.symbol;
		this.uri = args.uri;
		this.sellerFeeBasisPoints = args.sellerFeeBasisPoints;
		this.creators = args.creators;
		this.collection = args.collection;
		this.uses = args.uses;
	}
}




export class CreateMetadataArgs {
	instruction: number;
	data: Data;
	isMutable: boolean;

	constructor(args: {instruction: number, data: Data; isMutable: boolean }) {
		this.instruction = args.instruction;
		this.data = args.data;
		this.isMutable = args.isMutable;
	}
}
export class CreateMetadataArgsV2 {
	instruction: number;
	data: DataV2;
	isMutable: boolean;

	constructor(args: {instruction: number, data: DataV2; isMutable: boolean }) {
		this.instruction = args.instruction;
		this.data = args.data;
		this.isMutable = args.isMutable;
	}
}

export class UpdateMetadataArgs {
	instruction: number;
	data: Data | null;
	// Not used by this app, just required for instruction
	updateAuthority: StringPublicKey | null;
	primarySaleHappened: boolean | null;
	constructor(args: {
		instruction: number;
		data?: Data;
		updateAuthority?: string;
		primarySaleHappened: boolean | null;
	}) {
		this.instruction = args.instruction;
		this.data = args.data ? args.data : null;
		this.updateAuthority = args.updateAuthority ? args.updateAuthority : null;
		this.primarySaleHappened = args.primarySaleHappened;
	}
}
export class UpdateMetadataArgsV2 {
	instruction: number;
	data: DataV2 | null;
	// Not used by this app, just required for instruction
	updateAuthority: StringPublicKey | null;
	primarySaleHappened: boolean | null;
	isMutable: boolean | null;
	constructor(args: {
		instruction: number;
		data?: DataV2;
		updateAuthority?: string;
		primarySaleHappened: boolean | null;
		isMutable: boolean;
	}) {
		this.instruction = args.instruction;
		this.data = args.data ? args.data : null;
		this.updateAuthority = args.updateAuthority ? args.updateAuthority : null;
		this.primarySaleHappened = args.primarySaleHappened;
		this.isMutable = args.isMutable;
	}
}

export const METADATA_SCHEMA = new Map<any, any>([
	[
		CreateMetadataArgs,
		{
			kind: 'struct',
			fields: [
				['instruction', 'u8'],
				['data', Data],
				['isMutable', 'u8'], // bool
			],
		},
	],
	[
		CreateMetadataArgsV2,
		{
			kind: 'struct',
			fields: [
				['instruction', 'u8'],
				['data', DataV2],
				['isMutable', 'u8'], // bool
			],
		},
	],
	[
		UpdateMetadataArgs,
		{
			kind: 'struct',
			fields: [
				['instruction', 'u8'],
				['data', { kind: 'option', type: Data }],
				['updateAuthority', { kind: 'option', type: 'pubkeyAsString' }],
				['primarySaleHappened', { kind: 'option', type: 'u8' }],
			],
		},
	],
	[
		UpdateMetadataArgsV2,
		{
			kind: 'struct',
			fields: [
				['instruction', 'u8'],
				['data', { kind: 'option', type: DataV2 }],
				['updateAuthority', { kind: 'option', type: 'pubkeyAsString' }],
				['primarySaleHappened', { kind: 'option', type: 'u8' }],
				['isMutable', { kind: 'option', type: 'u8' }],
			],
		},
	],
	[
		Data,
		{
			kind: 'struct',
			fields: [
				['name', 'string'],
				['symbol', 'string'],
				['uri', 'string'],
				['sellerFeeBasisPoints', 'u16'],
				['creators', { kind: 'option', type: [Creator] }],
			],
		},
	],
	[
		DataV2,
		{
			kind: 'struct',
			fields: [
				['name', 'string'],
				['symbol', 'string'],
				['uri', 'string'],
				['sellerFeeBasisPoints', 'u16'],
				['creators', { kind: 'option', type: [Creator] }],
				['collection', {kind: 'option', type: Collection} ],
				['uses', {kind: 'option', type: Uses}],
			],
		},
	],
	[
		Creator,
		{
			kind: 'struct',
			fields: [
				['address', 'pubkeyAsString'],
				['verified', 'u8'],
				['share', 'u8'],
			],
		},
	],
	[
		Collection,
		{
			kind: 'struct',
			fields: [
				['verified', 'u8'],
				['key', 'pubkeyAsString'],
			],
		},
	],
	[
		Uses,
		{
			kind: 'struct',
			fields: [
				['use_method', 'u8'],
				['remaining', 'u64'],
				['total', 'u64'],
			],
		},
	],
	[
		Metadata,
		{
			kind: 'struct',
			fields: [
				['key', 'u8'],
				['updateAuthority', 'pubkeyAsString'],
				['mint', 'pubkeyAsString'],
				['data', Data],
				['primarySaleHappened', 'u8'], // bool
				['isMutable', 'u8'], // bool
				['editionNonce', { kind: 'option', type: 'u8' }], 
				['token_standard', {kind: 'option', type: 'u8'}],
				['collection', {kind: 'option', type: Collection} ],
				['uses', {kind: 'option', type: Uses}],
				
			],
		},
	],
]);

// eslint-disable-next-line no-control-regex
const METADATA_REPLACE = new RegExp('\u0000', 'g');

export const decodeMetadata = (buffer: Buffer): Metadata => {
	const metadata = deserializeUnchecked(
		METADATA_SCHEMA,
		Metadata,
		buffer,
	) as Metadata;
	metadata.data.name = metadata.data.name.replace(METADATA_REPLACE, '');
	metadata.data.uri = metadata.data.uri.replace(METADATA_REPLACE, '');
	metadata.data.symbol = metadata.data.symbol.replace(METADATA_REPLACE, '');
	return metadata;
};

export const decodeCreateMetadata = (buffer: Buffer): CreateMetadataArgs => {
	const metadata = deserializeUnchecked(
		METADATA_SCHEMA,
		CreateMetadataArgs,
		buffer,
	) as CreateMetadataArgs;
	metadata.data.name = metadata.data.name.replace(METADATA_REPLACE, '');
	metadata.data.uri = metadata.data.uri.replace(METADATA_REPLACE, '');
	metadata.data.symbol = metadata.data.symbol.replace(METADATA_REPLACE, '');
	return metadata;
};

export const decodeCreateMetadataV2 = (buffer: Buffer): CreateMetadataArgsV2 => {
	const metadata = deserializeUnchecked(
		METADATA_SCHEMA,
		CreateMetadataArgsV2,
		buffer,
	) as CreateMetadataArgsV2;
	metadata.data.name = metadata.data.name.replace(METADATA_REPLACE, '');
	metadata.data.uri = metadata.data.uri.replace(METADATA_REPLACE, '');
	metadata.data.symbol = metadata.data.symbol.replace(METADATA_REPLACE, '');
	return metadata;
};

export const decodeUpdateMetadata = (buffer: Buffer): UpdateMetadataArgs => {
	const metadata = deserializeUnchecked(
		METADATA_SCHEMA,
		UpdateMetadataArgs,
		buffer,
	) as UpdateMetadataArgs;
	if(metadata?.data?.name){
		metadata.data.name = metadata?.data?.name?.replace(METADATA_REPLACE, '');
	}
	if(metadata?.data?.uri){
		metadata.data.uri = metadata?.data?.uri?.replace(METADATA_REPLACE, '');
	}
	if(metadata?.data?.symbol){
		metadata.data.symbol = metadata?.data?.symbol?.replace(METADATA_REPLACE, '');
	}
	return metadata;
};

export const decodeUpdateMetadataV2 = (buffer: Buffer): UpdateMetadataArgsV2 => {
	const metadata = deserializeUnchecked(
		METADATA_SCHEMA,
		UpdateMetadataArgsV2,
		buffer,
	) as UpdateMetadataArgsV2;
	if(metadata?.data?.name != null){
		metadata.data.name = metadata?.data?.name?.replace(METADATA_REPLACE, '');
	}
	if(metadata?.data?.uri != null){
		metadata.data.uri = metadata?.data?.uri?.replace(METADATA_REPLACE, '');
	}
	if(metadata?.data?.symbol != null){
		metadata.data.symbol = metadata?.data?.symbol?.replace(METADATA_REPLACE, '');
	}
	return metadata;
};
