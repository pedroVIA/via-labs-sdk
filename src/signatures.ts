/**
 * Signature utilities for Via Labs V4 protocol
 *
 * Uses native @solana/web3.js Ed25519 implementation for maximum compatibility
 * and performance with the Solana ecosystem.
 *
 * CRITICAL: Via Labs V4 Protocol Requirement - Keccak256 Hashing
 *
 * We use Keccak256 instead of Solana's native SHA256 because:
 * 1. Via Labs validators on all chains expect Keccak256 message hashes
 * 2. Changing would break cross-chain message verification with Ethereum/EVM chains
 * 3. The 5,000 CU cost (vs 100 for SHA256) is acceptable overhead for protocol compatibility
 * 4. All existing Via Labs infrastructure uses Keccak256 - this maintains consistency
 *
 * This is a PROTOCOL requirement for cross-chain compatibility, not a Solana best practice.
 */

import { PublicKey, TransactionInstruction, Ed25519Program, Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import BN from 'bn.js';
import sha3 from 'js-sha3';
import { encodeViaMessage } from './encoding.js';

export interface MessageSignature {
  signature: Buffer;
  signer: PublicKey;
}

/**
 * Create message hash using the exact same algorithm as the Solana program
 * This must match the hashing logic in programs/message_gateway_v4/src/utils/hash.rs
 *
 * Now uses the shared encodeViaMessage() function to ensure consistency
 */
export function createMessageHash(
  txId: BN,
  sourceChainId: BN,
  destChainId: BN,
  sender: Buffer,
  recipient: Buffer,
  onChainData: Buffer,
  offChainData: Buffer
): Buffer {
  // Use the shared encoding function from encoding.ts
  const encoded = encodeViaMessage(
    txId,
    sourceChainId,
    destChainId,
    sender,
    recipient,
    onChainData,
    offChainData
  );

  // Use Keccak256 (same as Rust keccak::hash)
  const hash = sha3.keccak_256(encoded);
  return Buffer.from(hash, 'hex');
}

/**
 * Create Ed25519 signature verification instruction
 * Uses the built-in Ed25519Program.createInstructionWithPublicKey() method
 */
export function createEd25519Instruction(
  signature: Buffer,
  publicKey: PublicKey,
  message: Buffer
): TransactionInstruction {
  // Use the official @solana/web3.js method to create Ed25519 instruction
  return Ed25519Program.createInstructionWithPublicKey({
    publicKey: publicKey.toBytes(),
    message: new Uint8Array(message),
    signature: new Uint8Array(signature),
  });
}

/**
 * Sign a message using Ed25519 via tweetnacl
 * This is the same method used internally by @solana/web3.js v1.x
 */
export function signMessage(message: Buffer, keypair: Keypair): Buffer {
  const messageBytes = new Uint8Array(message);
  const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
  return Buffer.from(signature);
}

/**
 * Create a message signature from a keypair
 * This is the main function to use for creating signatures
 */
export function createMessageSignature(
  txId: BN,
  sourceChainId: BN,
  destChainId: BN,
  sender: Buffer,
  recipient: Buffer,
  onChainData: Buffer,
  offChainData: Buffer,
  keypair: Keypair
): MessageSignature {
  const messageHash = createMessageHash(
    txId,
    sourceChainId,
    destChainId,
    sender,
    recipient,
    onChainData,
    offChainData
  );

  const signature = signMessage(messageHash, keypair);

  return {
    signature,
    signer: keypair.publicKey,
  };
}

