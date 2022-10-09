import { Router } from "express";
import { MintController } from "../controllers";

const router = Router();

/**
 * @openapi
 * /mint:
 *   get:
 *     description: get all mint details from entitydb
 *     tags: [Mint]
 *     parameters:
 *       - name: mintAddress
 *         description: mint address of NFT which user is requesting data for
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/MintDetails'
 */
router.get("/", MintController.getAggregatedMintDetails);

export default router;
