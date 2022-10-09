import { Router, Request, Response } from "express";

import { ErrorController } from "../controllers";

import auctionHouse from "./auction-house";
import authentication from "./authentication";
import userProfile from "./user-profile";
import trading from "./trading";
import censor from "./censor";
import userFlag from "./user-flag";
import mint from "./mint";
import tokenRegistry from "./token-registry";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     AuctionHouse:
 *       type: object
 *       properties:
 *         treasuryMint:
 *           type: string
 *         authority:
 *           type: string
 *         creator:
 *           type: string
 *         auctionHouseFeeAccount:
 *           type: string
 *         auctionHouseTreasury:
 *           type: string
 *         feeWithdrawalDestination:
 *           type: string
 *         treasuryWithdrawalDestination:
 *           type: string
 *         sellerFeeBasisPoints:
 *           type: number
 *         canChangeSalePrice:
 *           type: boolean
 *     Escrow:
 *       type: object
 *       properties:
 *         amount:
 *           type: number
 *     CensorData:
 *       type: object
 *       properties:
 *         severity:
 *           type: string
 *           description: Allowed values are 'CENSORED' and 'NSFW'
 *         datetime:
 *           type: string
 *         wallet:
 *           type: string
 *     UpdateCensor:
 *       type: object
 *       properties:
 *           wallet:
 *             type: string
 *           severity:
 *             type: string
 *             description: Allowed values are 'CENSORED' and 'NSFW'
 *     RemoveCensor:
 *       type: object
 *       properties:
 *           wallet:
 *             type: string
 *     UserFlagUpdate:
 *       type: object
 *       properties:
 *           wallet:
 *             type: string
 *           reason:
 *             type: string
 *     ConfirmOrder:
 *       description: request body
 *       type: object
 *       properties:
 *         wallet:
 *           type: string
 *           default: 4yMfRHP8T5c54sm8NFT2euvNpir2TsSukS5GK8Y9h7wg
 *         mint:
 *           type: string
 *           default: LN1BZi5KKAhGooRa7Pjqtq7UpSVT8LK1sYT8RBEqMfB
 *         buyPrice:
 *           type: number
 *           default: 10
 *         tokenSize:
 *           type: number
 *           default: 1
 *         txHash:
 *           type: string
 *           default: x7GkNddyzwnSCwWswtZ6nDHn7AmVweDMz9PyNfwqopx5jqzkWioqXMgdnowPAfVzAowfY2QK5QR44CoZhtBk5UX
 *         side:
 *           type: string
 *           default: bid
 *     Order:
 *       description: request body
 *       type: object
 *       properties:
 *         wallet:
 *           type: string
 *           default: 4yMfRHP8T5c54sm8NFT2euvNpir2TsSukS5GK8Y9h7wg
 *         mint:
 *           type: string
 *           default: LN1BZi5KKAhGooRa7Pjqtq7UpSVT8LK1sYT8RBEqMfB
 *         buyPrice:
 *           type: number
 *           default: 10
 *         tokenSize:
 *           type: number
 *           default: 1
 *     AcceptBid:
 *       description: request body
 *       type: object
 *       properties:
 *         sellerWallet:
 *           type: string
 *           default: Ezc7PsRcSGDR9GknuWgaN78aUDUt5n3CjBxkFG9xZgFM
 *         buyerWallet:
 *           type: string
 *           default: DsuAk9sXGN2d8mMG12Wwjqibv6adX8DUaWSdDnDkwJZS
 *         mint:
 *           type: string
 *           default: FDTDyEFBikWKCq5XyyaiBCJ7NAkUKymFcb5YLkU4ewt8
 *         previousAskPrice:
 *           type: number
 *           default: 10
 *         buyPrice:
 *           type: number
 *           default: 5
 *         tokenSize:
 *           type: number
 *           default: 1
 *     Withdraw:
 *       description: request body
 *       type: object
 *       properties:
 *         wallet:
 *           type: string
 *           default: 4yMfRHP8T5c54sm8NFT2euvNpir2TsSukS5GK8Y9h7wg
 *         amount:
 *           type: number
 *           default: 10
 *     Market:
 *       type: object
 *       properties:
 *         auctionHouse:
 *           type: string
 *         tokenSymbol:
 *           type: string
 *     TokenSymbol:
 *       type: object
 *       properties:
 *         tokenSymbol:
 *           type: string
 *     OrderItem:
 *       type: object
 *       properties:
 *         auctionHouse:
 *           type: string
 *         wallet:
 *           type: string
 *         txHash:
 *           type: string
 *         qty:
 *           type: number
 *         price:
 *           type: number
 *         side:
 *           type: string
 *         market:
 *           $ref: '#/components/schemas/TokenSymbol'
 *     AuthTokenCreateRequest:
 *       type: object
 *       properties:
 *         wallet:
 *           type: string
 *         nonce:
 *           type: string
 *         message:
 *           type: string
 *     AuthTokenCreateResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *     NonceRequest:
 *       type: object
 *       properties:
 *         wallet:
 *           type: string
 *     NonceResponse:
 *       type: object
 *       properties:
 *         nonce:
 *           type: string
 *     SimpleStatusResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *     UserProfileUpsertRequest:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *         bio:
 *           type: string
 *         profilePictureMintAddress:
 *           type: string
 *         twitterUsername:
 *           type: string
 *         discordUsername:
 *           type: string
 *         email:
 *           type: string
 *     PublicUserProfileResponse:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *         bio:
 *           type: string
 *         profilePictureMintAddress:
 *           type: string
 *         isAdmin:
 *           type: string
 *         isWhitelisted:
 *           type: string
 *     UserProfileResponse:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *         bio:
 *           type: string
 *         profilePictureMintAddress:
 *           type: string
 *         twitterUsername:
 *           type: string
 *         discordUsername:
 *           type: string
 *         email:
 *           type: string
 *     Uint8Array:
 *       type: array
 *       items:
 *         type: number
 *     MintDetails:
 *       type: object
 *       properties:
 *         mintOffChainMetadata:
 *           $ref: '#/components/schemas/OffChainMetadata'
 *         mintOnChainMetadata:
 *           $ref: '#/components/schemas/Metadata'
 *         mintRarity:
 *           $ref: '#/components/schemas/NFTRarityData'
 *         playdustCollection:
 *           $ref: '#/components/schemas/PlaydustCollectionData'
 *         collectionMetadata:
 *           $ref: '#/components/schemas/CollectionMetaData'
 *         collectionPriceData:
 *           $ref: '#/components/schemas/CollectionPriceData'
 *         collectionAttributeData:
 *           $ref: '#/components/schemas/CollectionAttributeData'
 *         mintBids:
 *           $ref: '#/components/schemas/OrderStateEntityData'
 *         mintAsks:
 *           $ref: '#/components/schemas/OrderStateEntityData'
 *     OrderStateEntityData:
 *       type: object
 *       properties:
 *         active:
 *           type: boolean
 *         price:
 *           type: number
 *         marketplace:
 *           type: string
 *         blockTime:
 *           type: number
 *         signature:
 *           type: string
 *     OffChainMetadata:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         symbol:
 *           type: string
 *         description:
 *           type: string
 *         seller_fee_basis_points:
 *           type: number
 *         image:
 *           type: string
 *         animation_url:
 *           type: string
 *         external_url:
 *           type: string
 *         attributes:
 *           type: array
 *         collection:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             family:
 *               type: string
 *     Metadata:
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *         updateAuthority:
 *           type: string
 *         mint:
 *           type: string
 *         data:
 *           type: string
 *         primarySaleHappened:
 *           type: boolean
 *         isMutable:
 *           type: boolean
 *         editionNonce:
 *           type: number
 *         token_standard:
 *           type: string
 *         collection:
 *           type: string
 *         uses:
 *           type: string
 *         masterEdition:
 *           type: string
 *         edition:
 *           type: string
 *     NFTRarityData:
 *       type: object
 *       properties:
 *         mint:
 *           type: number
 *         statisticalRarity:
 *           type: number
 *         normalizedStatisticalRarity:
 *           type: number
 *         rarityScore:
 *           type: number
 *         normalizedRarityScore:
 *           type: number
 *         experimentalScore:
 *           type: number
 *     PlaydustCollectionData:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *     CollectionMetaData:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         string:
 *           type: string
 *         elementCount:
 *           type: number
 *         updateAuthority:
 *           type: string
 *         creator:
 *           type: string
 *         description:
 *           type: string
 *         family:
 *           type: string
 *         image:
 *           type: string
 *     CollectionPriceData:
 *       type: object
 *       properties:
 *         volume:
 *           type: object
 *         floorPrice:
 *           type: object
 *         ceilingPrice:
 *           type: object
 *     CollectionAttributeData:
 *       type: array
 *     TokenExtensions:
 *       properties:
 *         website:
 *           title: TokenExtensions.website
 *           type: string
 *         bridgeContract:
 *           title: TokenExtensions.bridgeContract
 *           type: string
 *         assetContract:
 *           title: TokenExtensions.assetContract
 *           type: string
 *         address:
 *           title: TokenExtensions.address
 *           type: string
 *         explorer:
 *           title: TokenExtensions.explorer
 *           type: string
 *         twitter:
 *           title: TokenExtensions.twitter
 *           type: string
 *         github:
 *           title: TokenExtensions.github
 *           type: string
 *         medium:
 *           title: TokenExtensions.medium
 *           type: string
 *         tgann:
 *           title: TokenExtensions.tgann
 *           type: string
 *         tggroup:
 *           title: TokenExtensions.tggroup
 *           type: string
 *         discord:
 *           title: TokenExtensions.discord
 *           type: string
 *         serumV3Usdt:
 *           title: TokenExtensions.serumV3Usdt
 *           type: string
 *         serumV3Usdc:
 *           title: TokenExtensions.serumV3Usdc
 *           type: string
 *         coingeckoId:
 *           title: TokenExtensions.coingeckoId
 *           type: string
 *         imageUrl:
 *           title: TokenExtensions.imageUrl
 *           type: string
 *         description:
 *           title: TokenExtensions.description
 *           type: string
 *       additionalProperties: false
 *       title: TokenExtensions
 *       type: object
 *     TokenInfo:
 *       properties:
 *         chainId:
 *           title: TokenInfo.chainId
 *           type: number
 *         address:
 *           title: TokenInfo.address
 *           type: string
 *         name:
 *           title: TokenInfo.name
 *           type: string
 *         decimals:
 *           title: TokenInfo.decimals
 *           type: number
 *         symbol:
 *           title: TokenInfo.symbol
 *           type: string
 *         logoURI:
 *           title: TokenInfo.logoURI
 *           type: string
 *         tags:
 *           items:
 *             title: TokenInfo.tags.[]
 *             type: string
 *           title: TokenInfo.tags
 *           type: array
 *         extensions:
 *           $ref: '#/components/schemas/TokenExtensions'
 *           title: TokenInfo.extensions
 *       required:
 *         - chainId
 *         - address
 *         - name
 *         - decimals
 *         - symbol
 *       additionalProperties: false
 *       title: TokenInfo
 *       type: object
 *     TokenInfoMap:
 *       type: object
 *       additionalProperties:
 *         $ref: '#/components/schemas/TokenInfo'
 */

/**
 * @openapi
 * /ping:
 *   get:
 *     description: Health check
 *     tags: [Ping]
 *     responses:
 *       200:
 *         description:
 */
router.get("/ping", (req: Request, res: Response) => {
  res.send();
});

// Mint module
router.use("/mint", mint);

// AH module
router.use("/auction-house", auctionHouse);

// Trading module
router.use("/trading", trading);

// Authentication module
router.use("/authentication", authentication);

// User profile module
router.use("/user-profile", userProfile);

// Censorship module
router.use("/censor", censor);

// User flag module
router.use("/user-flag", userFlag);

// Token registry module
router.use("/token-registry", tokenRegistry);

// Error handler
router.use(ErrorController.notFound);
router.use(ErrorController.handle);

export default router;
