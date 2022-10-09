import {normalizeOffChainMetadata} from '.././src/utils'
 
 const uri: string = 'http://test.test';
 const now: Date = new Date();
 const mintAddress = 'TestMintAddress';

 const data = {
    symbol: 'TEMPLATE',
    seller_fee_basis_points: 500,
    image: 'https://bafkreiggvyakk2uylzqf3s7hkltekiq443cl4es5owr2zs4ucbtkzjpo7a.ipfs.nftstorage.link',
    external_url: 'https://twitter.com',
    animation_url: 'https://bafybeiflydph5hbdzonql36dui3ekrdqn6ulrupgfnn3awrlm2xyxonmyu.ipfs.nftstorage.link',
    name: 'Test #0001',
    description: 'TEST DESC',
    attributes: [
      { value: 'Some Trait', trait_type: 'Background' },
      { value: 'Some Trait', trait_type: 'Base' },
      { value: 'Some Trait', trait_type: 'Headwear' },
      { value: 'Some Trait', trait_type: 'Eyes' },
      { value: 'NONE', trait_type: 'Mouth' },
      { value: 'Some Trait', trait_type: 'Neck' },
      { value: 'Some Trait', trait_type: 'Body' },
      { value: 'NONE', trait_type: 'Accessories' },
      { value: 'Some Trait', trait_type: 'Legs' },
      { display_type: 'number', value: 1, trait_type: 'ID' },
      { display_type: 'number', value: 32, trait_type: 'Alterations' },
      { display_type: 'number', value: 4, trait_type: 'Traits Changed' }
    ],
    properties: {
      creators: [
        {
          address: '6RvWCjQAPm35itJwc4omYN22u9NzQ5az4UfF3nTaPtpC',
          share: 100
        }
      ],
      files: [
        {
          type: 'image/png',
          uri: 'https://bafkreiggvyakk2uylzqf3s7hkltekiq443cl4es5owr2zs4ucbtkzjpo7a.ipfs.nftstorage.link'
        },
        {
          type: 'video/mp4',
          uri: 'https://bafybeiflydph5hbdzonql36dui3ekrdqn6ulrupgfnn3awrlm2xyxonmyu.ipfs.nftstorage.link'
        }
      ],
      category: 'image',
      proof_of_paw_selection: {
        ipfs_gateway_link: 'https://bafybeiflydph5hbdzonql36dui3ekrdqn6ulrupgfnn3awrlm2xyxonmyu.ipfs.nftstorage.link',
        ipfs_cid: 'bafybeiflydph5hbdzonql36dui3ekrdqn6ulrupgfnn3awrlm2xyxonmyu',
        ipfs_link: 'ipfs://bafkreiggvyakk2uylzqf3s7hkltekiq443cl4es5owr2zs4ucbtkzjpo7a'
      }
    }
  };
 
  const normalizeOffchainData = {
    name: 'Test #0001',
    symbol: 'TEMPLATE',
    external_url: 'https://twitter.com',
    description: 'TEST DESC',
    seller_fee_basis_points: 500,
    image: 'https://bafkreiggvyakk2uylzqf3s7hkltekiq443cl4es5owr2zs4ucbtkzjpo7a.ipfs.nftstorage.link',
    animation_url: 'https://bafybeiflydph5hbdzonql36dui3ekrdqn6ulrupgfnn3awrlm2xyxonmyu.ipfs.nftstorage.link',
    attributes: [
      { trait_type: 'Background', value: 'Some Trait' },
      { trait_type: 'Base', value: 'Some Trait' },
      { trait_type: 'Headwear', value: 'Some Trait' },
      { trait_type: 'Eyes', value: 'Some Trait' },
      { trait_type: 'Mouth', value: 'NONE' },
      { trait_type: 'Neck', value: 'Some Trait' },
      { trait_type: 'Body', value: 'Some Trait' },
      { trait_type: 'Accessories', value: 'NONE' },
      { trait_type: 'Legs', value: 'Some Trait' },
      { trait_type: 'ID', value: '1' },
      { trait_type: 'Alterations', value: '32' },
      { trait_type: 'Traits Changed', value: '4' }
    ],
    collection: undefined,
    properties: {
      files: [
        {
          uri: 'https://bafkreiggvyakk2uylzqf3s7hkltekiq443cl4es5owr2zs4ucbtkzjpo7a.ipfs.nftstorage.link',
          type: 'image/png',
          cdn: undefined
        },
        {
          uri: 'https://bafybeiflydph5hbdzonql36dui3ekrdqn6ulrupgfnn3awrlm2xyxonmyu.ipfs.nftstorage.link',
          type: 'video/mp4',
          cdn: undefined
        }
      ],
      category: 'image',
      creators: [
        {
          address: '6RvWCjQAPm35itJwc4omYN22u9NzQ5az4UfF3nTaPtpC',
          verified: undefined,
          share: 100
        }
      ]
    }
  }
 
 describe("Verify NormalizeOffchainDataFunction", () => {

   it('Verify normalizedOffchainMetadata', () => {
     //expect(normalizeOffChainMetadata(data)).toBe(normalizeOffchainData);
     expect(normalizeOffChainMetadata(data)).toEqual(normalizeOffchainData);
   });
   
 });
 