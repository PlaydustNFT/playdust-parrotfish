import createError from "http-errors";
import { Request, Response, NextFunction } from "express";
import {
  validateEmail,
  validateTwitterHandle,
  validateAttributeLength,
} from "../helpers/validator";
import {
  UserSizeConstraints,
  PUBLIC_USER_PROFILE_ATTRIBUTES,
} from "../helpers/constants";
import { PublicUserProfileResponse, UserProfileResponse, UserProfileUpsertRequest } from "../helpers/types";
import { hubspot } from "../services/hubspot";


/** TODO cleanup imports */
export default class UserProfileController {

  /**
   * Publicly exposed endpoint to get user profile data for a given wallet address
   * 
   * This only includes Wallet, Username & Bio
   * @param req
   * @param res
   * @param next
   */
  static async publicReadUserProfile(
    req: Request<
      Record<string, string>,
      Record<string, unknown>
    >,
    res: Response,
    next: NextFunction
  ) {
    const walletAddress = String(req.query.walletAddress);
    try {
      /** HubSpot:
       *    get user by wallet 
       *    projection: public attributes
       *    throw if lookup fails
       */
      const hubSpotData: PublicUserProfileResponse = await hubspot.getPublicUserProfile(walletAddress);
      res.send(hubSpotData);
    } catch (err) {
      console.log(err);
      next(new createError.NotFound("Failed to Locate User"));
    }
  }

  /**
   * Gated endpoint to read private user profile data for a given wallet address. 
   * 
   * @param req
   * @param res
   * @param next
   */
  static async readUserProfile(
    req: Request<
      Record<string, string>,
      Record<string, unknown>
    >,
    res: Response,
    next: NextFunction
  ) {
    const walletAddress = String(req.query.walletAddress);
    try {
      /** HubSpot:
       *    get user by wallet 
       *    projection: public attributes
       *    throw if lookup fails
       */
      const hubSpotData: UserProfileResponse = await hubspot.getPrivateUserProfile(walletAddress);
      res.send(hubSpotData)
    } catch (err) {
      console.log(`readUserProfile Failed: ${JSON.stringify(err)}`);
      next(new createError.NotFound("Failed to Locate User"));
    }
  }

  /**
   * Gated endpoint to update a user profile for a given wallet address. 
   * 
   * There are no minimum requirements for this request.
   * 
   * @param req
   * @param res
   * @param next
   */
  static async updateUserProfile(
    req: Request<
      Record<string, string>,
      Record<string, unknown>,
      UserProfileUpsertRequest 
    >,
    res: Response,
    next: NextFunction
  ) {
    try {
      const wallet = req.params.walletAddress;
      if (wallet === undefined) {
        throw new createError.BadRequest(`Missing Wallet Data`);
      }

      const updateRequest: UserProfileUpsertRequest = req.body;
      /** takes a UserProfileUpsertRequest */
      if (!hubspot.validate(updateRequest)) {
        throw new createError.BadRequest("Data validation failed");
      } else {
        /** throws if user profile creation fails */
        await hubspot.upsertUserProfile(wallet, updateRequest);
      }
      res.send({ success: true});
    }
    catch (err) {
      console.log(err);
      next(err);
    }
  }

  /**
   * Gated endpoint to delete a user profile for a given wallet address. 
   * 
   * All other data in the body will be ignored.
   * @param req 
   * @param res 
   * @param next 
   */
  static async deleteUserProfile(
    req: Request<
      Record<string, string>,
      Record<string, unknown>,
      UserProfileUpsertRequest 
    >,
    res: Response,
    next: NextFunction
  ) {
    try {
      const wallet = req.params.walletAddress;
      if (wallet === undefined) {
        throw new createError.BadRequest(`Missing Wallet Data`);
      }
      await hubspot.archiveUserProfile(wallet);
      res.send({success: true});
    }
    catch (err) {
      console.log(err);
      next(err);
    }
  }
}
