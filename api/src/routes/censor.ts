import { Router } from "express";

import { AuthorizationController, CensorController } from "../controllers";
import passport from "../services/passport";

const router = Router();

/**
 * @openapi
 * /censor/mint/{id}:
 *   get:
 *     description: Prints the censor on a given mint
 *     tags: [Censor]
 *     parameters:
 *       - name: id
 *         description: id represents mintAddress
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Censor settings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CensorData'
 *       404:
 *         description: Mint does not exist
 */
router.get("/mint/:id", CensorController.readMintCensor);

/**
 * @openapi
 * /censor/collection/{id}:
 *   get:
 *     description: Prints the censor on a given collection
 *     tags: [Censor]
 *     parameters:
 *       - name: id
 *         description: id represents collectionID
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Censor settings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CensorData'
 *       404:
 *         description: Collection does not exist
 */
router.get("/collection/:id", CensorController.readCollectionCensor);

// /**
//  *
//  * Routes protected by authentication
//  *
//  **/
router.use(passport.authenticate("jwt", { session: false }));

/**
 * @openapi
 * /censor/mint/{id}:
 *   post:
 *     description: endpoint for authenticated & authorized admins to censor a mint
 *     tags: [Censor]
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
 *             $ref: '#/components/schemas/UpdateCensor'
 *     responses:
 *       200:
 *         description: Censor updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleStatusResponse'
 *       400:
 *         description: Invalid censor. Allowed values for censor are CENSORED and NSFW
 *       403:
 *         description: Censor already exists for a collection
 *       404:
 *         description: Collection does not exist
 *       500:
 *         description: Internal server error database handling
 */
router.post(
    "/mint/:id",
    AuthorizationController.verifyAdminRole,
    CensorController.updateMintCensor
);
 

/**
 * @openapi
 * /censor/collection/{id}:
 *   post:
 *     description: endpoint for authenticated & authorized admins to add/update censor on a collection
 *     tags: [Censor]
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
 *             $ref: '#/components/schemas/UpdateCensor'
 *     responses:
 *       200:
 *         description: Censor updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleStatusResponse'
 *       400:
 *         description: Invalid censor. Allowed values for censor are CENSORED and NSFW
 *       403:
 *         description: Censor already exists for a collection
 *       404:
 *         description: Collection does not exist
 *       500:
 *         description: Internal server error database handling
 */
router.post(
    "/collection/:id",
    AuthorizationController.verifyAdminRole,
    CensorController.updateCollectionCensor
);

/**
 * @openapi
 * /censor/mint/{id}/remove:
 *   post:
 *     description: endpoint for authenticated & authorized admins to remove a censor on a mint
 *     tags: [Censor]
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
 *             $ref: '#/components/schemas/RemoveCensor'
 *     responses:
 *       200:
 *         description: Censor updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleStatusResponse'
 *       404:
 *         description: Mint does not exist
 *       500:
 *         description: Internal server error database handling
 */
router.post(
    "/mint/:id/remove",
    AuthorizationController.verifyAdminRole,
    CensorController.removeMintCensor
);

/**
 * @openapi
 * /censor/collection/{id}/remove:
 *   post:
 *     description: endpoint for authenticated & authorized admins to remove a censor on a collection
 *     tags: [Censor]
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
 *             $ref: '#/components/schemas/RemoveCensor'
 *     responses:
 *       200:
 *         description: Censor updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleStatusResponse'
 *       404:
 *         description: Collection does not exist
 *       500:
 *         description: Internal server error database handling
 *         
 */
router.post(
    "/collection/:id/remove",
    AuthorizationController.verifyAdminRole,
    CensorController.removeCollectionCensor
);

export default router;
