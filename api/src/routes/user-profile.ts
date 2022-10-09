import { Router } from "express";

import { UserProfileController } from "../controllers";

import passport from "../services/passport";

const router = Router();

/**
 * @openapi
 * /user-profile/public/read:
 *   get:
 *     description: Get publicly available user profile data
 *     tags: [UserProfile]
 *     parameters:
 *       - name: walletAddress
 *         description: wallet address of desired user profile to receive
 *         in: query
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Public user profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicUserProfileResponse'
 *       4XX:
 *         description: Not Found
 *       5XX:
 *         description: Too Many Results
 */
router.get("/public/read", UserProfileController.publicReadUserProfile);

/**
 *
 * Protected routes
 *
 **/
router.use(passport.authenticate("jwt", { session: false }));

/**
 * @openapi
 * /user-profile/read:
 *   get:
 *     description: Get private user profile data
 *     tags: [UserProfile]
 *     parameters:
 *       - name: walletAddress
 *         description: wallet address of desired user profile to receive
 *         in: query
 *         required: true
 *         type: string
 *     security:
 *       - bearerAuth: [refreshToken]
 *     responses:
 *       200:
 *         description: All available user profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfileResponse'
 *       4XX:
 *         description: Not Found
 *       5XX:
 *         description: Too Many Results
 */
router.get("/read/", UserProfileController.readUserProfile);
/**
 * @openapi
 * /user-profile/update/{walletAddress}:
 *   post:
 *     description: Update existing user profile
 *     tags: [UserProfile]
 *     parameters:
 *       - name: walletAddress
 *         description: wallet address of user profile to update
 *         in: path
 *         required: true
 *         type: string
 *     requestBody:
 *       description: a JSON object containing user profile data to update
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfileUpsertRequest'
 *     security:
 *       - bearerAuth: [refreshToken]
 *     responses:
 *       200:
 *         description: Simple status response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleStatusResponse'
 *       4XX:
 *         description: Invalid Request
 */
router.post("/update/:walletAddress", UserProfileController.updateUserProfile);
/**
 * @openapi
 * /user-profile/delete/{walletAddress}:
 *   post:
 *     description: Delete existing user profile
 *     tags: [UserProfile]
 *     parameters:
 *       - name: walletAddress
 *         description: wallet address of user profile to delete
 *         in: path
 *         required: true
 *         type: string
 *     requestBody:
 *       description: a JSON object containing user profile data to delete
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfileUpsertRequest'
 *     security:
 *       - bearerAuth: [refreshToken]
 *     responses:
 *       200:
 *         description: Simple status response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleStatusResponse'
 *       4XX:
 *         description: Invalid Request
 */
router.post("/delete/:walletAddress", UserProfileController.deleteUserProfile);

export default router;
