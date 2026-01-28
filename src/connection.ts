/**
 * Via Labs V4 Program Client
 *
 * Industry-standard program connection utilities.
 * Handles: connection, wallet loading, program instantiation.
 */

import { Connection, Keypair } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import type { MessageGatewayV4 } from "./types/message_gateway_v4.js";
import idl from "./idl/message_gateway_v4.json" with { type: "json" };
import fs from "fs";
import bs58 from "bs58";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Via Labs V4 Program Client
 *
 * Handles all connection boilerplate for program interactions.
 * Industry standard: Single point of configuration.
 */
export class ViaLabsClient {
  public readonly connection: Connection;
  public readonly wallet: Wallet;
  public readonly program: Program<MessageGatewayV4>;

  constructor() {
    // Validate environment
    if (!process.env.ANCHOR_PROVIDER_URL) {
      throw new Error("ANCHOR_PROVIDER_URL not set in environment");
    }

    // Initialize connection and wallet - industry standard pattern
    this.connection = new Connection(process.env.ANCHOR_PROVIDER_URL, "confirmed");

    // Load wallet from either SOLANA_DEPLOYER_PRIVATE_KEY or ANCHOR_WALLET file
    let walletKeypair: Keypair;

    if (process.env.SOLANA_DEPLOYER_PRIVATE_KEY) {
      // Use private key from environment (preferred method)
      const secretKey = bs58.decode(process.env.SOLANA_DEPLOYER_PRIVATE_KEY);
      walletKeypair = Keypair.fromSecretKey(secretKey);
    } else if (process.env.ANCHOR_WALLET) {
      // Fallback to wallet file (legacy method)
      walletKeypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET, "utf8")))
      );
    } else {
      throw new Error("Either SOLANA_DEPLOYER_PRIVATE_KEY or ANCHOR_WALLET must be set in environment");
    }

    this.wallet = new Wallet(walletKeypair);

    // Create AnchorProvider - required for .rpc() calls
    const provider = new AnchorProvider(
      this.connection,
      this.wallet,
      { commitment: "confirmed" }
    );

    // Manual Program instantiation (NOT anchor.workspace)
    this.program = new Program(idl as MessageGatewayV4, provider);
  }

  /**
   * Log client configuration for debugging
   */
  logConfiguration(): void {
    console.log("✅ Via Labs client initialized:");
    console.log(`   Network: ${process.env.ANCHOR_PROVIDER_URL}`);
    console.log(`   Wallet: ${this.wallet.publicKey.toString()}`);
    console.log(`   Program: ${this.program.programId.toString()}`);
  }
}

/**
 * Create a new Via Labs client instance
 *
 * @returns Configured client ready for program interactions
 */
export function createClient(): ViaLabsClient {
  return new ViaLabsClient();
}
