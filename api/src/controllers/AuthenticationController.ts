import crypto from "crypto";
import base58 from "bs58";
import { sign } from "tweetnacl";
import jwt, {
  JwtPayload,
  SignOptions as JwtSignOptions,
} from "jsonwebtoken";
import createError from "http-errors";
import { Request, Response, NextFunction } from "express";
import { ddbmapper } from "../services/dynamodb";
import { EntityType, NonceEntityData } from "../../../shared/src/types";
import { buildNonceEntityGlobalId, extractWalletFromToken } from "../../../shared/src/util";
import { NonceEntity } from "../entity/NonceEntity";

export const JWT_ISSUER = process.env.JWT_ISSUER || "api.playdust.dev";
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "playdust.dev";
export const JWT_ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || "pl@ydu$t_acc3$$_t0k3n_S3CR3T";

export const JWT_ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_TOKEN_TTL || "15m";
export const NONCE_TTL_SECONDS: number = Number(process.env.NONCE_TTL_SECONDS) || 60; // this must be a number in seconds

export const TOKEN_VERIFICATION_FAILED_PREFIX = "Token Verification Failed: ";
export const NONCE_CREATION_FAILED_PREFIX = "Nonce Creation Failed: ";

export const jwtAccessTokenSignOpts: JwtSignOptions = {
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
  expiresIn: JWT_ACCESS_TOKEN_TTL,
};

export type PlaydustJwtPayload = {
  wallet: string;//TODO: rename publicKey
};

/** -- Token -- **/
export type AuthTokenCreateRequest = {
  wallet: string;//TODO: rename publicKey
  nonce?: string;
  message?: string;
};

export type AuthTokenCreateResponse = {
  accessToken?: string;
};

/** -- Nonce -- **/
export type NonceRequest = {
  wallet: string;
};

export type NonceResponse = {
  nonce: string;
};

export default class AuthenticationController {

  /**
   * Generate Nonce
   * This method is used to generate a nonce for a wallet which acts as a random message which the wallet can sign to prove private key ownership.
   * 
   * The nonce is created with a TTL and is stored in the database.
   * 
   * Nonce can only be used once and must be used within the TTL. Nonce will be deleted from the DB upon being used.
   * 
   * @param req JSON object matching NonceRequest structure
   * @param res 417 if missing required data, otherwise NonceResponse object
   * @param next next middleware function in the processing chain
   */
  static async generateNonce(
    req: Request<Record<string, string>, Record<string, unknown>, NonceRequest>,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.body.wallet) {
        throw new createError.ExpectationFailed(NONCE_CREATION_FAILED_PREFIX+"Missing Required Data");
      }
      const generatedNonce: string = crypto.randomBytes(32).toString("hex");
      const expireTime: number = Date.now() + (1000 * NONCE_TTL_SECONDS);
      const entityData: NonceEntityData = new NonceEntityData(generatedNonce, expireTime);

      const entity: NonceEntity = new NonceEntity();
      entity.populate(entityData, req.body.wallet);
      await ddbmapper.put(entity);

      res.send({nonce: generatedNonce});
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verify Signature
   * This method is used to verify that client which generated the request has access to the private key of the associated wallet.
   * 
   * This method is the required primary gatekeeper for every login attempt and user profile modification attempt
   * 
   * @param req HTTP request including AuthRequest
   * @param res no response if signature verification successful, otherwise 401
   * @param next next middleware function in the processing chain
   */
  static async verifySignature(
    req: Request<Record<string, string>, Record<string, unknown>, AuthTokenCreateRequest>,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.body.wallet || !req.body.nonce || !req.body.message) {
        throw new createError.Unauthorized("Missing Required Data");
      }

      const wallet = req.body.wallet;
      const nonce = req.body.nonce;
      const message = req.body.message;

      if (wallet === undefined || nonce === undefined || message === undefined) {
        throw new createError.BadRequest(`Missing Data For Wallet Ownership Verification`);
      }

      AuthenticationController.verifyWalletOwnership(wallet, nonce, message);

      delete req.body.message;
      delete req.body.nonce;

      next();
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create Access Token Refresh Token Pair
   * This method is used to create an AccessToken pair for the public key provided in the http body.
   * 
   * The AccessToken has a lifetime of JWT_ACCESS_TOKEN_LIFETIME
   * 
   * The AcccessToken is created using the JWT_ACCESS_TOKEN_SECRET (seed)
   * 
   * This method should only be called once it's verified that the user owns the wallet (a.k.a verifySignature _must_ always be called before this method)
   * 
   * @param req HTTP request including AuthRequest
   * @param res AuthTokenPair instance
   * @param next next middleware function in the processing chain (or null)
   */
  static async createAccessToken(
    req: Request<Record<string, string>, Record<string, unknown>, AuthTokenCreateRequest>,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.body.wallet) {
        throw new Error("Invalid request, missing required data");
      }

      let tokenPair: AuthTokenCreateResponse = {};
      tokenPair.accessToken = jwt.sign(req.body, JWT_ACCESS_TOKEN_SECRET, jwtAccessTokenSignOpts);

      console.log(`Sending access token response: ${JSON.stringify(tokenPair)}`);
      res.send(tokenPair);
    }
    catch (err) {
      next(new createError.InternalServerError("Failed to generate token: "+err.message));
    }
  }

  static async verifyWalletOwnership(
    wallet: string,
    nonce: string,
    message: string,
  ) {
      const walletUint8 = base58.decode(wallet);
      const signedNonceUint8 = base58.decode(message);
      const nonceUint8 = new TextEncoder().encode(nonce);

      // verify signed message
      if (!sign.detached.verify(nonceUint8, signedNonceUint8, walletUint8)) {
        throw new createError.Unauthorized("Failed To Verify Signature");
      }

      // verify valid nonce
      await AuthenticationController.verifyValidNonce(wallet, nonce);
  }

  static async verifyValidNonce(
    wallet: string,
    nonce: string,
  ) {
    const entity: NonceEntity = new NonceEntity();
    entity.globalId = buildNonceEntityGlobalId(EntityType.NonceEntity, nonce);
    await ddbmapper.get(entity)
      .then( async (item) => {
        if (item.id !== wallet) {// verify the id against the wallet
          throw new createError.Unauthorized("Nonce Invalid For Wallet");
        }
        if (Date.now() >= item.data.expireTime) {// verify not expired
          throw new createError.Unauthorized("Nonce Expired");
        }
        // delete item from db
        await ddbmapper.delete(item);
      })
      .catch((err) => {
        throw new createError.Unauthorized("Failed To Locate Nonce");
      });
  }
}
