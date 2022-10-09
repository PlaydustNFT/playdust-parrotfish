import server from "supertest";
import { Keypair } from "@solana/web3.js";
import { sign } from "tweetnacl";
import base58 from "bs58";
import { access } from "fs";

const request = server("http://localhost:8001");

const USER_KEYPAIR = Keypair.generate();

let accessNonce: string;
let accessToken: string;

// increase timeout to 40s 
// jest's default timeout is 5s
// HubSpot database doesn't immediately reflect written data based on testing
// so we add in small time-outs (~7s)
jest.setTimeout(40000);

describe("API end points", () => {
  it("should ping and healthcheck", async () => {
    await request.get("/ping").expect(200);
  });

  describe("Authentication module", () => {
    it("should generate nonce", async () => {
      await request
        .post("/authentication/nonce")
        .send({
          wallet: USER_KEYPAIR.publicKey.toBase58(),
        })
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty("nonce");
          expect(res.body.nonce).not.toBe(null);
          expect(res.body.nonce.length).toBe(64);
          accessNonce = res.body.nonce;
        });
    });

    it("should generate access token", async () => {
      const signedMessage = base58.encode(
        sign.detached(
          new TextEncoder().encode(accessNonce),
          USER_KEYPAIR.secretKey
        )
      );

      await request
        .post("/authentication/login")
        .send({
          wallet: USER_KEYPAIR.publicKey.toBase58(),
          nonce: accessNonce,
          message: signedMessage,
        })
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty("accessToken");
          expect(res.body.accessToken).not.toBe(null);

          accessToken = res.body.accessToken;
        });
    });
  });

  /** HubSpot Integration */

  describe("User profile", () => {
    const username = "trader";
    const email = "trader-" + Date.now() + "@tradingsystems.net";
    const bio = "I like to trade things for other things!";
    const twitterUsername = "tradertweets";
    it("should login", async () => {
      await request
        .post("/authentication/nonce")
        .send({
          wallet: USER_KEYPAIR.publicKey.toBase58(),
        })
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty("nonce");
          expect(res.body.nonce).not.toBe(null);
          expect(res.body.nonce.length).toBe(64);
          accessNonce = res.body.nonce;
        });

      const signedMessage = base58.encode(
        sign.detached(
          new TextEncoder().encode(accessNonce),
          USER_KEYPAIR.secretKey
        )
      );

      await request
        .post("/authentication/login")
        .send({
          wallet: USER_KEYPAIR.publicKey.toBase58(),
          nonce: accessNonce,
          message: signedMessage,
        })
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty("accessToken");
          expect(res.body.accessToken).not.toBe(null);

          accessToken = res.body.accessToken;
        });
    });

    it("should create user profile", async () => {
      await request
        .post("/authentication/nonce")
        .send({
          wallet: USER_KEYPAIR.publicKey.toBase58(),
        })
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty("nonce");
          expect(res.body.nonce).not.toBe(null);
          expect(res.body.nonce.length).toBe(64);
          accessNonce = res.body.nonce;
        });

      const signedMessage = base58.encode(
        sign.detached(
          new TextEncoder().encode(accessNonce),
          USER_KEYPAIR.secretKey
        )
      );
      await request
        .post(`/user-profile/update/${USER_KEYPAIR.publicKey.toString()}`)
        .send({
          nonce: accessNonce,
          message: signedMessage,
          username: username,
          email: email,
          bio: bio,
        })
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty("success");
          expect(res.body.success).toBe(true);
        });
    });

    it("should read user profile", async () => {
      await new Promise((r) => { setTimeout(r, 7000)});
      await request
        .get(`/user-profile/read`)
        .query({
          walletAddress: USER_KEYPAIR.publicKey.toString(),
        })
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty("username");
          expect(res.body.username).toStrictEqual(username)
          expect(res.body).toHaveProperty("email");
          expect(res.body.email).toStrictEqual(email)
          expect(res.body).toHaveProperty("bio");
          expect(res.body.bio).toStrictEqual(bio);
        });
    });

    it("should update user profile", async () => {
      await new Promise((r) => { setTimeout(r, 1000)});
      await request
        .post("/authentication/nonce")
        .send({
          wallet: USER_KEYPAIR.publicKey.toBase58(),
        })
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty("nonce");
          expect(res.body.nonce).not.toBe(null);
          expect(res.body.nonce.length).toBe(64);
          accessNonce = res.body.nonce;
        });

      const signedMessage = base58.encode(
        sign.detached(
          new TextEncoder().encode(accessNonce),
          USER_KEYPAIR.secretKey
        )
      );
      await request
        .post(`/user-profile/update/${USER_KEYPAIR.publicKey.toString()}`)
        .send({
          nonce: accessNonce,
          message: signedMessage,
          twitterUsername: twitterUsername,
        })
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty("success");
          expect(res.body.success).toBe(true);
        });
    });

    it("should read user profile", async () => {
      await new Promise((r) => { setTimeout(r, 7000)});
      await request
        .get(`/user-profile/read`)
        .query({
          walletAddress: USER_KEYPAIR.publicKey.toString(),
        })
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty("username");
          expect(res.body.username).toStrictEqual(username);
          expect(res.body).toHaveProperty("email");
          expect(res.body.email).toStrictEqual(email);
          expect(res.body).toHaveProperty("bio");
          expect(res.body.bio).toStrictEqual(bio);
          expect(res.body).toHaveProperty("twitterUsername");
          expect(res.body.twitterUsername).toStrictEqual(twitterUsername);
        });
    });

    it("should not read user profile without auth", async () => {
      await request
        .get(`/user-profile/read`)
        .query({
          walletAddress: USER_KEYPAIR.publicKey.toString(),
        })
        .expect(401)
    });

    it("should read public user profile without auth", async () => {
      await request
        .get(`/user-profile/public/read`)
        .query({
          walletAddress: USER_KEYPAIR.publicKey.toString(),
        })
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty("username");
          expect(res.body.username).toStrictEqual(username);
          expect(res.body).toHaveProperty("bio");
          expect(res.body.bio).toStrictEqual(bio);
          expect(res.body).toHaveProperty("profilePictureMintAddress");
          expect(res.body.profilePictureMintAddress).toStrictEqual(null);
          expect(res.body).not.toHaveProperty("email");
          expect(res.body).not.toHaveProperty("twitterUsername");
          expect(res.body).not.toHaveProperty("discordUsername");
        });
    });

    it("should archive user profile", async () => {
      await new Promise((r) => { setTimeout(r, 3000)});
      await request
        .post("/authentication/nonce")
        .send({
          wallet: USER_KEYPAIR.publicKey.toBase58(),
        })
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty("nonce");
          expect(res.body.nonce).not.toBe(null);
          expect(res.body.nonce.length).toBe(64);
          accessNonce = res.body.nonce;
        });

      const signedMessage = base58.encode(
        sign.detached(
          new TextEncoder().encode(accessNonce),
          USER_KEYPAIR.secretKey
        )
      );
      await request
        .post(`/user-profile/delete/${USER_KEYPAIR.publicKey.toString()}`)
        .send({
          nonce: accessNonce,
          message: signedMessage,
        })
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty("success");
          expect(res.body.success).toStrictEqual(true);
        });
    });
  });


  describe("Trading module", () => {
    it("should retrieve available markets", async () => {
      await request
        .get("/trading/markets")
        .expect(200)
        .then((res) => {
          expect(res.body.length).toBeGreaterThanOrEqual(0);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty("auctionHouse");
            expect(res.body[0]).toHaveProperty("tokenSymbol");
          }
        });
    });
  });
});
