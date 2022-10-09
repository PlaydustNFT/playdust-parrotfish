import {
  Cluster,
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, Token, NATIVE_MINT } from "@solana/spl-token";
import { AuctionHouseProgram } from "@metaplex-foundation/mpl-auction-house";
import {
  Metadata,
  MetadataData,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  getPriceWithMantissa,
  getTokenAmount,
  getTreasuryMintKey,
  getRemainingAccounts,
  serializeRawTransactionWithSigners,
} from "./utils";
import { TransactionHashAndBlockTime } from "../../../shared/src/types";

const authorityPublicKey = new PublicKey(process.env.AH_AUTHORITY_PUBLIC_KEY || "8yZ4ecDWmLLmwEHihmu3tKNw38ot7DVgsWbG55TkGxCW");
// for testing on devnet use "2iWiYia5q5tFaiubDPH1JvXtDe7XHbEdxXNayBh7D4k8"

//for testing purpose
const sellerKeypair = Keypair.fromSecretKey(
  new Uint8Array(
    (
      (process.env.AH_SELLER_KEY_TEST as string) ||
      // Ezc7PsRcSGDR9GknuWgaN78aUDUt5n3CjBxkFG9xZgFM devnet
      // "55,102,63,67,79,174,111,161,248,40,29,88,220,146,27,230,39,189,47,143,69,159,156,124,133,79,129,174,67,243,11,165,207,233,188,69,240,133,58,209,98,148,155,37,117,94,231,213,247,228,103,222,137,179,204,80,39,90,139,77,124,67,29,236"
      // HnHpFJoXbdA277tPc8SraBpYjxaezAc88yZGV1935FUT mainnet
      "185,18,178,35,2,146,153,164,239,45,175,70,61,185,1,108,75,173,185,94,10,72,88,205,44,73,39,235,152,109,122,111,249,85,35,185,246,211,1,18,17,177,15,197,53,11,136,165,139,110,242,217,134,74,100,242,173,62,130,80,52,195,10,240"
    )
      .split(",")
      .map((item) => parseInt(item))
  )
);

//for testing purpose
const buyerKeypair = Keypair.fromSecretKey(
  new Uint8Array(
    (
      (process.env.AH_BUYER_KEY_TEST as string) ||
      // DsuAk9sXGN2d8mMG12Wwjqibv6adX8DUaWSdDnDkwJZS devnet
      //"212,68,21,106,250,1,43,109,12,249,27,149,2,190,217,253,22,47,10,150,202,217,170,227,115,179,105,131,248,60,186,168,191,86,69,38,81,171,92,25,177,140,148,69,107,187,5,239,135,144,119,24,146,174,239,105,249,143,59,159,107,49,49,157"
      // 2QwwLzVvRKiG8EALUyKFxaujxgwKTET59heW211NasaL mainnet
      "99,245,2,149,248,159,96,185,180,61,126,46,15,227,51,159,151,38,38,49,50,154,126,238,105,31,69,242,186,69,201,32,20,254,41,184,157,108,249,203,162,57,212,166,172,224,184,46,89,72,78,87,78,237,105,77,146,230,22,83,50,19,51,141"
    )
      .split(",")
      .map((item) => parseInt(item))
  )
);

const network = process.env.SOLANA_NETWORK || "mainnet-beta";
const rpcUrl =
  process.env.SOLANA_CUSTOM_RPC_URL || clusterApiUrl(network as Cluster);

export const connection = new Connection(rpcUrl, {commitment: 'confirmed',confirmTransactionInitialTimeout:300000});

// inspect auction house
export const showAction = async (treasuryMint?: string) => {
  const treasuryMintKey = getTreasuryMintKey(treasuryMint);
  const [auctionHouseKey] = await AuctionHouseProgram.findAuctionHouseAddress(
    authorityPublicKey,
    treasuryMintKey
  );

  const auctionHouse =
    await AuctionHouseProgram.accounts.AuctionHouse.fromAccountAddress(
      connection,
      auctionHouseKey
    );

  console.debug(
    "Fee payer account:",
    auctionHouse.auctionHouseFeeAccount.toBase58()
  );

  return auctionHouse.pretty();
};

// inspect escrow amount
export const showEscrowAction = async (
  wallet: string,
  treasuryMint?: string
) => {
  const walletKey = new PublicKey(wallet);
  const treasuryMintKey = getTreasuryMintKey(treasuryMint);
  const [auctionHouseKey] = await AuctionHouseProgram.findAuctionHouseAddress(
    authorityPublicKey,
    treasuryMintKey
  );
  const [escrowPaymentAccount] =
    await AuctionHouseProgram.findEscrowPaymentAccountAddress(
      auctionHouseKey,
      walletKey
    );

  return getTokenAmount(connection, escrowPaymentAccount, treasuryMintKey);
};

// ask for NFT
export const askAction = async (
  treasuryMint: string,
  sellerWallet: string,
  mint: string,
  buyPrice: number,
  tokenSize: number,
  buyerWallet?: string
) => {
  const sellerWalletKey = new PublicKey(sellerWallet);
  const mintKey = new PublicKey(mint);
  const treasuryMintKey = getTreasuryMintKey(treasuryMint);
  const [
    buyPriceAdjusted,
    tokenSizeAdjusted,
    tokenAccounts,
    metadataKey,
    [tokenAccountKey],
    [auctionHouseKey],
    [programAsSigner, programAsSignerBump],
  ] = await Promise.all([
    getPriceWithMantissa(buyPrice, treasuryMintKey, connection),
    getPriceWithMantissa(tokenSize, mintKey, connection),
    connection.getTokenLargestAccounts(mintKey),
    Metadata.getPDA(mintKey),
    AuctionHouseProgram.findAssociatedTokenAccountAddress(
      mintKey,
      sellerWalletKey
    ),
    AuctionHouseProgram.findAuctionHouseAddress(
      authorityPublicKey,
      treasuryMintKey
    ),
    AuctionHouseProgram.findAuctionHouseProgramAsSignerAddress(),
  ]);

  const sellerTokenAccountKey = tokenAccounts.value[0].address;

  if (!tokenAccountKey.equals(sellerTokenAccountKey)) {
    throw Error("You are not owner of the NFT");
  }

  const [
    [sellerTradeState, sellerTradeStateBump],
    [freeSellerTradeState, freeSellerTradeStateBump],
    auctionHouse,
  ] = await Promise.all([
    AuctionHouseProgram.findTradeStateAddress(
      sellerWalletKey,
      auctionHouseKey,
      tokenAccountKey,
      treasuryMintKey,
      mintKey,
      buyPriceAdjusted.toNumber(),
      tokenSizeAdjusted.toNumber()
    ),
    AuctionHouseProgram.findTradeStateAddress(
      sellerWalletKey,
      auctionHouseKey,
      tokenAccountKey,
      treasuryMintKey,
      mintKey,
      0,
      tokenSizeAdjusted.toNumber()
    ),
    AuctionHouseProgram.accounts.AuctionHouse.fromAccountAddress(
      connection,
      auctionHouseKey
    ),
  ]);

  const instructions = [];

  const ixSell = AuctionHouseProgram.instructions.createSellInstruction(
    {
      wallet: sellerWalletKey,
      tokenAccount: tokenAccountKey,
      metadata: metadataKey,
      authority: auctionHouse.authority,
      auctionHouse: auctionHouseKey,
      auctionHouseFeeAccount: auctionHouse.auctionHouseFeeAccount,
      sellerTradeState,
      freeSellerTradeState,
      programAsSigner,
    },
    {
      tradeStateBump: sellerTradeStateBump,
      freeTradeStateBump: freeSellerTradeStateBump,
      programAsSignerBump,
      buyerPrice: buyPriceAdjusted,
      tokenSize: tokenSizeAdjusted,
    }
  );
  ixSell.keys
    .filter((k) => k.pubkey.equals(sellerWalletKey))
    .map((k) => (k.isSigner = true));
  instructions.push(ixSell);

  // execute final sale when bid is matched to ask
  if (buyerWallet) {
    const buyerWalletKey = new PublicKey(buyerWallet);
    const isNative = treasuryMintKey.equals(NATIVE_MINT);

    const [
      metadata,
      [escrowPaymentAccount, escrowPaymentBump],
      [buyerTradeState],
      [sellerPaymentReceiptAccount],
      [buyerReceiptTokenAccount],
    ] = await Promise.all([
      connection.getAccountInfo(metadataKey),
      AuctionHouseProgram.findEscrowPaymentAccountAddress(
        auctionHouseKey,
        buyerWalletKey
      ),
      AuctionHouseProgram.findPublicBidTradeStateAddress(
        buyerWalletKey,
        auctionHouseKey,
        treasuryMintKey,
        mintKey,
        buyPriceAdjusted.toNumber(),
        tokenSizeAdjusted.toNumber()
      ),
      isNative
        ? [sellerWalletKey]
        : AuctionHouseProgram.findAssociatedTokenAccountAddress(
            treasuryMintKey,
            sellerWalletKey
          ),
      AuctionHouseProgram.findAssociatedTokenAccountAddress(
        mintKey,
        buyerWalletKey
      ),
    ]);

    const metadataDecoded = MetadataData.deserialize(metadata.data);
    const remainingAccounts = await getRemainingAccounts(
      metadataDecoded,
      treasuryMintKey,
      isNative
    );

    const ixExecuteSale =
      AuctionHouseProgram.instructions.createExecuteSaleInstruction(
        {
          buyer: buyerWalletKey,
          seller: sellerWalletKey,
          tokenAccount: tokenAccountKey,
          tokenMint: mintKey,
          metadata: metadataKey,
          treasuryMint: treasuryMintKey,
          escrowPaymentAccount,
          sellerPaymentReceiptAccount,
          buyerReceiptTokenAccount,
          authority: auctionHouse.authority,
          auctionHouse: auctionHouseKey,
          auctionHouseFeeAccount: auctionHouse.auctionHouseFeeAccount,
          auctionHouseTreasury: auctionHouse.auctionHouseTreasury,
          buyerTradeState,
          sellerTradeState,
          freeTradeState: freeSellerTradeState,
          programAsSigner,
        },
        {
          escrowPaymentBump,
          freeTradeStateBump: freeSellerTradeStateBump,
          programAsSignerBump,
          buyerPrice: buyPriceAdjusted,
          tokenSize: tokenSizeAdjusted,
        }
      );
    ixExecuteSale.keys.push(...remainingAccounts);
    instructions.push(ixExecuteSale);
  }

  return await serializeRawTransactionWithSigners(
    connection,
    instructions,
    [],
    sellerWalletKey
  );
};

// cancel ask
export const cancelAskAction = async (
  treasuryMint: string,
  wallet: string,
  mint: string,
  buyPrice: number,
  tokenSize: number
) => {
  const walletKey = new PublicKey(wallet);
  const mintKey = new PublicKey(mint);
  const treasuryMintKey = getTreasuryMintKey(treasuryMint);

  const [
    buyPriceAdjusted,
    tokenSizeAdjusted,
    [tokenAccountKey],
    [auctionHouseKey],
  ] = await Promise.all([
    getPriceWithMantissa(buyPrice, treasuryMintKey, connection),
    getPriceWithMantissa(tokenSize, mintKey, connection),
    AuctionHouseProgram.findAssociatedTokenAccountAddress(mintKey, walletKey),
    AuctionHouseProgram.findAuctionHouseAddress(
      authorityPublicKey,
      treasuryMintKey
    ),
  ]);

  const [[tradeState], auctionHouse] = await Promise.all([
    AuctionHouseProgram.findTradeStateAddress(
      walletKey,
      auctionHouseKey,
      tokenAccountKey,
      treasuryMintKey,
      mintKey,
      buyPriceAdjusted.toNumber(),
      tokenSizeAdjusted.toNumber()
    ),
    AuctionHouseProgram.accounts.AuctionHouse.fromAccountAddress(
      connection,
      auctionHouseKey
    ),
  ]);

  const instruction = AuctionHouseProgram.instructions.createCancelInstruction(
    {
      wallet: walletKey,
      tokenAccount: tokenAccountKey,
      tokenMint: mintKey,
      authority: auctionHouse.authority,
      auctionHouse: auctionHouseKey,
      auctionHouseFeeAccount: auctionHouse.auctionHouseFeeAccount,
      tradeState,
    },
    {
      buyerPrice: buyPriceAdjusted,
      tokenSize: tokenSizeAdjusted,
    }
  );
  instruction.keys
    .filter((k) => k.pubkey.equals(walletKey))
    .map((k) => (k.isSigner = true));

  return await serializeRawTransactionWithSigners(
    connection,
    [instruction],
    [],
    walletKey
  );
};

// public bid for NFT
export const publicBidAction = async (
  treasuryMint: string,
  buyerWallet: string,
  mint: string,
  depositAmount: number,
  buyPrice: number,
  tokenSize: number,
  sellerWallet?: string
) => {
  const buyerWalletKey = new PublicKey(buyerWallet);
  const mintKey = new PublicKey(mint);
  const treasuryMintKey = getTreasuryMintKey(treasuryMint);
  const isNative = treasuryMintKey.equals(NATIVE_MINT);

  const [
    buyPriceAdjusted,
    tokenSizeAdjusted,
    tokenAccounts,
    metadataKey,
    [buyerTokenAccountKey],
    [ata],
    [auctionHouseKey],
  ] = await Promise.all([
    getPriceWithMantissa(buyPrice, treasuryMintKey, connection),
    getPriceWithMantissa(tokenSize, mintKey, connection),
    connection.getTokenLargestAccounts(mintKey),
    Metadata.getPDA(mintKey),
    AuctionHouseProgram.findAssociatedTokenAccountAddress(
      mintKey,
      buyerWalletKey
    ),
    AuctionHouseProgram.findAssociatedTokenAccountAddress(
      treasuryMintKey,
      buyerWalletKey
    ),
    AuctionHouseProgram.findAuctionHouseAddress(
      authorityPublicKey,
      treasuryMintKey
    ),
  ]);

  const tokenAccountKey = tokenAccounts.value[0].address;
  const transferAuthority = Keypair.generate();

  if (tokenAccountKey.equals(buyerTokenAccountKey)) {
    throw Error("You cannot buy your own NFT");
  }

  const [
    [escrowPaymentAccount, escrowPaymentBump],
    [buyerTradeState, buyerTradeStateBump],
    auctionHouse,
  ] = await Promise.all([
    AuctionHouseProgram.findEscrowPaymentAccountAddress(
      auctionHouseKey,
      buyerWalletKey
    ),
    AuctionHouseProgram.findPublicBidTradeStateAddress(
      buyerWalletKey,
      auctionHouseKey,
      treasuryMintKey,
      mintKey,
      buyPriceAdjusted.toNumber(),
      tokenSizeAdjusted.toNumber()
    ),
    AuctionHouseProgram.accounts.AuctionHouse.fromAccountAddress(
      connection,
      auctionHouseKey
    ),
  ]);

  const instructions = [
    ...(isNative
      ? []
      : [
          Token.createApproveInstruction(
            TOKEN_PROGRAM_ID,
            ata,
            transferAuthority.publicKey,
            buyerWalletKey,
            [],
            buyPriceAdjusted.toNumber()
          ),
        ]),
  ];

  const ixPublicBuy =
    AuctionHouseProgram.instructions.createPublicBuyInstruction(
      {
        wallet: buyerWalletKey,
        paymentAccount: isNative ? buyerWalletKey : ata,
        transferAuthority: isNative
          ? buyerWalletKey
          : transferAuthority.publicKey,
        treasuryMint: treasuryMintKey,
        tokenAccount: tokenAccountKey,
        metadata: metadataKey,
        escrowPaymentAccount,
        authority: auctionHouse.authority,
        auctionHouse: auctionHouseKey,
        auctionHouseFeeAccount: auctionHouse.auctionHouseFeeAccount,
        buyerTradeState,
      },
      {
        tradeStateBump: buyerTradeStateBump,
        escrowPaymentBump,
        buyerPrice: buyPriceAdjusted,
        tokenSize: tokenSizeAdjusted,
      }
    );
  ixPublicBuy.keys
    .filter((k) => k.pubkey.equals(buyerWalletKey))
    .map((k) => (k.isSigner = true));
  if (!isNative) {
    ixPublicBuy.keys
      .filter((k) => k.pubkey.equals(transferAuthority.publicKey))
      .map((k) => (k.isSigner = true));
  }
  instructions.push(ixPublicBuy);

  // deposit difference amount
  if (depositAmount > 0) {
    const depositAmountAdjusted = await getPriceWithMantissa(
      depositAmount,
      treasuryMintKey,
      connection
    );

    const ixDeposit = AuctionHouseProgram.instructions.createDepositInstruction(
      {
        wallet: buyerWalletKey,
        paymentAccount: isNative ? buyerWalletKey : ata,
        transferAuthority: isNative
          ? buyerWalletKey
          : transferAuthority.publicKey,
        escrowPaymentAccount,
        treasuryMint: treasuryMintKey,
        authority: auctionHouse.authority,
        auctionHouse: auctionHouseKey,
        auctionHouseFeeAccount: auctionHouse.auctionHouseFeeAccount,
      },
      {
        escrowPaymentBump,
        amount: depositAmountAdjusted,
      }
    );
    ixDeposit.keys
      .filter((k) => k.pubkey.equals(buyerWalletKey))
      .map((k) => (k.isSigner = true));
    if (!isNative) {
      ixDeposit.keys
        .filter((k) => k.pubkey.equals(transferAuthority.publicKey))
        .map((k) => (k.isSigner = true));
    }
    instructions.push(ixDeposit);
  }

  instructions.push(
    ...(isNative
      ? []
      : [
          Token.createRevokeInstruction(
            TOKEN_PROGRAM_ID,
            ata,
            buyerWalletKey,
            []
          ),
        ])
  );

  // execute sale when bid is matched to ask
  if (sellerWallet) {
    const sellerWalletKey = new PublicKey(sellerWallet);

    const [
      metadata,
      [programAsSigner, programAsSignerBump],
      [escrowPaymentAccount, escrowPaymentBump],
      [freeTradeState, freeTradeStateBump],
      [sellerTradeState],
      [sellerPaymentReceiptAccount],
      [buyerReceiptTokenAccount],
    ] = await Promise.all([
      connection.getAccountInfo(metadataKey),
      AuctionHouseProgram.findAuctionHouseProgramAsSignerAddress(),
      AuctionHouseProgram.findEscrowPaymentAccountAddress(
        auctionHouseKey,
        buyerWalletKey
      ),
      AuctionHouseProgram.findTradeStateAddress(
        sellerWalletKey,
        auctionHouseKey,
        tokenAccountKey,
        treasuryMintKey,
        mintKey,
        0,
        tokenSizeAdjusted.toNumber()
      ),
      AuctionHouseProgram.findTradeStateAddress(
        sellerWalletKey,
        auctionHouseKey,
        tokenAccountKey,
        treasuryMintKey,
        mintKey,
        buyPriceAdjusted.toNumber(),
        tokenSizeAdjusted.toNumber()
      ),
      isNative
        ? [sellerWalletKey]
        : await AuctionHouseProgram.findAssociatedTokenAccountAddress(
            treasuryMintKey,
            sellerWalletKey
          ),
      AuctionHouseProgram.findAssociatedTokenAccountAddress(
        mintKey,
        buyerWalletKey
      ),
    ]);

    const metadataDecoded = MetadataData.deserialize(metadata.data);
    const remainingAccounts = await getRemainingAccounts(
      metadataDecoded,
      treasuryMintKey,
      isNative
    );

    const ixExecuteSale =
      AuctionHouseProgram.instructions.createExecuteSaleInstruction(
        {
          buyer: buyerWalletKey,
          seller: sellerWalletKey,
          tokenAccount: tokenAccountKey,
          tokenMint: mintKey,
          metadata: metadataKey,
          treasuryMint: treasuryMintKey,
          escrowPaymentAccount,
          sellerPaymentReceiptAccount,
          buyerReceiptTokenAccount,
          authority: auctionHouse.authority,
          auctionHouse: auctionHouseKey,
          auctionHouseFeeAccount: auctionHouse.auctionHouseFeeAccount,
          auctionHouseTreasury: auctionHouse.auctionHouseTreasury,
          buyerTradeState,
          sellerTradeState,
          freeTradeState,
          programAsSigner,
        },
        {
          escrowPaymentBump,
          freeTradeStateBump,
          programAsSignerBump,
          buyerPrice: buyPriceAdjusted,
          tokenSize: tokenSizeAdjusted,
        }
      );
    ixExecuteSale.keys.push(...remainingAccounts);
    instructions.push(ixExecuteSale);
  }

  const signers = isNative ? [] : [transferAuthority];

  return await serializeRawTransactionWithSigners(
    connection,
    instructions,
    signers,
    buyerWalletKey
  );
};

export const publicAcceptBid = async (
  treasuryMint: string,
  buyerWallet: string,
  mint: string,
  buyPrice: number,
  previousAskPrice: number,
  tokenSize: number,
  sellerWallet?: string
) => {

  const buyerWalletKey = new PublicKey(buyerWallet);
  const sellerWalletKey = new PublicKey(sellerWallet);
  const mintKey = new PublicKey(mint);
  const treasuryMintKey = getTreasuryMintKey(treasuryMint);
  const isNative = treasuryMintKey.equals(NATIVE_MINT);

  const [
    buyPriceAdjusted,
    previousAskPriceAdjusted,
    tokenSizeAdjusted,
    tokenAccounts,
    metadataKey,
    [tokenAccountKey],
    [auctionHouseKey],
    [programAsSigner, programAsSignerBump],
  ] = await Promise.all([
    getPriceWithMantissa(buyPrice, treasuryMintKey, connection),
    getPriceWithMantissa(previousAskPrice, treasuryMintKey, connection),
    getPriceWithMantissa(tokenSize, mintKey, connection),
    connection.getTokenLargestAccounts(mintKey),
    Metadata.getPDA(mintKey),
    AuctionHouseProgram.findAssociatedTokenAccountAddress(
      mintKey,
      sellerWalletKey
    ),
    AuctionHouseProgram.findAuctionHouseAddress(
      authorityPublicKey,
      treasuryMintKey
    ),
    AuctionHouseProgram.findAuctionHouseProgramAsSignerAddress(),
  ]);

  const sellerTokenAccountKey = tokenAccounts.value[0].address;

  if (!tokenAccountKey.equals(sellerTokenAccountKey)) {
    throw Error("You are not owner of the NFT");
  }

  const [
    metadata,
    [escrowPaymentAccount, escrowPaymentBump],
    [buyerTradeState],
    [sellerPaymentReceiptAccount],
    [buyerReceiptTokenAccount],
  ] = await Promise.all([
    connection.getAccountInfo(metadataKey),
    AuctionHouseProgram.findEscrowPaymentAccountAddress(
      auctionHouseKey,
      buyerWalletKey
    ),
    AuctionHouseProgram.findPublicBidTradeStateAddress(
      buyerWalletKey,
      auctionHouseKey,
      treasuryMintKey,
      mintKey,
      buyPriceAdjusted.toNumber(),
      tokenSizeAdjusted.toNumber()
    ),
    isNative
      ? [sellerWalletKey]
      : AuctionHouseProgram.findAssociatedTokenAccountAddress(
          treasuryMintKey,
          sellerWalletKey
        ),
    AuctionHouseProgram.findAssociatedTokenAccountAddress(
      mintKey,
      buyerWalletKey
    ),
  ]);

  const metadataDecoded = MetadataData.deserialize(metadata.data);
  const remainingAccounts = await getRemainingAccounts(
    metadataDecoded,
    treasuryMintKey,
    isNative
  );

  const [
    [tradeState]
  ] = await Promise.all([
    AuctionHouseProgram.findTradeStateAddress(
      sellerWalletKey,
      auctionHouseKey,
      tokenAccountKey,
      treasuryMintKey,
      mintKey,
      previousAskPriceAdjusted.toNumber(),
      tokenSizeAdjusted.toNumber()
    )
  ]);
  const [
    [sellerTradeState, sellerTradeStateBump],
    [freeSellerTradeState, freeSellerTradeStateBump],
    auctionHouse,
  ] = await Promise.all([
    AuctionHouseProgram.findTradeStateAddress(
      sellerWalletKey,
      auctionHouseKey,
      tokenAccountKey,
      treasuryMintKey,
      mintKey,
      buyPriceAdjusted.toNumber(),
      tokenSizeAdjusted.toNumber()
    ),
    AuctionHouseProgram.findTradeStateAddress(
      sellerWalletKey,
      auctionHouseKey,
      tokenAccountKey,
      treasuryMintKey,
      mintKey,
      0,
      tokenSizeAdjusted.toNumber()
    ),
    AuctionHouseProgram.accounts.AuctionHouse.fromAccountAddress(
      connection,
      auctionHouseKey
    ),
  ]);

  let instructions = []

  const ixCancelAsk = AuctionHouseProgram.instructions.createCancelInstruction(
    {
      wallet: sellerWalletKey,
      tokenAccount: tokenAccountKey,
      tokenMint: mintKey,
      authority: auctionHouse.authority,
      auctionHouse: auctionHouseKey,
      auctionHouseFeeAccount: auctionHouse.auctionHouseFeeAccount,
      tradeState,
    },
    {
      buyerPrice: previousAskPriceAdjusted,
      tokenSize: tokenSizeAdjusted,
    }
  );
  ixCancelAsk.keys
    .filter((k) => k.pubkey.equals(sellerWalletKey))
    .map((k) => (k.isSigner = true));
  instructions.push(ixCancelAsk);

  const ixSellForOfferPrice = AuctionHouseProgram.instructions.createSellInstruction(
    {
      wallet: sellerWalletKey,
      tokenAccount: tokenAccountKey,
      metadata: metadataKey,
      authority: auctionHouse.authority,
      auctionHouse: auctionHouseKey,
      auctionHouseFeeAccount: auctionHouse.auctionHouseFeeAccount,
      sellerTradeState,
      freeSellerTradeState,
      programAsSigner,
    },
    {
      tradeStateBump: sellerTradeStateBump,
      freeTradeStateBump: freeSellerTradeStateBump,
      programAsSignerBump,
      buyerPrice: buyPriceAdjusted,
      tokenSize: tokenSizeAdjusted,
    }
  );
  ixSellForOfferPrice.keys
    .filter((k) => k.pubkey.equals(sellerWalletKey))
    .map((k) => (k.isSigner = true));
  instructions.push(ixSellForOfferPrice);

  const ixExecuteSale =
    AuctionHouseProgram.instructions.createExecuteSaleInstruction(
      {
        buyer: buyerWalletKey,
        seller: sellerWalletKey,
        tokenAccount: tokenAccountKey,
        tokenMint: mintKey,
        metadata: metadataKey,
        treasuryMint: treasuryMintKey,
        escrowPaymentAccount,
        sellerPaymentReceiptAccount,
        buyerReceiptTokenAccount,
        authority: auctionHouse.authority,
        auctionHouse: auctionHouseKey,
        auctionHouseFeeAccount: auctionHouse.auctionHouseFeeAccount,
        auctionHouseTreasury: auctionHouse.auctionHouseTreasury,
        buyerTradeState,
        sellerTradeState,
        freeTradeState: freeSellerTradeState,
        programAsSigner,
      },
      {
        escrowPaymentBump,
        freeTradeStateBump: freeSellerTradeStateBump,
        programAsSignerBump,
        buyerPrice: buyPriceAdjusted,
        tokenSize: tokenSizeAdjusted,
      }
    );
  ixExecuteSale.keys.push(...remainingAccounts);
  instructions.push(ixExecuteSale);

  return await serializeRawTransactionWithSigners(
    connection,
    instructions,
    [],
    sellerWalletKey
  );
}

// cancel public bid
export const cancelPublicBidAction = async (
  treasuryMint: string,
  wallet: string,
  mint: string,
  buyPrice: number,
  tokenSize: number
) => {
  const walletKey = new PublicKey(wallet);
  const mintKey = new PublicKey(mint);
  const treasuryMintKey = getTreasuryMintKey(treasuryMint);
  const isNative = treasuryMintKey.equals(NATIVE_MINT);

  const [
    buyPriceAdjusted,
    tokenSizeAdjusted,
    tokenAccounts,
    [ata],
    [auctionHouseKey],
  ] = await Promise.all([
    getPriceWithMantissa(buyPrice, treasuryMintKey, connection),
    getPriceWithMantissa(tokenSize, mintKey, connection),
    connection.getTokenLargestAccounts(mintKey),
    AuctionHouseProgram.findAssociatedTokenAccountAddress(
      treasuryMintKey,
      walletKey
    ),
    AuctionHouseProgram.findAuctionHouseAddress(
      authorityPublicKey,
      treasuryMintKey
    ),
  ]);

  const tokenAccountKey = tokenAccounts.value[0].address;

  const [
    [escrowPaymentAccount, escrowPaymentBump],
    [tradeState],
    auctionHouse,
  ] = await Promise.all([
    AuctionHouseProgram.findEscrowPaymentAccountAddress(
      auctionHouseKey,
      walletKey
    ),
    AuctionHouseProgram.findPublicBidTradeStateAddress(
      walletKey,
      auctionHouseKey,
      treasuryMintKey,
      mintKey,
      buyPriceAdjusted.toNumber(),
      tokenSizeAdjusted.toNumber()
    ),
    AuctionHouseProgram.accounts.AuctionHouse.fromAccountAddress(
      connection,
      auctionHouseKey
    ),
  ]);

  const instructions = [];

  // cancel bid
  const ixCancel = AuctionHouseProgram.instructions.createCancelInstruction(
    {
      wallet: walletKey,
      tokenAccount: tokenAccountKey,
      tokenMint: mintKey,
      authority: auctionHouse.authority,
      auctionHouse: auctionHouseKey,
      auctionHouseFeeAccount: auctionHouse.auctionHouseFeeAccount,
      tradeState,
    },
    {
      buyerPrice: buyPriceAdjusted,
      tokenSize: tokenSizeAdjusted,
    }
  );
  ixCancel.keys
    .filter((k) => k.pubkey.equals(walletKey))
    .map((k) => (k.isSigner = true));
  instructions.push(ixCancel);

  // withdraw buy price amount from escrow payment account
  const ixWithdraw = AuctionHouseProgram.instructions.createWithdrawInstruction(
    {
      wallet: walletKey,
      receiptAccount: isNative ? walletKey : ata,
      escrowPaymentAccount,
      treasuryMint: treasuryMintKey,
      authority: auctionHouse.authority,
      auctionHouse: auctionHouseKey,
      auctionHouseFeeAccount: auctionHouse.auctionHouseFeeAccount,
    },
    {
      escrowPaymentBump,
      amount: buyPriceAdjusted,
    }
  );
  ixWithdraw.keys
    .filter((k) => k.pubkey.equals(walletKey))
    .map((k) => (k.isSigner = true));
  instructions.push(ixWithdraw);

  return await serializeRawTransactionWithSigners(
    connection,
    instructions,
    [],
    walletKey
  );
};

// execute auction house transaction
export const executeAction = async (buff: Buffer) => {
  const txHash = await connection.sendRawTransaction(buff);

  const response = await connection.confirmTransaction(txHash, "processed");

  const transactionSlot = response.context.slot

  const blockTime = await connection.getBlockTime(transactionSlot)

  const transactionHashAndBlockTime = new TransactionHashAndBlockTime(txHash, blockTime)
  return transactionHashAndBlockTime;
};
