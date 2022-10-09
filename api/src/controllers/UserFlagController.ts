import createError from "http-errors";
import { Request, Response, NextFunction } from "express";

import { ddbmapper } from "../services/dynamodb";
import { UserFlag, StaleFlag } from "../helpers/types";

import { UserFlagEntity } from "../entity/UserFlagEntity";
import { UserStaleFlagEntity } from "../entity/UserStaleFlagEntity";
import { EntityType } from "../../../shared/src/types";
import { NFT4CollectionEntity } from "../../../shared/src/entity/NFT4CollectionEntity";
import { equals } from "@aws/dynamodb-expressions";

export type FlagRequest = {
  wallet: string;
  reason: string;
};

// TODO: Extract common logic from these functions so that there's less code repetition
// FIXME post MVP we may want to change this, to allow user to update their existing flag
export default class UserFlagController {
  /**
   * This call must be gated by the verify token middleware
   *
   * adds new entry to the mint's user flag attribute
   *
   * @param req
   * @param res
   * @param next
   */
  static updateMintUserFlag(
    req: Request<Record<string, string>, Record<string, unknown>, FlagRequest>,
    res: Response,
    next: NextFunction
  ) {
    let mint = new UserFlagEntity();
    mint.id = req.params.id;
    mint.globalId = mint.id + "-" + EntityType.MintAddress;

    ddbmapper
          .get(mint)
          .then(async () => { 
            console.log("Mint does exist");
            checkIfUserFlaggedMintAlready();})
          .catch((err) => {
            console.log(
              `Mint does not exist: ${req.params.id}. Error: ${JSON.stringify(err)}`
            );
            next(new createError.NotFound("Mint does not exist"));
          });
    const checkIfUserFlaggedMintAlready = async () => {
      for await (const flaggedMint of ddbmapper.query(
        UserFlagEntity,
        { type: EntityType.UserFlag },
        {
          filter: {
            type: "And",
            conditions: [
              { ...equals(req.params.id), subject: "primaryEntity" },
              { ...equals(req.body.wallet), subject: "data.wallet" },
            ],
          },
          indexName: "typeIndex",
        }
      )) {
        console.log(`Locate mint flag successful for: ${req.params.id}`);
        next(new createError.Forbidden("User has already flagged the mint"));
        return;
      }

      const newFlaggedMintToPersist = new UserFlagEntity();
      const data: UserFlag = {
        wallet: req.body.wallet,
        reason: req.body.reason,
        datetime: new Date().toISOString(),
      };
      newFlaggedMintToPersist.populate(data, req.params.id);
      ddbmapper
        .put(newFlaggedMintToPersist)
        .then(() => {
          console.log("Flag successfully added");
        })
        .catch((err) => {
          console.log(`Flag adding error`);
          next(new createError.InternalServerError(err));
        });
      res.send({
        success: true,
      });
    };
  }

  /**
   * Adds new entry to the collection's user flag attribute.
   * This call must be gated by the verify token middleware.
   *
   * @param req
   * @param res
   * @param next
   */
  static updateCollectionUserFlag(
    req: Request<Record<string, string>, Record<string, unknown>, FlagRequest>,
    res: Response,
    next: NextFunction
  ) {
    let collectionIsAlreadyFlagged = false;
    let collectionExists = false;
    const checkDoesCollectionExist = async () => {
      for await (const collection of ddbmapper.query(
        NFT4CollectionEntity,
        { type: EntityType.NFT4Collection },
        {
          filter: {
            type: "And",
            conditions: [
              { ...equals(req.params.id), subject: "primaryEntity" },
            ],
          },
          indexName: "typeIndex",
        }
      )) {
        console.log("Collection does exist");
        collectionExists = true;
        break;
      }

      if (collectionExists) {
        checkIfUserFlaggedCollectionAlready();
      } else {
        console.log(
          `Collection with blockchain address ${req.params.id} does not exists`
        );
        next(new createError.NotFound("Collection does not exists"));
      }
    };
    const checkIfUserFlaggedCollectionAlready = async () => {
      for await (const flaggedCollection of ddbmapper.query(
        UserFlagEntity,
        { type: EntityType.UserFlag },
        {
          filter: {
            type: "And",
            conditions: [
              { ...equals(req.params.id), subject: "primaryEntity" },
              { ...equals(req.body.wallet), subject: "data.wallet" },
            ],
          },
          indexName: "typeIndex",
        }
      )) {
        console.log(`Locate collection flag successful for: ${req.params.id}`);
        next(
          new createError.Forbidden("User has already flagged the collection")
        );
        collectionIsAlreadyFlagged = true;
        break;
      }

      if (!collectionIsAlreadyFlagged) {
        const newFlaggedCollectionToPersist = new UserFlagEntity();
        const data: UserFlag = {
          wallet: req.body.wallet,
          reason: req.body.reason,
          datetime: new Date().toISOString(),
        };
        newFlaggedCollectionToPersist.populate(data, req.params.id);
        ddbmapper
          .put(newFlaggedCollectionToPersist)
          .then(() => {
            console.log("Flag successfully added");
          })
          .catch((err) => {
            console.log(`Flag adding error`);
            next(new createError.InternalServerError(err));
          });
        res.send({
          success: true,
        });
      }
    };

    checkDoesCollectionExist();
  }

  /**
   * Adds new entry to the mint's user stale flag attribute
   * This call must be gated by the verify token middleware.
   *
   * @param req
   * @param res
   * @param next
   */
  static updateMintStaleFlag(
    req: Request<Record<string, string>, Record<string, unknown>>,
    res: Response,
    next: NextFunction
  ) {

    let mint = new UserStaleFlagEntity();
    mint.id = req.params.id;
    mint.globalId = mint.id + "-" + EntityType.MintAddress;

    ddbmapper
          .get(mint)
          .then(async () => { 
            console.log("Mint does exist");
            checkIfMintIsStaleFlaggedAlready();})
          .catch((err) => {
            console.log(
              `Mint does not exist: ${req.params.id}. Error: ${JSON.stringify(err)}`
            );
            next(new createError.NotFound("Mint does not exist"));
          });
    const checkIfMintIsStaleFlaggedAlready = async () => {
      for await (const flaggedMint of ddbmapper.query(
        UserStaleFlagEntity,
        { type: EntityType.StaleFlag },
        {
          filter: {
            type: "And",
            conditions: [
              { ...equals(req.params.id), subject: "primaryEntity" },
            ],
          },
          indexName: "typeIndex",
        }
      )) {
        console.log(`Locate mint flag successful for: ${req.params.id}`);
        next(new createError.Forbidden("Mint is already flagged as stale"));
        return;
      }

      const newFlaggedMintToPersist = new UserStaleFlagEntity();
      const data: StaleFlag = {
        datetime: new Date().toISOString(),
      };
      newFlaggedMintToPersist.populate(data, req.params.id);
      ddbmapper
        .put(newFlaggedMintToPersist)
        .then(() => {
          console.log("Flag successfully added");
        })
        .catch((err) => {
          console.log(`Flag adding error`);
          next(new createError.InternalServerError(err));
        });
      res.send({
        success: true,
      });
    };
  }

  /**
   * This call must be gated by the verify token middleware
   *
   * adds new entry to the collection's user flag attribute
   *
   * @param req
   * @param res
   * @param next
   */
  static updateCollectionStaleFlag(
    req: Request<Record<string, string>, Record<string, unknown>, FlagRequest>,
    res: Response,
    next: NextFunction
  ) {
    let collectionExists = false;
    const checkDoesCollectionExist = async () => {
      for await (const mint of ddbmapper.query(
        NFT4CollectionEntity,
        { type: EntityType.NFT4Collection },
        {
          filter: {
            type: "And",
            conditions: [
              { ...equals(req.params.id), subject: "primaryEntity" },
            ],
          },
          indexName: "typeIndex",
        }
      )) {
        console.log("Collection does exist");
        collectionExists = true;
        break;
      }

      if (collectionExists) {
        checkIfCollectionIsStaleFlaggedAlready();
      } else {
        console.log(
          `Collection with blockchain address ${req.params.id} does not exists`
        );
        next(new createError.NotFound("Collection does not exists"));
      }
    };
    const checkIfCollectionIsStaleFlaggedAlready = async () => {
      for await (const flaggedMint of ddbmapper.query(
        UserStaleFlagEntity,
        { type: EntityType.StaleFlag },
        {
          filter: {
            type: "And",
            conditions: [
              { ...equals(req.params.id), subject: "primaryEntity" },
            ],
          },
          indexName: "typeIndex",
        }
      )) {
        console.log(`Locate collection flag successful for: ${req.params.id}`);
        next(
          new createError.Forbidden("Collection is already flagged as stale")
        );
        return;
      }

      const newFlaggedMintToPersist = new UserStaleFlagEntity();
      const data: StaleFlag = {
        datetime: new Date().toISOString(),
      };
      newFlaggedMintToPersist.populate(data, req.params.id);
      ddbmapper
        .put(newFlaggedMintToPersist)
        .then(() => {
          console.log("Flag successfully added");
        })
        .catch((err) => {
          console.log(`Flag adding error`);
          next(new createError.InternalServerError(err));
        });
      res.send({
        success: true,
      });
    };

    checkDoesCollectionExist();
  }
}
