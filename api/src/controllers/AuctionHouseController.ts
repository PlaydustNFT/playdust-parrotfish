import {
  equals,
  greaterThanOrEqualTo,
  lessThanOrEqualTo,
} from "@aws/dynamodb-expressions";
import { Request, Response, NextFunction } from "express";
import { ddbmapper } from "../services/dynamodb";
import {
  showAction,
  showEscrowAction,
  publicBidAction,
  cancelPublicBidAction,
  askAction,
  cancelAskAction,
  executeAction,
  publicAcceptBid,
} from "../helpers/actions";
import { BidOrderStateEntity } from "../../../shared/src/entity/order_state/BidOrderStateEntity"
import { AskOrderStateEntity } from "../../../shared/src/entity/order_state/AskOrderStateEntity"
import { SaleEntity } from "../../../shared/src/entity/SaleEntity"
import { Keypair, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import { numbersTypeMap } from "@metaplex-foundation/beet";
import { EntityType, Marketplace, OrderStateEntityData, SalesEntityData, TransactionHashAndBlockTime } from "../../../shared/src/types";
import { IndexNames } from "../../../shared/src/consts";
import { generateGlobalIdForAsksAndBids } from "../../../shared/src/util";

// TODO: ensure that before persisting Order to db, lookup auctionHouse Market db
// if Market doesn't exist, order is invalid
// this is to impose a constraint that is currently implemented via Foreign Keys in MySQL
// however ddb doesn't support the concept of Foreign Keys

export type WithdrawRequest = {
  wallet: string;
  amount: number;
};

//for testing purpose
const sellerKeypair = Keypair.fromSecretKey(
  new Uint8Array(
    (
      (process.env.AH_SELLER_KEY_TEST as string) ||
      // Ezc7PsRcSGDR9GknuWgaN78aUDUt5n3CjBxkFG9xZgFM devnet
      // "55,102,63,67,79,174,111,161,248,40,29,88,220,146,27,230,39,189,47,143,69,159,156,124,133,79,129,174,67,243,11,165,207,233,188,69,240,133,58,209,98,148,155,37,117,94,231,213,247,228,103,222,137,179,204,80,39,90,139,77,124,67,29,236"
      // HnHpFJoXbdA277tPc8SraBpYjxaezAc88yZGV1935FUT mainnet
      "185,18,178,35,2,146,153,164,239,45,175,70,61,185,1,108,75,173,185,94,10,72,88,205,44,73,39,235,152,109,122,111,249,85,35,185,246,211,1,18,17,177,15,197,53,11,136,165,139,110,242,217,134,74,100,242,173,62,130,80,52,195,10,240"
    )
      .split(",")
      .map((item) => parseInt(item))
  )
);

//for testing purpost
const buyerKeypair = Keypair.fromSecretKey(
  new Uint8Array(
    (
      (process.env.AH_BUYER_KEY_TEST as string) ||
      // DsuAk9sXGN2d8mMG12Wwjqibv6adX8DUaWSdDnDkwJZS devnet
      //"212,68,21,106,250,1,43,109,12,249,27,149,2,190,217,253,22,47,10,150,202,217,170,227,115,179,105,131,248,60,186,168,191,86,69,38,81,171,92,25,177,140,148,69,107,187,5,239,135,144,119,24,146,174,239,105,249,143,59,159,107,49,49,157"
      //2QwwLzVvRKiG8EALUyKFxaujxgwKTET59heW211NasaL mainnet
      "99,245,2,149,248,159,96,185,180,61,126,46,15,227,51,159,151,38,38,49,50,154,126,238,105,31,69,242,186,69,201,32,20,254,41,184,157,108,249,203,162,57,212,166,172,224,184,46,89,72,78,87,78,237,105,77,146,230,22,83,50,19,51,141"
    )
      .split(",")
      .map((item) => parseInt(item))
  )
);


export type OrderRequest = {
  // Buyer wallet address
  wallet: string;
  // Mint of the token to purchase
  mint: string;
  // Price you wish to purchase for
  buyPrice: number;
  // Amount of tokens you want to purchase
  tokenSize: number;
  // Transaction hash
  txHash?: string;
  // "bid" or "ask"
  side?: string;
  // seller wallet address
  sellerWallet?: string;
  // buyer wallet address
  buyerWallet?: string;
};

export type AcceptOfferRequest = {
  // Mint of the token to purchase
  mint: string;
  // Price you wish to purchase for
  buyPrice: number;
  // Amount of tokens you want to purchase
  tokenSize: number;
  // Transaction hash
  txHash?: string;
  // "bid" or "ask"
  side?: string;
  // seller wallet address
  sellerWallet?: string;
  // buyer wallet address
  buyerWallet?: string;
  previousAskPrice: number;
};

export type ExecuteRequest = {
  // Transaction buffer to submit to blockchain
  txBuff: Buffer;
  // id of bid order
  bidOrderId?: string;
  // id of ask order
  askOrderId?: string;
  // id of sale/auto-match
  saleId?: string;
  // type to validate against
  // exectionType: ValidExecutionType;
};

export default class AuctionHouseController {
  /**
   * Prints the balances of the fee and treasury wallets configured for the auction house and its current settings options
   *
   * DOC: https://docs.metaplex.com/auction-house/cli#show
   */
  static async show(req: Request, res: Response, next: NextFunction) {
    try {
      const auction = await showAction(req.params.treasuryMint);

      res.send(auction);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Print out the balance of an auction house escrow account for a given wallet.
   *
   * DOC: https://docs.metaplex.com/auction-house/cli#other-actions
   */
  static async showEscrow(req: Request, res: Response, next: NextFunction) {
    try {
      const amount = await showEscrowAction(
        req.params.wallet,
        req.params.treasuryMint
      );

      res.send({ amount });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Place and NFT UP for sale
   *
   * DOC: https://docs.metaplex.com/auction-house/cli#sell
   */
  static async ask(
    req: Request<Record<string, string>, Record<string, unknown>, OrderRequest>,
    res: Response,
    next: NextFunction
  ) {
    try {
      // TODO: reject if seller has already listed NFT

      const requestPrice = Number(req.body.buyPrice);
      const tokenSize = Number(req.body.tokenSize);
      const requestPriceInLamports = requestPrice * LAMPORTS_PER_SOL

      // check if there is matched bid
      const matchingOrders = [];
      for await (const order of ddbmapper.query(
        BidOrderStateEntity,
        { primaryEntity: req.body.mint },
        {
          filter: {
            type: "And",
            conditions: [
              { ...equals(requestPriceInLamports), subject: "data.price" },
              { ...equals(EntityType.BidOrderState), subject: "type" },
              { ...equals(true), subject: "data.active" },
            ],
          },
          indexName: IndexNames.EntityDb.primaryEntityIndex
        }
      )) {
        if (order) {
          matchingOrders.push(order);
          break;
        }
      }
      const autoMatchedOrder = matchingOrders?.at(0);
      const orderToCreate = new AskOrderStateEntity();
      orderToCreate.id = req.body.wallet;
      orderToCreate.primaryEntity = req.body.mint;
      const data: OrderStateEntityData = {
        price: requestPriceInLamports,
        active: false,
        marketplace: Marketplace.Playdust,
      };
      orderToCreate.data = data
      orderToCreate.type = EntityType.AskOrderState;
      orderToCreate.globalId = orderToCreate.generateGlobalId()

      const [buff, createdOrder] = await Promise.all([
        // transaction to list NFT
        askAction(
          req.params.treasuryMint,
          // seller wallet
          req.body.wallet,
          req.body.mint,
          requestPrice,//FIXME here is a potential ERROR
          tokenSize,
          // buyer wallet
          autoMatchedOrder?.id
        ),
        // create order tracking
        ddbmapper.put(orderToCreate),
      ]);

      const isAutoMatched = matchingOrders?.length > 0;
      const bidOrderId = autoMatchedOrder?.globalId;
      const askOrderId = createdOrder.globalId;
      let saleId = "";
      if (isAutoMatched) {

        const sale = new SaleEntity()
        const saleData: SalesEntityData = {
            active: false,
            price: requestPriceInLamports,
            marketplace: Marketplace.Playdust,
            bidWallet: autoMatchedOrder.id,
            askWallet: req.body.wallet,
        }
        sale.populate(saleData, req.body.mint)

        const createdSale = await ddbmapper.put(sale);
        saleId = createdSale.globalId;
      }

      res.send({
        txBuff: [...new Uint8Array(buff)],
        isAutoMatched,
        bidOrderId,
        askOrderId,
        saleId,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Potential seller revokes their list.
   *
   * DOC: https://docs.metaplex.com/auction-house/cli#other-actions
   */
  static async cancelAsk(
    req: Request<Record<string, string>, Record<string, unknown>, OrderRequest>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const buyPrice = Number(req.body.buyPrice);
      const tokenSize = Number(req.body.tokenSize);
      const buyPriceInLamports = buyPrice * LAMPORTS_PER_SOL;

      const [buff] = await Promise.all([
        cancelAskAction(
          req.params.treasuryMint,
          req.body.wallet,
          req.body.mint,
          buyPrice,
          tokenSize
        ),
      ]);

      const asks = [];
      const globalIdForCancelAsk = generateGlobalIdForAsksAndBids(EntityType.AskOrderState, req.body.wallet, req.body.mint, Marketplace.Playdust)
      console.log(globalIdForCancelAsk)
      for await (const order of ddbmapper.query(
        AskOrderStateEntity,
        { globalId: globalIdForCancelAsk },
        {
          filter: {
            type: "And",
            conditions: [
              { ...equals(buyPriceInLamports), subject: "data.price" },
              { ...equals(true), subject: "data.active" },
            ],
          },
        }
      )) {
        if (order) {
          asks.push(order);
          break;
        }
      }
      const ask = asks.at(0);

      res.send({
        txBuff: [...new Uint8Array(buff)],
        askOrderId: ask?.globalId,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Place an offer on an NFT by its mint address
   *
   * DOC: https://docs.metaplex.com/auction-house/cli#buy
   */
  static async bid(
    req: Request<Record<string, string>, Record<string, unknown>, OrderRequest>,
    res: Response,
    next: NextFunction
  ) {
    try {
      //TODO: Reject if buyer already has active offer, for now, don't allow on UI

      const requestPrice = Number(req.body.buyPrice);
      const requestPriceInLamports = requestPrice * LAMPORTS_PER_SOL;
      const tokenSize = Number(req.body.tokenSize);
      const matchingOrders = [];

      for await (const order of ddbmapper.query(
        AskOrderStateEntity,
        { primaryEntity: req.body.mint },
        {
          filter: {
            type: "And",
            conditions: [
              { ...equals(requestPriceInLamports), subject: "data.price" },
              { ...equals(EntityType.AskOrderState), subject: "type" },
              { ...equals(true), subject: "data.active" },
            ],
          },
          indexName: IndexNames.EntityDb.primaryEntityIndex
        }
      )) {
        if (order) {
          matchingOrders.push(order);
          break;
        }
      }
      const autoMatchedOrder = matchingOrders?.at(0);

      let depositAmount: number
      const escrowTotal = await showEscrowAction(req.body.wallet)
      const escrowMinimum = 890880
      const escrowTotalWithoutMinimumInLamports = escrowTotal - escrowMinimum
      const escrowTotalWithoutMinimumInSOL = escrowTotalWithoutMinimumInLamports/(10**9)

      /*
        When executing buy command, and if buyPrice > escrowTotalWithoutMinimumInSOL, buy command will automatically 
        transfer difference buyPrice-ecrowAmount to escrow account. In that case, buyPrice is not transfered to escrow
        amount(only buyPrice-escrowTotalWithoutMinimumInSOL).So we want to transfer remaining escrowTotalWithoutMinimumInSOL,
        so in total, we added buyPrice to escrow account.

        In case buyPrice < escrowTotalWithoutMinimumInSOL, buy command will not transfer any funds, so in that case we will deposit buyPrice.
      */
      if( escrowTotalWithoutMinimumInSOL < requestPrice ) {
        depositAmount = escrowTotalWithoutMinimumInSOL
      } else {
        depositAmount = requestPrice
      }

      const orderToCreate = new BidOrderStateEntity();
      orderToCreate.id = req.body.wallet;
      orderToCreate.primaryEntity = req.body.mint;
      const data: OrderStateEntityData = {
        price: requestPriceInLamports,
        active: false,
        marketplace: Marketplace.Playdust,
      };
      orderToCreate.data = data
      orderToCreate.type = EntityType.BidOrderState;
      orderToCreate.globalId = orderToCreate.generateGlobalId()

      const [buff, createdOrder] = await Promise.all([
        // transaction to make an offer
        publicBidAction(
          req.params.treasuryMint,
          req.body.wallet,
          req.body.mint,
          depositAmount,
          requestPrice,
          tokenSize,
          autoMatchedOrder?.id
        ),
        ddbmapper.put(orderToCreate),
      ]);

      const isAutoMatched = matchingOrders?.length > 0;
      const bidOrderId = createdOrder.globalId;
      const askOrderId = autoMatchedOrder?.globalId;
      let saleId = "";
      if (isAutoMatched) {
       const sale = new SaleEntity()
        const saleData: SalesEntityData = {
            active: false,
            price: requestPriceInLamports,
            marketplace: Marketplace.Playdust,
            bidWallet: req.body.wallet,
            askWallet: autoMatchedOrder.id,
        }
        sale.populate(saleData, req.body.mint)

        const createdSale = await ddbmapper.put(sale);
        saleId = createdSale.globalId;
      }

      res.send({
        txBuff: [...new Uint8Array(buff)],
        isAutoMatched,
        bidOrderId,
        askOrderId,
        saleId,
      });
    } catch (err) {
      next(err);
    }
  }

    /**
   * Place an offer on an NFT by its mint address
   *
   * DOC: https://docs.metaplex.com/auction-house/cli#buy
   */
  static async acceptBid(
      req: Request<Record<string, string>, Record<string, unknown>,  AcceptOfferRequest>,
      res: Response,
      next: NextFunction
  ) {
      try {
        const requestPrice = Number(req.body.buyPrice);
        const requestPriceInLamports = requestPrice * LAMPORTS_PER_SOL;
        const previousAskPrice = Number(req.body.previousAskPrice)
        const previousAskPriceInLamports = previousAskPrice * LAMPORTS_PER_SOL;
        const tokenSize = Number(req.body.tokenSize);
        const buyerWallet = req.body.buyerWallet
        const sellerWallet = req.body.sellerWallet
        //only create sale, since it's sold

        //get Escrow amount, and subtract Escrow from BuyPrice

        const [buff] = await Promise.all([
          publicAcceptBid(
            req.params.treasuryMint,
            buyerWallet,
            req.body.mint,
            requestPrice,
            previousAskPrice,
            tokenSize,
            sellerWallet,
          ),]);

        const bids = [];
        
        const globalIdForBidsAcceptBid = generateGlobalIdForAsksAndBids(EntityType.BidOrderState, req.body.buyerWallet, req.body.mint, Marketplace.Playdust)
        for await (const order of ddbmapper.query(
          BidOrderStateEntity,
          { globalId: globalIdForBidsAcceptBid },
          {
            filter: {
              type: "And",
              conditions: [
                { ...equals(requestPriceInLamports), subject: "data.price" },
                { ...equals(true), subject: "data.active" },
              ],
            },
          }
        )) {
          if (order) {
            bids.push(order);
            break;
          }
        }
        const bid = bids?.at(0);

      const asks = [];
      const globalIdForAsksAcceptAsk = generateGlobalIdForAsksAndBids(EntityType.AskOrderState, req.body.sellerWallet, req.body.mint, Marketplace.Playdust)
      console.log(globalIdForAsksAcceptAsk)
      for await (const order of ddbmapper.query(
        AskOrderStateEntity,
        { globalId: globalIdForAsksAcceptAsk },
        {
          filter: {
            type: "And",
            conditions: [
              { ...equals(previousAskPriceInLamports), subject: "data.price" },
              { ...equals(true), subject: "data.active" },
            ],
          },
        }
      )) {
        if (order) {
          asks.push(order);
          break;
        }
      }
      const ask = asks?.at(0);

      let saleId = ""

      const sale = new SaleEntity()
      const saleData: SalesEntityData = {
          active: false,
          price: requestPriceInLamports,
          marketplace: Marketplace.Playdust,
          bidWallet: req.body.buyerWallet,
          askWallet: req.body.sellerWallet,
      }
      sale.populate(saleData, req.body.mint)

      const createdSale = await ddbmapper.put(sale);
      saleId = createdSale.globalId;

      res.send({
         txBuff: [...new Uint8Array(buff)],
         bidOrderId: bid?.globalId,
         askOrderId: ask?.globalId,
         saleId,
      });

  } catch (err) {
        next(err);
  }
  }
  /**
   * Potential buyer revokes their offer.
   *
   * DOC: https://docs.metaplex.com/auction-house/cli#other-actions
   */
  static async cancelBid(
    req: Request<Record<string, string>, Record<string, unknown>, OrderRequest>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const buyPrice = Number(req.body.buyPrice);
      const buyPriceInLamports = buyPrice * LAMPORTS_PER_SOL;
      const tokenSize = Number(req.body.tokenSize);

      const [buff] = await Promise.all([
        cancelPublicBidAction(
          req.params.treasuryMint,
          req.body.wallet,
          req.body.mint,
          buyPrice,
          tokenSize
        ),
      ]);

      const bids = [];
      const globalIdForBidsCancelBid = generateGlobalIdForAsksAndBids(EntityType.BidOrderState, req.body.wallet, req.body.mint, Marketplace.Playdust)
      console.log(globalIdForBidsCancelBid)
      for await (const order of ddbmapper.query(
        BidOrderStateEntity,
        { globalId: globalIdForBidsCancelBid },
        {
          filter: {
            type: "And",
            conditions: [
              { ...equals(buyPriceInLamports), subject: "data.price" },
              { ...equals(true), subject: "data.active" },
            ],
          },
        }
      )) {
        if (order) {
          bids.push(order);
          break;
        }
      }
      const bid = bids?.at(0);;

      res.send({
        txBuff: [...new Uint8Array(buff)],
        bidOrderId: bid?.globalId,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Execute auction house transactions
   */
  static async execute(
    req: Request<
      Record<string, string>,
      Record<string, unknown>,
      ExecuteRequest
    >,
    res: Response,
    next: NextFunction
  ) {
    try {
      // execute transaction
      let transactionHashAndBlockTime: [TransactionHashAndBlockTime]
      /*
      //use this code for testing, signing from seller and buyer side
      let transaction = Transaction.from(req.body.txBuff)
     try {
        transaction.partialSign(...[buyerKeypair])
         transactionHashAndBlockTime = await Promise.all([executeAction(transaction.serialize())]);}
      catch {
        {transaction.partialSign(...[sellerKeypair])
        transactionHashAndBlockTime = await Promise.all([executeAction(transaction.serialize())]);}
      }
      //when testing comment next line
      */
      
      transactionHashAndBlockTime = await Promise.all([executeAction(req.body.txBuff)]);

      // tx included ask order update
      // if there are most than one offer than it will pick up only one offer
      if (req.body.askOrderId) {
        const asks = [];
        for await (const ask of ddbmapper.query(
          AskOrderStateEntity,
          { globalId: req.body.askOrderId },
          { limit: 1 }
        )) {
          if (ask) {
            asks.push(ask);
            break;
          }
        }
        const ask = asks?.at(0);

        // sync order database
        if (ask.data.signature || req.body.saleId) {
          // inactive order when ask or bid is canceled, or if auto-matched
          // if txHash is not null, it means it's cancel ask
          ask.data.active = false;
        } else {
          // active order when ask or bid is created & not auto-matched
          ask.data.active = true;
        }
        ask.data.signature = transactionHashAndBlockTime.at(0).txHash;
        ask.data.blockTime = transactionHashAndBlockTime.at(0).blockTime

        // TODO: inactive when ask and bid is matched & sale executed
        await ddbmapper.put(ask);
      }

      // tx included bid order update
      if (req.body.bidOrderId) {
        const bids = [];
        for await (const bid of ddbmapper.query(
          BidOrderStateEntity,
          { globalId: req.body.bidOrderId },
        {
          limit: 1 }
        )) {
          if (bid) {
            bids.push(bid);
            break;
          }
        }
        const bid = bids?.at(0);

        // sync order database
        if (bid.data.signature || req.body.saleId) {
          // inactive order when ask or bid is canceled, or if auto-matched
          // if txHash is not null, it means it's cancel bid
          bid.data.active = false;
        } else {
          // active order when ask or bid is created & not auto-matched
          bid.data.active = true;
        }
        bid.data.signature = transactionHashAndBlockTime.at(0).txHash;
        bid.data.blockTime = transactionHashAndBlockTime.at(0).blockTime;

        // TODO: inactive when ask and bid is matched & sale executed
        await ddbmapper.put(bid);
      }

      // was an auto-match
      if (req.body.saleId) {
        const sales = [];
        for await (const sale of ddbmapper.query(
          SaleEntity,
          { globalId: req.body.saleId },
          { limit: 1 }
        )) {
          if (sale) {
            sales.push(sale);
            break;
          }
        }
        const sale = sales?.at(0);
        
        sale.data.txHash = transactionHashAndBlockTime.at(0).txHash;
        sale.data.blocktime = transactionHashAndBlockTime.at(0).blockTime;
        sale.data.active = true;
        sale.updatedAt = new Date();

        await ddbmapper.put(sale);
      }
      const response = {
        txHash: transactionHashAndBlockTime.at(0).txHash
      }
      res.send(response);
    } catch (err) {
      next(err);
    }
  }
}
