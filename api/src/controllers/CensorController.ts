import createError from "http-errors";
import { Request, Response, NextFunction } from "express";
import { ddbmapper } from "../services/dynamodb";

import { CensorData } from "../helpers/types";
import { AllowedCensors, EntityType } from "../../../shared/src/types";

import { CensorEntity } from "../entity/CensorEntity";
import { NFT4CollectionEntity } from "../../../shared/src/entity/NFT4CollectionEntity";
import {
  ConditionExpression,
  ConditionExpressionPredicate,
  equals,
} from "@aws/dynamodb-expressions";
import _ from "lodash";

export type ReadCensorRequest = {
  wallet: string;
  severity: string;
};

export type RemoveCensorRequest = {
  wallet: string;
  type: string;
};

export type UpdateCensorRequest = {
  wallet: string;
  severity: string;
};

export default class CensorController {
  /**
   * This call must be gated by the verify token middleware
   * This call must be gated by the verify authorization middleware
   *
   * updates the mint's censorship state
   *
   * @param req
   * @param res
   * @param next
   */
  static updateMintCensor(
    req: Request<
      Record<string, string>,
      Record<string, unknown>,
      UpdateCensorRequest
    >,
    res: Response,
    next: NextFunction
  ) {
    let mint = new CensorEntity();
    mint.id = req.params.id;
    mint.globalId = mint.id + "-" + EntityType.MintAddress;
    let newCensoredMint = new CensorEntity();
    let censorFound = false;
    if (!(req.body.severity in AllowedCensors)) {
      next(
        new createError.BadRequest(
          "Invalid censor. Allowed values for censor: [CENSORED, NSFW]"
        )
      );
    } else {
        ddbmapper
          .get(mint)
          .then(async () => { 
            console.log("Mint does exist");
            checkIfMintHasCensorAndPersist();})
          .catch((err) => {
            console.log(
              `Mint does not exist: ${req.params.id}. Error: ${JSON.stringify(err)}`
            );
            next(new createError.NotFound("Mint does not exist"));
          });
      const checkIfMintHasCensorAndPersist = async () => {
        for await (const censoredMint of ddbmapper.query(
          CensorEntity,
          { type: EntityType.CensorTag },
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
          console.log(
            `Locate collection censor successful for: ${req.params.id}`
          );
          censorFound = true;
          newCensoredMint = censoredMint;
          break;
        }

        if (!censorFound) {
          const newCensoredMintToPersist = new CensorEntity();
          const data: CensorData = {
            wallet: req.body.wallet,
            severity: req.body.severity,
            datetime: new Date().toISOString(),
          };
          newCensoredMintToPersist.populate(data, req.params.id);
          ddbmapper
            .put(newCensoredMintToPersist)
            .then(() => {
              console.log("Censor added censor");
            })
            .catch((err) => {
              console.log(`Censor adding error`);
              next(new createError.InternalServerError(err));
            });
          res.send({
            success: true,
          });
        } else if (newCensoredMint.data.severity !== req.body.severity) {
          newCensoredMint.data.severity = req.body.severity;
          newCensoredMint.updatedAt = new Date();
          ddbmapper
            .put(newCensoredMint)
            .then(() => {
              console.log("Censor added censor");
            })
            .catch((err) => {
              console.log(`Censor adding error`);
              next(new createError.InternalServerError(err));
            });
          res.send({
            success: true,
          });
        } else {
          next(new createError.Forbidden("Censor already exists for a mint"));
        }
      };
    }
  }

  /**
   * This call must be gated by the verify token middleware
   * This call must be gated by the verify authorization middleware
   *
   * updates the collection's censorship state
   *
   * @param req
   * @param res
   * @param next
   */
  static readCollectionCensor(
    req: Request<
      Record<string, string>,
      Record<string, unknown>,
      UpdateCensorRequest
    >,
    res: Response,
    next: NextFunction
  ) {
    let collectionDoesExist = false;
    const checkIfCollectionExists = async () => {
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
        collectionDoesExist = true;
        break;
      }
      if (collectionDoesExist) {
        checkIfCollectionHasCensor();
      } else {
        console.log("Collection does not exists");
        next(new createError.NotFound("Collection does not exists"));
      }
    };

    const checkIfCollectionHasCensor = async () => {
      for await (const censoredCollection of ddbmapper.query(
        CensorEntity,
        { type: EntityType.CensorTag },
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
        console.log(
          `Locate collection censor successful for: ${req.params.id}`
        );
        const response = {
          censorData: censoredCollection?.data,
        };
        res.send(response);
        return;
      }

      console.log("Collection does not have any censor");
      next(new createError.NotFound("Collection does not have any censor"));
    };

    checkIfCollectionExists();
  }

  /**
   * This call must be gated by the verify token middleware
   * This call must be gated by the verify authorization middleware
   *
   * removes the mint's censorship state for a given censorship type
   *
   * @param req
   * @param res
   * @param next
   */
  static removeMintCensor(
    req: Request<
      Record<string, string>,
      Record<string, unknown>,
      RemoveCensorRequest
    >,
    res: Response,
    next: NextFunction
  ) {
    {
      const mint = new CensorEntity();
      mint.globalId = req.params.id + "-" + EntityType.MintAddress;
      mint.id = req.params.id;
      ddbmapper
        .get(mint)
        .then(async () => {
          console.log(`Locate mint successful for: ${req.params.id}`);
          for await (const censoredMint of ddbmapper.query(
            CensorEntity,
            { type: EntityType.CensorTag },
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
            console.log(`Locate mint successful for: ${req.params.id}`);
            ddbmapper
              .delete(censoredMint)
              .then(() => {
                console.log("Mint successfully removed");
                res.send({
                  success: true,
                });
              })
              .catch((err) => {
                console.log(`Remove mint error`);
                next(new createError.InternalServerError(err));
              });
            return;
          }

          console.log("Mint does not have any censor");
          next(new createError.NotFound("Mint does not have any censor"));
        })
        .catch((err) => {
          console.log(
            `Mint does not exist: ${req.params.id}. Error: ${JSON.stringify(
              err
            )}`
          );
          next(new createError.NotFound("Mint does not exist"));
        });
    }
  }

  /**
   * This call must be gated by the verify token middleware
   * This call must be gated by the verify authorization middleware
   *
   * removes the collection's censorship state for a given censorship type
   *
   * @param req
   * @param res
   * @param next
   */
  static removeCollectionCensor(
    req: Request<
      Record<string, string>,
      Record<string, unknown>,
      RemoveCensorRequest
    >,
    res: Response,
    next: NextFunction
  ) {
    let collectionDoesExist = false;
    let censorFound = false;
    const listOfAssociatedMints = [];

    const checkIfCollectionExists = async () => {
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
        collectionDoesExist = true;
        break;
      }
      if (collectionDoesExist) {
        removeCensorForCollection();
      } else {
        console.log("Collection does not exists");
        next(new createError.NotFound("Collection does not exists"));
      }
    };

    const removeCensorForCollection = async () => {
      for await (const censoredCollection of ddbmapper.query(
        CensorEntity,
        { type: EntityType.CensorTag },
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
        console.log(
          `Locate collection censor successful for: ${req.params.id}`
        );
        censorFound = true;
        ddbmapper
          .delete(censoredCollection)
          .then(() => {
            console.log("Censor successfully removed for collection");
          })
          .catch((err) => {
            console.log(`Remove censor error`);
            next(new createError.InternalServerError(err));
          });
      }
      if (censorFound) {
        findAllAssoaciatedMints();
      } else {
        next(
          new createError.NotFound("Censor does not exist for a collection")
        );
      }
    };
    const findAllAssoaciatedMints = async () => {
      for await (const associatedMints of ddbmapper.query(
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
        listOfAssociatedMints.push(associatedMints.data);
      }
      removeCensorForAllAssociatedMints();
    };
    const removeCensorForAllAssociatedMints = async () => {
      const equalsExpressionPredicate: ConditionExpressionPredicate = {
        type: "Membership",
        values: listOfAssociatedMints,
      };
      const equalsExpression: ConditionExpression = {
        ...equalsExpressionPredicate,
        subject: "primaryEntity",
      };

      for await (const associatedMints of ddbmapper.query(
        CensorEntity,
        { type: EntityType.CensorTag },
        {
          filter: {
            type: "And",
            conditions: [{ ...equalsExpression }],
          },
          indexName: "typeIndex",
        }
      )) {
        ddbmapper
          .delete(associatedMints)
          .then(() => {
            console.log("Censor successfully removed");
          })
          .catch((err) => {
            console.log(`Remove mint error`);
            next(new createError.InternalServerError(err));
          });
      }
      res.send({
        success: true,
      });
    };

    checkIfCollectionExists();
  }

  /**
   * This call must be gated by the verify token middleware
   * This call must be gated by the verify authorization middleware
   *
   * reads / responds with the mint's censorship state
   *
   * @param req
   * @param res
   * @param next
   */
  static readMintCensor(
    req: Request<
      Record<string, string>,
      Record<string, unknown>,
      ReadCensorRequest
    >,
    res: Response,
    next: NextFunction
  ) {
    const mint = new CensorEntity();
    mint.id = req.params.id;
    mint.globalId = mint.id + "-" + EntityType.MintAddress;
    let censorExists = false;

    ddbmapper
      .get(mint)
      .then(async () => {
        console.log(`Locate mint successful for: ${req.params.id}`);
        for await (const censoredMint of ddbmapper.query(
          CensorEntity,
          { type: EntityType.CensorTag },
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
          console.log(`Locate mint successful for: ${req.params.id}`);
          const response = {
            censorData: censoredMint?.data,
          };
          censorExists = true;
          res.send(response);
          return;
        }

        console.log("Mint does not have any censor");
        next(new createError.NotFound("Mint does not have any censor"));
      })
      .catch((err) => {
        console.log(
          `Mint does not exist: ${req.params.id}. Error: ${JSON.stringify(err)}`
        );
        next(new createError.NotFound("Mint does not exist"));
      });
  }

  /**
   * This call must be gated by the verify token middleware
   * This call must be gated by the verify authorization middleware
   *
   * reads / responds with the collection's censorship state
   *
   * @param req
   * @param res
   * @param next
   */
  static updateCollectionCensor(
    req: Request<
      Record<string, string>,
      Record<string, unknown>,
      UpdateCensorRequest
    >,
    res: Response,
    next: NextFunction
  ) {
    let collectionDoesExist = false;
    let censorAlreadyExists = false;
    let idHelper: string;
    let dateHelper: Date;
    let censorIsDifferent = false;
    const listOfAssociatedMints = [];
    let listOfAssociatedMintsWithoutCensors = []
    if (!(req.body.severity in AllowedCensors)) {
      next(
        new createError.BadRequest(
          "Invalid censor. Allowed values for censor: [CENSORED, NSFW]"
        )
      );
    } else {
      const checkIfCollectionExists = async () => {
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
          collectionDoesExist = true;
          break;
        }

        if (collectionDoesExist) {
          addCensorToCollectionOrUpdateIt();
        } else {
          console.log("Collection does not exists");
          next(new createError.NotFound("Collection does not exists"));
        }
      };

      const addCensorToCollectionOrUpdateIt = async () => {
        for await (const censoredCollection of ddbmapper.query(
          CensorEntity,
          { type: EntityType.CensorTag },
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
          console.log(
            `Locate collection censor successful for: ${req.params.id}`
          );
          censorAlreadyExists = true;
          if (censoredCollection.data.severity !== req.body.severity) {
            idHelper = censoredCollection.id;
            dateHelper = censoredCollection.createdAt;
            censorIsDifferent = true;
          }
          break;
        }
        const addCensorToCollection = new CensorEntity();
        const data: CensorData = {
          wallet: req.body.wallet,
          severity: req.body.severity,
          datetime: new Date().toISOString(),
        };
        if (!censorAlreadyExists) {
          addCensorToCollection.populate(data, req.params.id);
          ddbmapper
            .put(addCensorToCollection)
            .then(() => {
              console.log("Censor added censor");
            })
            .catch((err) => {
              console.log(`Censor adding error`);
              next(new createError.InternalServerError(err));
            });

          findAllAssoaciatedMints();
        } else if (censorIsDifferent) {
          addCensorToCollection.populateWithoutChangingID(
            idHelper,
            data,
            req.params.id,
            dateHelper
          );
          ddbmapper
            .put(addCensorToCollection)
            .then(() => {
              console.log("Censor added censor");
            })
            .catch((err) => {
              console.log(`Censor adding error`);
              next(new createError.InternalServerError(err));
            });
          findAllAssoaciatedMints();
        } else {
          next(
            new createError.Forbidden("Censor already exists for a collection")
          );
        }
      };

      const findAllAssoaciatedMints = async () => {
        for await (const associatedMints of ddbmapper.query(
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
          listOfAssociatedMints.push(associatedMints.data);
        }

        addOrChangeCensorsForMints()
      };

      const addOrChangeCensorsForMints = async () => {
        const equalsExpressionPredicate: ConditionExpressionPredicate = {
          type: "Membership",
          values: listOfAssociatedMints,
        };
        const equalsExpression: ConditionExpression = {
          ...equalsExpressionPredicate,
          subject: "primaryEntity",
        };

        let listOfAssociatedMintsThatAlreadyHaveCensor = []
        for await (const associatedMints of ddbmapper.query(
          CensorEntity,
          { type: EntityType.CensorTag },
          {
            filter: {
              type: "And",
              conditions: [{ ...equalsExpression }],
            },
            indexName: "typeIndex",
          }
        )) {

          listOfAssociatedMintsThatAlreadyHaveCensor.push(associatedMints.primaryEntity)
          console.log("At least one mint exists");
          const newCensorMint = new CensorEntity();
          const data: CensorData = {
            wallet: req.body.wallet,
            severity: req.body.severity,
            datetime: new Date().toISOString(),
          };
          newCensorMint.populateWithoutChangingID(
            associatedMints.id,
            data,
            associatedMints.primaryEntity,
            associatedMints.createdAt
          );
          ddbmapper
            .put(newCensorMint)
            .then(() => {
              console.log("Censor added censor");
            })
            .catch((err) => {
              console.log(`Censor adding error`);
              next(new createError.InternalServerError(err));
            });
        }
        listOfAssociatedMintsWithoutCensors = _.difference(listOfAssociatedMints, listOfAssociatedMintsThatAlreadyHaveCensor);
        addCensorsForMints()
      };

      const addCensorsForMints = async () => {
        for (const mintsBlockchainAddress of listOfAssociatedMintsWithoutCensors) {
          const newCensorMint = new CensorEntity();
          const data: CensorData = {
            wallet: req.body.wallet,
            severity: req.body.severity,
            datetime: new Date().toISOString(),
          };
          newCensorMint.populate(data, mintsBlockchainAddress);
          ddbmapper
            .put(newCensorMint)
            .then(() => {
              console.log("Censor added censor");
            })
            .catch((err) => {
              console.log(`Censor adding error`);
              next(new createError.InternalServerError(err));
            });
        }
        const response = {
          success: true,
        };
        res.send(response);
      };

      checkIfCollectionExists();
    }
  }
}
