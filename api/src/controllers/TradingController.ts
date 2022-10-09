import { AuctionHouseProgram } from "@metaplex-foundation/mpl-auction-house";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";

import { Request, Response, NextFunction } from "express";
import { equals, inList, notEquals } from "@aws/dynamodb-expressions";
import { ddbmapper } from "../services/dynamodb";
import { Order } from "../ddbmodels/Order";
import { Market } from "../ddbmodels/Market";
import { getTokenAmount } from "../helpers/utils";
import { connection } from "../helpers/actions";
import { AskOrderStateEntity } from "../../../shared/src/entity/order_state/AskOrderStateEntity";
import { BidOrderStateEntity } from "../../../shared/src/entity/order_state/BidOrderStateEntity";
import { IndexNames } from "../../../shared/src/consts";
import { BaseOrderStateEntity } from "../../../shared/src/entity/order_state/BaseOrderStateEntity";
import { EntityType, Marketplace } from "../../../shared/src/types";

export default class TradingController {
  /**
   * list available markets (token list)
   *
   * @param req
   * @param res
   * @param next
   */
  static async markets(req: Request, res: Response, next: NextFunction) {
    try {
      const markets = [];
      for await (const market of ddbmapper.scan(Market)) {
        markets.push(market);
      }
      res.send(markets);
    } catch (err) {
      next(err);
    }
  }

  /**
   * list orders for NFT
   *
   * @param req
   * @param res
   * @param next
   */
  static async orders(
    req: Request<
      Record<string, string>,
      Record<string, unknown>,
      Record<string, unknown>
    >,
    res: Response,
    next: NextFunction
  ) {
    try {
      const asksAndBids = [];
      console.log(req.params.mint)
      for await (const order of ddbmapper.query(
        BaseOrderStateEntity,
        { primaryEntity: req.params.mint },
        {
          filter: {
            type: "And",
            conditions: [
              { ...equals(true), subject: "data.active" },
              { ...equals(Marketplace.Playdust), subject: "data.marketplace" },
              { ...inList(...[EntityType.BidOrderState, EntityType.AskOrderState]), subject: "type"}
            ],
          },
          indexName: IndexNames.EntityDb.primaryEntityIndex,
        }
      )) {
        if (order) {
          asksAndBids.push(order);
        }
      }

      //FIXME this endpoint will be removed in next iteration
      //converting BaseOrderStateEntity in Order in order to keep compatibility with frontend
      const orders = asksAndBids.map((asksAndBids)=> {
        const order = new Order()
        order.id = asksAndBids.globalId 
        order.mint = asksAndBids.primaryEntity
        order.treasuryMint = EntityType.SolanaTreasuryMint
        order.wallet = asksAndBids.id
        order.txHash = asksAndBids.data.signature
        order.qty = 1
        order.price = asksAndBids.data.price / LAMPORTS_PER_SOL
        order.side = (asksAndBids.type === EntityType.AskOrderState) ? Order.ASK : Order.BID
        order.isActive = asksAndBids.data.active

        return order
      })
      const result: { asks: Order[]; bids: Order[] } = {
        asks: orders.filter((order: Order) => order.side === Order.ASK),
        bids: orders.filter((order: Order) => order.side === Order.BID),
      };

      // seller validation
      if (result.asks.length > 0) {
        const ask = result.asks[0];
        const wallet = new PublicKey(ask.wallet);
        const mint = new PublicKey(ask.mint);
        const isNative = mint.equals(NATIVE_MINT);

        const tokenAmount = await getTokenAmount(
          connection,
          isNative
            ? wallet
            : (
                await AuctionHouseProgram.findAssociatedTokenAccountAddress(
                  mint,
                  wallet
                )
              )[0],
          mint
        );

        // if seller is not owner of NFT, set asks in off-chain database inactive
        if (!tokenAmount) {
          // update all in parallel
          await Promise.all(
            result.asks.map((order) => {
              order.isActive = false;
              return ddbmapper.update(order);
            })
          );

          // remove invalid asks from result
          result.asks = [];
        }
      }

      res.send(result);
    } catch (err) {
      next(err);
    }
  }
}
