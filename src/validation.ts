/**
 * Validation Utilities for Via Labs V4 Client Programs
 *
 * This module provides validation helpers for client programs implementing
 * the decode_and_store and execute_stored instructions in the three-transaction
 * pattern. These validations ensure security constraints are enforced consistently.
 *
 * SECURITY CRITICAL: These validations protect against unauthorized message
 * processing and ensure only the MessageGateway can trigger client operations.
 */

import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import type { DecodedMessagePda } from "./types.js";

/**
 * Validate that the gateway authority matches the expected MessageGateway program ID
 *
 * This validation is CRITICAL in the execute_stored instruction to ensure that
 * the DecodedMessage PDA was created by the legitimate MessageGateway program,
 * not by a malicious actor trying to mint unauthorized tokens.
 *
 * @param providedAuthority The gateway_authority field from the DecodedMessage PDA
 * @param expectedGatewayProgramId The known MessageGateway program ID
 * @throws Error if the authority doesn't match
 *
 * @example
 * ```typescript
 * import { validateGatewayAuthority } from '@via-labs/sdk';
 * import { PublicKey } from '@solana/web3.js';
 *
 * const GATEWAY_PROGRAM_ID = new PublicKey("5Q1P3si7gndHcudp9CApeqtYYCSVitwVcTX1UvrXiu5q");
 *
 * // In execute_stored handler:
 * const decodedMessage = await program.account.decodedMessagePda.fetch(decodedMessagePda);
 * validateGatewayAuthority(decodedMessage.gatewayAuthority, GATEWAY_PROGRAM_ID);
 * ```
 *
 * @see contracts/solana/programs/client-test-v4/src/instructions/execute_stored.rs (line 337-341)
 */
export function validateGatewayAuthority(
  providedAuthority: PublicKey,
  expectedGatewayProgramId: PublicKey
): void {
  if (!providedAuthority.equals(expectedGatewayProgramId)) {
    throw new Error(
      `Invalid gateway authority: expected ${expectedGatewayProgramId.toBase58()}, ` +
      `got ${providedAuthority.toBase58()}. ` +
      `This DecodedMessage PDA was not created by the legitimate MessageGateway.`
    );
  }
}

/**
 * Validate that an amount is reasonable for token operations
 *
 * Ensures the amount is:
 * - Greater than zero (no zero-value transfers)
 * - Fits within u64 range (0 to 2^64-1)
 * - Not negative
 *
 * @param amount The amount to validate (as BN)
 * @throws Error if the amount is invalid
 *
 * @example
 * ```typescript
 * import { validateAmount } from '@via-labs/sdk';
 * import BN from 'bn.js';
 *
 * const amount = new BN(1000);
 * validateAmount(amount); // OK
 *
 * const zeroAmount = new BN(0);
 * validateAmount(zeroAmount); // Throws: "Amount cannot be zero"
 * ```
 *
 * @see contracts/solana/programs/client-test-v4/src/instructions/execute_stored.rs (line 344-345)
 */
export function validateAmount(amount: BN): void {
  // Check for zero
  if (amount.isZero()) {
    throw new Error("Amount cannot be zero");
  }

  // Check for negative (should never happen with BN from u64, but validate anyway)
  if (amount.isNeg()) {
    throw new Error("Amount cannot be negative");
  }

  // Check u64 range (0 to 2^64-1)
  const U64_MAX = new BN("18446744073709551615"); // 2^64 - 1
  if (amount.gt(U64_MAX)) {
    throw new Error(
      `Amount overflow: ${amount.toString()} exceeds u64::MAX (${U64_MAX.toString()})`
    );
  }
}

/**
 * Validate that a PublicKey is not a default/system key
 *
 * Ensures the key is a valid, non-default public key that can be used
 * for token accounts, mints, or other program accounts.
 *
 * @param key The PublicKey to validate
 * @param fieldName Name of the field for error messages
 * @throws Error if the key is invalid
 *
 * @example
 * ```typescript
 * import { validatePublicKey } from '@via-labs/sdk';
 * import { PublicKey } from '@solana/web3.js';
 *
 * const recipient = new PublicKey("...");
 * validatePublicKey(recipient, "recipient");
 *
 * const defaultKey = PublicKey.default;
 * validatePublicKey(defaultKey, "recipient"); // Throws: "Invalid recipient"
 * ```
 */
export function validatePublicKey(key: PublicKey, fieldName: string): void {
  if (key.equals(PublicKey.default)) {
    throw new Error(
      `Invalid ${fieldName}: cannot be default pubkey (11111111111111111111111111111111)`
    );
  }
}

/**
 * Validate all fields in a DecodedMessage PDA
 *
 * Performs comprehensive validation on a DecodedMessage PDA structure before
 * using it in the execute_stored instruction. This is a convenience function
 * that combines multiple validations.
 *
 * Validates:
 * - Gateway authority matches expected program ID
 * - Amount is positive and within u64 range
 * - Recipient is not a default pubkey
 * - Token mint is not a default pubkey
 * - Transaction ID is positive
 *
 * @param decodedMessage The DecodedMessage PDA to validate
 * @param expectedGatewayProgramId The known MessageGateway program ID
 * @throws Error if any field is invalid
 *
 * @example
 * ```typescript
 * import { validateDecodedMessage } from '@via-labs/sdk';
 * import { PublicKey } from '@solana/web3.js';
 *
 * const GATEWAY_PROGRAM_ID = new PublicKey("5Q1P3si7gndHcudp9CApeqtYYCSVitwVcTX1UvrXiu5q");
 *
 * // In execute_stored handler:
 * const decodedMessage = await program.account.decodedMessagePda.fetch(decodedMessagePda);
 * validateDecodedMessage(decodedMessage, GATEWAY_PROGRAM_ID);
 * // If no error thrown, all validations passed
 * ```
 */
export function validateDecodedMessage(
  decodedMessage: DecodedMessagePda,
  expectedGatewayProgramId: PublicKey
): void {
  // Validate gateway authority (CRITICAL for security)
  validateGatewayAuthority(decodedMessage.gatewayAuthority, expectedGatewayProgramId);

  // Validate amount
  validateAmount(decodedMessage.amount);

  // Validate recipient
  validatePublicKey(decodedMessage.recipient, "recipient");

  // Validate token mint
  validatePublicKey(decodedMessage.tokenMint, "tokenMint");

  // Validate txId is positive
  if (decodedMessage.txId.isZero() || decodedMessage.txId.isNeg()) {
    throw new Error("Invalid txId: must be positive");
  }

  // Validate destChainId is not empty
  if (!decodedMessage.destChainId || decodedMessage.destChainId.trim().length === 0) {
    throw new Error("Invalid destChainId: cannot be empty");
  }

  // Validate sender is not empty (32 bytes)
  if (!decodedMessage.sender || decodedMessage.sender.length !== 32) {
    throw new Error("Invalid sender: must be 32 bytes");
  }
}

/**
 * Validate that a caller is authorized to invoke decode_and_store
 *
 * The decode_and_store instruction MUST only be callable via CPI from the
 * MessageGateway program. This validation should be performed at the start
 * of the decode_and_store handler.
 *
 * Note: In Rust programs, this is enforced using the `invoke` stack depth
 * check and validating ctx.accounts.gateway_program.key() matches the expected ID.
 * This TypeScript function is for client-side validation before sending transactions.
 *
 * @param gatewayProgramId The program ID attempting to call decode_and_store
 * @param expectedGatewayProgramId The known MessageGateway program ID
 * @throws Error if the caller is not authorized
 *
 * @example
 * ```typescript
 * import { validateDecodeAndStoreCaller } from '@via-labs/sdk';
 * import { PublicKey } from '@solana/web3.js';
 *
 * const GATEWAY_PROGRAM_ID = new PublicKey("5Q1P3si7gndHcudp9CApeqtYYCSVitwVcTX1UvrXiu5q");
 *
 * // Before constructing decode_and_store transaction:
 * validateDecodeAndStoreCaller(gatewayProgramId, GATEWAY_PROGRAM_ID);
 * ```
 *
 * @see contracts/solana/programs/client-test-v4/src/instructions/decode_and_store.rs (line 238-242)
 */
export function validateDecodeAndStoreCaller(
  gatewayProgramId: PublicKey,
  expectedGatewayProgramId: PublicKey
): void {
  if (!gatewayProgramId.equals(expectedGatewayProgramId)) {
    throw new Error(
      `Unauthorized caller: decode_and_store can only be called by MessageGateway. ` +
      `Expected ${expectedGatewayProgramId.toBase58()}, got ${gatewayProgramId.toBase58()}`
    );
  }
}
