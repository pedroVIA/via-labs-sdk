/**
 * ABI Decoding Utilities for Via Labs V4 Client Programs
 *
 * This module provides utilities for decoding ABI-encoded onChainData from
 * EVM source chains (Ethereum, Avalanche, etc.). The onChainData field in
 * cross-chain messages contains application-specific data encoded using
 * Solidity's abi.encode() function.
 *
 * CRITICAL: This implementation MUST match the Rust decoding in:
 * contracts/solana/programs/client-test-v4/src/instructions/decode_and_store.rs
 */

import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import type { TokenBridgeData } from "./types.js";

/**
 * Decode token bridge data from Ethereum ABI encoding
 *
 * Layout (96 bytes total):
 * - Bytes 0-31: recipient (Solana pubkey as bytes32)
 * - Bytes 32-63: amount (uint256 in big-endian)
 * - Bytes 64-95: tokenMint (Solana pubkey as bytes32)
 *
 * Source encoding (Solidity):
 * ```solidity
 * bytes memory onChainData = abi.encode(
 *   recipientTokenAccount,  // bytes32
 *   amount,                 // uint256
 *   tokenMint              // bytes32
 * );
 * ```
 *
 * @param onChainData The ABI-encoded data from the cross-chain message
 * @returns Decoded token bridge data
 * @throws Error if data is malformed or invalid
 *
 * @example
 * ```typescript
 * import { decodeTokenBridgeData } from '@via-labs/sdk';
 *
 * const onChainData = Buffer.from(message.values.onChainData, 'hex');
 * const decoded = decodeTokenBridgeData(onChainData);
 *
 * console.log('Recipient:', decoded.recipient.toBase58());
 * console.log('Amount:', decoded.amount.toString());
 * console.log('Token Mint:', decoded.tokenMint.toBase58());
 * ```
 *
 * @see contracts/ethereum/src/ClientTestV4.sol (bridge function)
 * @see contracts/solana/programs/client-test-v4/src/instructions/decode_and_store.rs
 */
export function decodeTokenBridgeData(onChainData: Buffer): TokenBridgeData {
  // Validate minimum size (3 x 32 bytes = 96 bytes)
  if (onChainData.length < 96) {
    throw new Error(
      `Invalid onChainData size: expected at least 96 bytes, got ${onChainData.length} bytes`
    );
  }

  try {
    // Extract recipient (bytes 0-31) - Solana pubkey
    const recipientBytes = onChainData.slice(0, 32);
    const recipient = new PublicKey(recipientBytes);

    // Extract amount (bytes 32-63) - uint256 in big-endian
    const amountBytes = onChainData.slice(32, 64);
    const amount = u256ToU64(amountBytes);

    // Extract tokenMint (bytes 64-95) - Solana pubkey
    const tokenMintBytes = onChainData.slice(64, 96);
    const tokenMint = new PublicKey(tokenMintBytes);

    return {
      recipient,
      amount,
      tokenMint,
    };
  } catch (error) {
    throw new Error(
      `Failed to decode token bridge data: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Convert Ethereum uint256 (32 bytes, big-endian) to Solana u64
 *
 * Ethereum uses uint256 for amounts, but Solana uses u64 for SPL tokens.
 * This function converts the uint256 to u64, validating that the value
 * fits within the u64 range (0 to 2^64-1).
 *
 * @param uint256Bytes The 32-byte uint256 in big-endian format
 * @returns BN representing the u64 value
 * @throws Error if the value exceeds u64::MAX
 *
 * @example
 * ```typescript
 * // Convert 1000 tokens (uint256) to u64
 * const uint256 = Buffer.alloc(32);
 * uint256.writeBigUInt64BE(1000n, 24); // Write to last 8 bytes
 * const u64 = u256ToU64(uint256);
 * console.log(u64.toString()); // "1000"
 * ```
 */
export function u256ToU64(uint256Bytes: Buffer): BN {
  if (uint256Bytes.length !== 32) {
    throw new Error(`Invalid uint256 size: expected 32 bytes, got ${uint256Bytes.length} bytes`);
  }

  // Check that the first 24 bytes are zero (value must fit in u64)
  // uint256 is big-endian, so high bytes are at the start
  for (let i = 0; i < 24; i++) {
    if (uint256Bytes[i] !== 0) {
      throw new Error(
        `Amount overflow: uint256 value exceeds u64::MAX (2^64-1). ` +
        `High bytes must be zero, but byte ${i} is 0x${uint256Bytes[i].toString(16)}`
      );
    }
  }

  // Extract the last 8 bytes (u64 portion) - still in big-endian
  const u64Bytes = uint256Bytes.slice(24, 32);

  // Convert from big-endian to BN
  // Note: BN constructor uses big-endian by default
  const amount = new BN(u64Bytes, "be");

  // Validate the value fits in u64 (0 to 2^64-1)
  const U64_MAX = new BN("18446744073709551615"); // 2^64 - 1
  if (amount.gt(U64_MAX)) {
    throw new Error(
      `Amount overflow: value ${amount.toString()} exceeds u64::MAX (${U64_MAX.toString()})`
    );
  }

  return amount;
}

/**
 * Validate token bridge data fields
 *
 * Performs additional validation on decoded token bridge data to ensure
 * all fields are valid before using them in transactions.
 *
 * @param data The decoded token bridge data
 * @throws Error if any field is invalid
 *
 * @example
 * ```typescript
 * const decoded = decodeTokenBridgeData(onChainData);
 * validateTokenBridgeData(decoded); // Throws if invalid
 * ```
 */
export function validateTokenBridgeData(data: TokenBridgeData): void {
  // Validate recipient is not the system program or default pubkey
  if (data.recipient.equals(PublicKey.default)) {
    throw new Error("Invalid recipient: cannot be default pubkey");
  }

  // Validate amount is positive
  if (data.amount.isZero()) {
    throw new Error("Invalid amount: cannot be zero");
  }

  if (data.amount.isNeg()) {
    throw new Error("Invalid amount: cannot be negative");
  }

  // Validate tokenMint is not the system program or default pubkey
  if (data.tokenMint.equals(PublicKey.default)) {
    throw new Error("Invalid token mint: cannot be default pubkey");
  }
}
