import { 
    PublicKey,
} from "@solana/web3.js"
import { EntityType, Marketplace, MarketplaceInstructionType, MarketplaceTransactionEntityData } from "../../shared/src/types";
import { BidTransactionEntity } from "../../shared/src/entity/transaction/BidTransactionEntity"
import { AskTransactionEntity } from "../../shared/src/entity/transaction/AskTransactionEntity"
import { CancelBidTransactionEntity } from "../../shared/src/entity/transaction/CancelBidTransactionEntity"
import { CancelAskTransactionEntity } from "../../shared/src/entity/transaction/CancelAskTransactionEntity"
import { ExecuteSaleTransactionEntity } from "../../shared/src/entity/transaction/ExecuteSaleTransactionEntity"
import { GlobalIdDelimiter } from "../../shared/src/consts";

const bw0 = new PublicKey('BqzHF9qnNeMCtNhEgTD3yzryHfbWvfdxgRUHnaE65TZg').toString();
const bw1 = new PublicKey('BE3G2F5jKygsSNbPFKHHTxvKpuFXSumASeGweLcei6G3').toString();

const sw0 = new PublicKey('8FrCybrh7UFznP1hVHg8kXZ8bhii37c7BGzmjkdcsGJp').toString();
const sw1 = new PublicKey('3qTqthYwuZKNQKruWJRGnubfXHU4MyGnvmoJcCbhELmn').toString();

const bp0 = new PublicKey('HwwQ3v5x3AdLopGFdQYZmwK7D5YURpFoDJcrbuZDsMHm').toString();
const bp1 = new PublicKey('FMxYRoHA3Xn4Su62GCwofmdALGdn4s16S5ZA4C91ULbX').toString();
const sp0 = new PublicKey('3h7PhXbCAGvtQHqwTS2V3Mhc3fK8E5Hs8EbgCVHkQFwd').toString();
const sp1 = new PublicKey('DpFKTy69uZv2G6KW7b117axwQRSztH5g4gUtBPZ9fCS7').toString();
const tm0 = new PublicKey('HW7QPs33Fzw9uME7gqs8DRuvbdP24WFc8jfpBQaqdi5C').toString();
const tm1 = new PublicKey('4ZTZ5khpqH4jBELchj4g8kcDZUcpuyWmMkj6ajycwGRu').toString();

export const StaticValues = {
    wallets: {
        buyer: [
            bw0, bw1
        ],
        seller: [
            sw0, sw1
        ]
    },
    pdas: {
        buyer: [
            bp0, bp1
        ],
        seller: [
            sp0, sp1
        ]
    },
    tokens: [
        tm0, tm1
    ],
    dates: {
        bid: [
            0,
            100,
            111,
        ],
        ask: [
            10,
            110,
            120,
        ],
        cancelBid: [
            20,
        ],
        cancelAsk: [
            30,
        ],
        executeSale: [
            40,
            41,
        ],
    },
    signatures: {
        bid: [
            'bidSignature0',
            'bidSignature1',
            'bidSignature2',
        ],
        ask: [
            'askSignature0',
            'askSignature1',
            'askSignature2',
        ],
        cancelBid: [
            'cancelBidSignature0',
        ],
        cancelAsk: [
            'cancelAskSignature0',
        ],
        executeSale: [
            'saleSignature0',
            'saleSignature1',
        ]
    },
    prices: {
        bid: [
            1,
            2,
            3,
        ],
        ask: [
            2.5,
            2,
            3
        ],
        executeSale: [
            2,
            3,
        ]
    }
}

export const orders = {
    Bid0: new MarketplaceTransactionEntityData(StaticValues.wallets.buyer[0], StaticValues.pdas.buyer[0], null, null, StaticValues.tokens[0], StaticValues.dates.bid[0], StaticValues.signatures.bid[0], Marketplace.MagicEdenV2, null, StaticValues.prices.bid[0]),
    CancelBid0: new MarketplaceTransactionEntityData(StaticValues.wallets.buyer[0], StaticValues.pdas.buyer[0], null, null, StaticValues.tokens[0], StaticValues.dates.cancelBid[0], StaticValues.signatures.cancelBid[0], Marketplace.MagicEdenV2, null, StaticValues.prices.bid[0]),
    Bid1: new MarketplaceTransactionEntityData(StaticValues.wallets.buyer[0], StaticValues.pdas.buyer[0], null, null, StaticValues.tokens[0], StaticValues.dates.bid[1], StaticValues.signatures.bid[1], Marketplace.MagicEdenV2, null, StaticValues.prices.bid[1]),
    Bid2: new MarketplaceTransactionEntityData(StaticValues.wallets.buyer[1], StaticValues.pdas.buyer[1], null, null, StaticValues.tokens[1], StaticValues.dates.bid[2], StaticValues.signatures.bid[2], Marketplace.MagicEdenV2, null, StaticValues.prices.bid[2]),

    Ask0: new MarketplaceTransactionEntityData(null, null, StaticValues.wallets.seller[0], StaticValues.pdas.seller[0], StaticValues.tokens[0], StaticValues.dates.ask[0], StaticValues.signatures.ask[0], Marketplace.MagicEdenV2, null, StaticValues.prices.ask[0]),
    CancelAsk0: new MarketplaceTransactionEntityData(null, null, StaticValues.wallets.seller[0], StaticValues.pdas.seller[0], StaticValues.tokens[0], StaticValues.dates.cancelAsk[0], StaticValues.signatures.cancelAsk[0], Marketplace.MagicEdenV2, null, StaticValues.prices.ask[0]),
    Ask1: new MarketplaceTransactionEntityData(null, null, StaticValues.wallets.seller[0], StaticValues.pdas.seller[0], StaticValues.tokens[0], StaticValues.dates.ask[1], StaticValues.signatures.ask[1], Marketplace.MagicEdenV2, null, StaticValues.prices.ask[1]),
    Ask2: new MarketplaceTransactionEntityData(null, null, StaticValues.wallets.seller[1], StaticValues.pdas.seller[1], StaticValues.tokens[1], StaticValues.dates.ask[2], StaticValues.signatures.ask[2], Marketplace.MagicEdenV2, null, StaticValues.prices.ask[2]),

    ExecuteSale0: new MarketplaceTransactionEntityData(StaticValues.wallets.buyer[0], StaticValues.pdas.buyer[0], StaticValues.wallets.seller[0], StaticValues.pdas.seller[0], StaticValues.tokens[0], StaticValues.dates.executeSale[0], StaticValues.signatures.executeSale[0], Marketplace.MagicEdenV2, null, StaticValues.prices.executeSale[0]),
    ExecuteSale1: new MarketplaceTransactionEntityData(StaticValues.wallets.buyer[1], StaticValues.pdas.buyer[1], StaticValues.wallets.seller[1], StaticValues.pdas.seller[1], StaticValues.tokens[1], StaticValues.dates.executeSale[1], StaticValues.signatures.executeSale[1], Marketplace.MagicEdenV2, null, StaticValues.prices.executeSale[1]),
};

    const bid0Entity = new BidTransactionEntity();
    const bid1Entity = new BidTransactionEntity();
    const bid2Entity = new BidTransactionEntity();
    bid0Entity.populate(orders.Bid0, orders.Bid0.signature);
    bid1Entity.populate(orders.Bid1, orders.Bid1.signature);
    bid2Entity.populate(orders.Bid2, orders.Bid2.signature);

    const ask0Entity = new AskTransactionEntity();
    const ask1Entity = new AskTransactionEntity();
    const ask2Entity = new AskTransactionEntity();
    ask0Entity.populate(orders.Ask0, orders.Ask0.signature);
    ask1Entity.populate(orders.Ask1, orders.Ask1.signature);
    ask2Entity.populate(orders.Ask2, orders.Ask2.signature);

    const cancelBid0Entity = new CancelBidTransactionEntity();
    const cancelAsk0Entity = new CancelAskTransactionEntity();
    cancelBid0Entity.populate(orders.CancelBid0, orders.CancelBid0.signature);
    cancelAsk0Entity.populate(orders.CancelAsk0, orders.CancelAsk0.signature);

    const executeSale0Entity = new ExecuteSaleTransactionEntity();
    const executeSale1Entity = new ExecuteSaleTransactionEntity();
    executeSale0Entity.populate(orders.ExecuteSale0, orders.ExecuteSale0.signature);
    executeSale1Entity.populate(orders.ExecuteSale1, orders.ExecuteSale1.signature);

export const entities = [
    bid0Entity,
    bid1Entity,
    bid2Entity,
    ask0Entity,
    ask1Entity,
    ask2Entity,
    cancelBid0Entity,
    cancelAsk0Entity,
    executeSale0Entity,
    executeSale1Entity,
];

export const entitiesIndex = {
    Bid: [
        0,
        1,
        2,
    ],
    Ask: [
        3,
        4,
        5,
    ],
    CancelBid: [
        6,
    ],
    CancelAsk: [
        7,
    ],
    ExecuteSale: [
        8,
        9,
    ],
};

export const ExpectedValues = { };

export const generateExpectedGlobalId = (type: EntityType, wallet: string, mint: string, marketplace: Marketplace): string => {
    return type + GlobalIdDelimiter + wallet.toString() + GlobalIdDelimiter + mint.toString() + GlobalIdDelimiter + marketplace;
}