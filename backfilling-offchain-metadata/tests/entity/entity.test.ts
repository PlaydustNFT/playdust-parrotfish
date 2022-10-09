/**
 * 
 * test all entity related code here
 * 
 */
import {MetaplexOffChainMetadataEntity} from "../../../shared/src/entity/MetaplexOffChainMetadataEntity";
import { EntityType, OffChainMetadata, MetadataCategory } from '../../../shared/src/types';


const uri: string = 'http://test.test';
const now: Date = new Date();
const mintAddress = 'TestMintAddress';
const data = new OffChainMetadata({
  name: 'Test',
  symbol: 'TEST',
	description: 'Test description for offchain entity',
  seller_fee_basis_points: 500,
	image: 'http://test.image',
	animation_url: 'http://test.animation_url',
  external_url: 'http://test.external_url',
	attributes: [
    {
      trait_type: 'trait_type1',
      display_type: '',
      value: 100,
    },
    {
      trait_type: 'trait_type2',
      display_type: '',
      value: 'trait_type2 value',
    }
  ],
  collection: {
    name: 'collectionName',
    family: 'collectionFamily',
  },
  properties: {
    files: 
    [
      {
        uri: 'uri',
        type: 'type',
        cdn: true,
      }
    ],
    category: MetadataCategory.Image,
    creators: 
    [
      {
        address: 'addressCreator',
        share: 500,
      }
    ],
  },
});


describe("Verify MetaplexOffChainMetadataEntity", () => {
  const entity = new MetaplexOffChainMetadataEntity();
  entity.populate(data, 'TestMintAddress', uri);

  it('Verify entity primaryEntity', () => {
    expect(entity.primaryEntity).toBe('TestMintAddress');
  });
  it('Verify entity type', () => {
    expect(entity.type).toBe(EntityType.MetaplexOffchainMetadata);
  });
  it('Verify entity createdAt', () => {
    expect(entity.createdAt).toBe(now);
  });
  it('Verify entity updatedAt', () => {
    expect(entity.updatedAt).toBe(now);
  });

  it('Verify entity data', () => {
    expect(entity.data.name).toBe(data.name);
    expect(entity.data.symbol).toBe(data.symbol);
    expect(entity.data.description).toBe(data.description);
    expect(entity.data.seller_fee_basis_points).toBe(data.seller_fee_basis_points);
    expect(entity.data.image).toBe(data.image);
    expect(entity.data.animation_url).toBe(data.animation_url);
    expect(entity.data.external_url).toBe(data.external_url);
    expect(entity.data.attributes).toBe(data.attributes);
    expect(entity.data.collection).toBe(data.collection);
    expect(entity.data.properties).toBe(data.properties);
  });
})

