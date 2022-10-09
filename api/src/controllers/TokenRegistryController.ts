import createError from "http-errors";
import { Request, Response, NextFunction } from "express";
import {
  ENV,
  Strategy,
  TokenInfo,
  TokenInfoMap,
  TokenListProvider,
} from "@solana/spl-token-registry";

// https://github.com/solana-labs/token-list/search?q=tree-shaking&type=issues

let cachedTokenRegistry: TokenInfoMap;

async function fetchTokenRegistry(env: ENV): Promise<TokenInfoMap> {

  if (cachedTokenRegistry) {
    return cachedTokenRegistry;
  }

  const tokens = await new TokenListProvider().resolve(Strategy.CDN);
  const tokenList = tokens
    .filterByChainId(env)
    .getList();

  const tokenRegistry = tokenList.reduce(
    (map: TokenInfoMap, item: TokenInfo) => {
      map.set(item.address, item);
      return map;
    },
    new Map()
  );

  cachedTokenRegistry = tokenRegistry;

  return tokenRegistry;
}

/**
 *
 *
 * @param req
 * @param res
 * @param next
 */
export async function getTokenRegistry(
  _req: Request<Record<string, string>, Record<string, unknown>>,
  res: Response,
  next: NextFunction
) {

  try {

    console.log(`Token registry`);

    const network = process.env.SOLANA_NETWORK || "mainnet-beta";

    if (network !== "mainnet-beta") {
      throw new createError.InternalServerError(`Unsupported network ${network}`);
    }

    const tokenRegistry = await fetchTokenRegistry(ENV.MainnetBeta);

    res.json(Object.fromEntries(tokenRegistry));
  }
  catch (err) {
    next(err);
  }
}

/**
 *
 *
 * @param req
 * @param res
 * @param next
 */
export async function getTokenInfo(
  req: Request<Record<string, string>, Record<string, unknown>>,
  res: Response,
  next: NextFunction
) {

  try {

    // Verify token address is present in query
    if (!req.params.tokenAddress) {
      const errorMessage = 'URL missing "tokenAddress" parameter, failed to get token info';
      throw new createError.PreconditionFailed(errorMessage);
    }

    // Get token address from query
    const tokenAddress = String(req.params.tokenAddress);

    console.log(`Getting token info for ${tokenAddress}`);

    const network = process.env.SOLANA_NETWORK || "mainnet-beta";

    if (network !== "mainnet-beta") {
      throw new createError.InternalServerError(`Unsupported network ${network}`);
    }

    const tokenRegistry = await fetchTokenRegistry(ENV.MainnetBeta);

    const tokenInfo = tokenRegistry.get(tokenAddress);

    if (tokenInfo) {
      res.json(tokenInfo);
    }

    throw new createError.NotFound(`Failed to find token info for ${tokenAddress}`);
  }
  catch (err) {
    next(err);
  }
}
