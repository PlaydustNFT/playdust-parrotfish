import { Router } from "express";

import { UserFlagController } from "../controllers";
import passport from "../services/passport";

const router = Router();

/**
 *
 * Routes protected by authentication
 *
 **/
router.use(passport.authenticate("jwt", { session: false }));

/**
 * @openapi
 * /user-flag/mint/{id}/stale:
 *   post:
 *     description: Endpoint for authenticated users to stale-flag an NFT.
 *     tags: [User Flag]
 *     parameters:
 *       - name: id
 *         description: id represents mintAddress
 *         in: path
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserFlagUpdate'
 *     responses:
 *       200:
 *         description: Mint successfully flagged as stale
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleStatusResponse'
 *       403:
 *         description: Mint is already flagged as stale
 *       404:
 *         description: Mint does not exist
 *       500:
 *         description: Internal server error database handling
 */
router.post("/mint/:id/stale", UserFlagController.updateMintStaleFlag);

/**
 * @openapi
 * /user-flag/collection/{id}/stale:
 *   post:
 *     description: Endpoint for authenticated users to stale-flag a collection
 *     tags: [User Flag]
 *     parameters:
 *       - name: id
 *         description: id represents collectionID
 *         in: path
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserFlagUpdate'
 *     responses:
 *       200:
 *         description: Collection is already flagged as stale
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleStatusResponse'
 *       403:
 *         description: Collection is already flagged as stale
 *       404:
 *         description: Collection does not exist
 *       500:
 *         description: Internal server error database handling
 */
router.post(
  "/collection/:id/stale",
  UserFlagController.updateCollectionStaleFlag
);

/**
 * @openapi
 * /user-flag/mint/{id}:
 *   post:
 *     description: Endpoint for authenticated users to flag an NFT.
 *     tags: [User Flag]
 *     parameters:
 *       - name: id
 *         description: id represents mintAddress
 *         in: path
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserFlagUpdate'
 *     responses:
 *       200:
 *         description: Mint successfully flagged
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleStatusResponse'
 *       403:
 *         description: Mint is already flagged
 *       404:
 *         description: Mint does not exist
 *       500:
 *         description: Internal server error database handling
 */
router.post("/mint/:id", UserFlagController.updateMintUserFlag);

/**
 * @openapi
 * /user-flag/collection/{id}:
 *   post:
 *     description: Endpoint for authenticated users to flag a collection
 *     tags: [User Flag]
 *     parameters:
 *       - name: id
 *         description: id represents collectionID
 *         in: path
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserFlagUpdate'
 *     responses:
 *       200:
 *         description: Collection successfully flagged
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleStatusResponse'
 *       403:
 *         description: Collection is already flagged
 *       404:
 *         description: Collection does not exist
 *       500:
 *         description: Internal server error database handling
 */
router.post("/collection/:id", UserFlagController.updateCollectionUserFlag);

export default router;
