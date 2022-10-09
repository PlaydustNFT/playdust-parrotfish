import { Metadata, Data, EntityType, MintEntityData} from '../../../shared/src/types';
import { MetaplexOnChainMetadataEntity } from '../../../shared/src/entity/MetaplexOnChainMetadataEntity'
import { MintAddressEntity } from '../../../shared/src/entity/MintAddressEntity'
import { PublicKey } from "@solana/web3.js"


const data: Data = {
    name: "My Very First NFT",
    symbol: "NB",
    uri: "https://gvz3kawmaijjjsngceiaghyeeo2yatzz2ercazpomhrxoerm.arweave.net/NXO1AswCEpTJp-hEQAx8EI7-WAT_znRIiBl7mHjdxIs",
    sellerFeeBasisPoints: 10000,
    creators: [
      {
        address: "DGU8CkfhV9SYAEK5ZKAzgmcUQ2wzKDchaJ6rGjnk9AhT",
        verified: true,
        share: 100
      }
    ]
};
const metadata: Metadata = new Metadata({updateAuthority: 'element.accounts[4]',
                                        mint: 'element.accounts[1]',
                                        data: data,
                                        primarySaleHappened: false,
                                        isMutable: true,
                                        editionNonce: 254,
                                        token_standard: 1, //we are gonna set it to 0 if it has a master edition //if it has more than 0 decimals then it should be 2 (Fungible)
                                        collection: null,
                                        uses: null
});



describe("Verify MetaplexOnChainMetadata", () => {
    const entity: MetaplexOnChainMetadataEntity = new MetaplexOnChainMetadataEntity();
    entity.populate(metadata, 'metadataEntity', 'primaryEntity' );
    const now = new Date();

    it('Verify correct creation of the entity', () => {
        expect(entity.globalId).toBe(EntityType.MetaplexOnChainMetadata + '-' + 'metadataEntity');
        expect(entity.id).toBe('metadataEntity');
        expect(entity.primaryEntity).toBe('primaryEntity');
        expect(entity.type).toBe(EntityType.MetaplexOnChainMetadata);
        expect(entity.createdAt).toEqual(now);
        expect(entity.updatedAt).toEqual(now);
        expect(entity.data).toBe(metadata);
    });
});


describe("Verify MintAddressEntity", () => {
    const entity: MintAddressEntity = new MintAddressEntity();
    const now = new Date();
    const data: MintEntityData = new MintEntityData({
        decimals: 0,
        freezeAuthority: 'HNGVuL5kqjDehw7KR63w9gxow32sX6xzRNgLb8GAAAAA',
        isInitialized: true,
        mintAuthority: 'HNGVuL5kqjDehw7KR63w9gxow32sX6xzRNgLb8GBBBBB',
        supply: 1,
    })
    entity.populate(data, 'mintAddress');
    
    it('Verify correct creation of the entity', () => {
        expect(entity.globalId).toBe(EntityType.MintAddress + '-' + 'mintAddress');
        expect(entity.id).toBe('mintAddress');
        expect(entity.primaryEntity).toBeUndefined();
        expect(entity.type).toBe(EntityType.MintAddress);
        expect(entity.data.decimals).toBe(0);
        expect(entity.data.freezeAuthority).toBe('HNGVuL5kqjDehw7KR63w9gxow32sX6xzRNgLb8GAAAAA');
        expect(entity.data.isInitialized).toBe(true);
        expect(entity.data.mintAuthority).toBe('HNGVuL5kqjDehw7KR63w9gxow32sX6xzRNgLb8GBBBBB');
        expect(entity.data.supply).toBe(1);

    });
});






