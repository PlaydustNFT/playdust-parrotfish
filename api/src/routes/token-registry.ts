import { Router } from "express";
import { TokenRegistryController } from "../controllers";

const router = Router();

/**
 * @openapi
 * /token-registry:
 *   get:
 *     description: get the Solana token registry
 *     tags: [Token Registry]
 *     responses:
 *       200:
 *         description:
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/TokenInfoMap'
 */
router.get("/", TokenRegistryController.getTokenRegistry);

/**
 * @openapi
 * /token-registry/:tokenAddress:
 *   get:
 *     description: get a specific token's info from the Solana token registry
 *     tags: [Token Registry]
 *     parameters:
 *       - name: tokenAddress
 *         description: token address that the user is requesting data for
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Token info was found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenInfo'
 *       404:
 *         description: Token info was not found
 */
router.get("/:tokenAddress", TokenRegistryController.getTokenInfo);

export default router;
