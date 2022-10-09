import {  decodeCreateMetadata, decodeCreateMetadataV2, decodeUpdateMetadata, decodeUpdateMetadataV2 } from '../src/metaplex-utils';
import * as base58 from 'bs58';

const UpdateMetadata = {
    accounts: [
      'BUrXML6kLb5wGEF3M9jLCJboSNNtepxjC8HrRdwhZycf',
      'utztcdTGcJLLKYTkuLmf4NLDbuueCz4iZEnvUcfLoWL'
    ],
    data: '2wkHKsoGEgCAybWET9qAL7sP3SMVnLFMDrD8BBjA31BDkhwx7S',
    programId: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
};
const UpdateMetadata2 = {
    accounts: [
      '2iGUKsunKpQUjFapqn8GZNGFkLzUnBAeuixQfej4H9ZD',
      '7tVLqdj7FLjeiQKoiJdHg9d4p3ccn5W4NJBYT88UFRRY'
    ],
    data: 'SYa5RscD4PuwAAUAkBqt2HZF5Eq9FfdgHfA7m3iJnEXe61nw',
    programId: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
};

const UpdateMetadataV2 = {
    accounts: [
      '6pFYrk5Ty66jHghkHnRkXhfvV241WUgKHCwph6VEpq6u',
      'DGU8CkfhV9SYAEK5ZKAzgmcUQ2wzKDchaJ6rGjnk9AhT'
    ],
    data: '2nGPt8n6QazKfTdQ7zdcPwGDT6hG6c8VzM8kzJBEqvgdBx6Ef85UPF6QnXAwKkhgjT3oNQJU22ZJjG1VQQqYFvuWwrGLaqVp97nLrCgPd9NCNhNJHw5vYuuqxwx4ZetPwEHWvG4xmEdoFtuKSiPg8155dFrAfe4oZKDP9V2Hns6BtG8Qpwp4UyU9dRXjeY1gjvAXKmcsFnhLseNfKcU41k1qxng73N2F3srSyc6mGYQ2CwGDc1bdCChm2NzdjKztX866K',
    programId: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
};

const CreateMetadataAccountV2 = {
    accounts: [
      '71WKdXCHDx9Fmg4Cr3A7yYoXky9WjsUd7M6uPK2cPXkG',
      '2odzpgmwcvS4D9HTGhc6Pegrw6EdLJHz9W8PW8fiNXuP',
      '8c1wDYsAynw1ZQjTqkt35qPxHaq5fFwmVdtpmujws8D3',
      '8c1wDYsAynw1ZQjTqkt35qPxHaq5fFwmVdtpmujws8D3',
      '8c1wDYsAynw1ZQjTqkt35qPxHaq5fFwmVdtpmujws8D3',
      '11111111111111111111111111111111',
      'SysvarRent111111111111111111111111111111111'
    ],
    data: '2DK9aJbAhF98ztgTsjwny7nSfobaDg24fRHYDuuU2dxtFepaAqtKFxBxv2eojcAjmAKX4dk8CoRxjMGTTqGDmmPRKdLadZcb2WoW3yiEtj3AXsdRxsSeHNCKqZuCe9SK6bRsX1hd2JvpBGnu1axNNg72ReniRfmmP5zyvVJAtha65MSg5pkFHAjKFn',
    programId: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
};

const CreateMetadataAccount = {
    accounts: [
      'J16Cah4cQBbr3zWejga72RWeVex9o5J88UyHJCRCN6ie',
      'ore3VtBRfSFGXknSBcfFyLmZEqsVMMDu5o5t41tUfxf',
      'Step8PYyUZ4W9a6k4GhVJTRSvTujfYJngQ9Kfdw2Cft',
      'Step8PYyUZ4W9a6k4GhVJTRSvTujfYJngQ9Kfdw2Cft',
      'Step8PYyUZ4W9a6k4GhVJTRSvTujfYJngQ9Kfdw2Cft',
      '11111111111111111111111111111111',
      'SysvarRent111111111111111111111111111111111'
    ],
    data: '14hY839HYfmrYmNLJVSLxNDqsX1rdw7BoGN7RenyZj5ThcUQhnyeADZibDgnYu8DRJq6D9HASnhiS8VKk4Ddu5Ao9o7TKPATPwnCpDaVSWbd4ien1vQKJZaeU7DiJZrfxzdFAfG3d1eQQhN5ULVpQUCoTtZiy66837ZXM6aW4',
    programId: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
};

//expected result of the decoding
const UpdateMetadataResult = {
    instruction: 1,
    data: null,
    updateAuthority: "utztcdTGcJLLKYTkuLmf4NLDbuueCz4iZEnvUcfLoWL",
    primarySaleHappened: 1
};
const UpdateMetadataResult2 = {
    instruction: 1,
    data: null,
    updateAuthority: "Cq4P18vbjMQNE7J2nMme4RMpRyVFf8PGFNkvh5ecC4jF",
    primarySaleHappened: undefined
};

const UpdateMetadataV2Result = {
    instruction: 15,
    data: {
        name: "My Very First NFT",
        symbol: "NB",
        uri: "https://gvz3kawmaijjjsngceiaghyeeo2yatzz2ercazpomhrxoerm.arweave.net/NXO1AswCEpTJp-hEQAx8EI7-WAT_znRIiBl7mHjdxIs",
        sellerFeeBasisPoints: 10000,
        creators: [
          {
            address: "DGU8CkfhV9SYAEK5ZKAzgmcUQ2wzKDchaJ6rGjnk9AhT",
            verified: 1,
            share: 100
          }
        ],
        collection: undefined,
        uses: undefined,
    },
    primarySaleHappened: undefined,
    updateAuthority: null,
    isMutable: undefined
};

const CreateMetadataAccountResult = {
    instruction: 0,
    data: {
        name: "Sneaker #486806935",
        symbol: "",
        uri: "https://api.joysteps.io/run/nftjson/103/44199023429",
        sellerFeeBasisPoints: 400,
        creators: [
            {
                address: "Step8PYyUZ4W9a6k4GhVJTRSvTujfYJngQ9Kfdw2Cft",
                verified: 1,
                share: 100
            }
        ]
    },
    isMutable: 1, 
};

const CreateMetadataAccountV2Result = {
    instruction: 16,
    data: {
        name: "JollyDay Mug",
        symbol: "JDYM",
        uri: "https://arweave.net/8aUNVRSpFwOgfhy2e_uVHqmUSXuj2zXWtV8lmb4HkFE",
        sellerFeeBasisPoints: 1000,
        creators: [
            {
                address: "8c1wDYsAynw1ZQjTqkt35qPxHaq5fFwmVdtpmujws8D3",
                verified: 1,
                share: 100
              }
        ],
        collection: undefined,
        uses: undefined,
    },
    isMutable: 1, 
};





describe("Verify decodeCreateMetadata", () => {
    const databs58 = base58.decode(CreateMetadataAccount.data); //Uint8 array 
    const buf = Buffer.from(databs58);
    
    it('Verify the correct decoding of the data payload', () => {
        expect(decodeCreateMetadata(buf)).toEqual(CreateMetadataAccountResult);
    });
    
});

describe("Verify decodeCreateMetadataV2", () => {
    const databs58 = base58.decode(CreateMetadataAccountV2.data); //Uint8 array 
    const buf = Buffer.from(databs58);
    
    it('Verify the correct decoding of the data payload', () => {
        expect(decodeCreateMetadataV2(buf)).toEqual(CreateMetadataAccountV2Result);
    }); 
});

describe("Verify decodeUpdateMetadata", () => {
    let databs58 = base58.decode(UpdateMetadata.data); //Uint8 array 
    let buf = Buffer.from(databs58);
    
    it('Verify the correct decoding of the data payload', () => {
        expect(decodeUpdateMetadata(buf)).toEqual(UpdateMetadataResult);
    }); 
});
describe("Verify decodeUpdateMetadata", () => {
    let databs58 = base58.decode(UpdateMetadata2.data); //Uint8 array 
    let buf = Buffer.from(databs58);
    
    it('Verify the correct decoding of the data payload', () => {
        expect(decodeUpdateMetadata(buf)).toEqual(UpdateMetadataResult2);
    }); 
});

describe("Verify decodeUpdateMetadataV2", () => {
    const databs58 = base58.decode(UpdateMetadataV2.data); //Uint8 array 
    const buf = Buffer.from(databs58);
    
    it('Verify the correct decoding of the data payload', () => {
        expect(decodeUpdateMetadataV2(buf)).toEqual(UpdateMetadataV2Result);
    }); 
});

