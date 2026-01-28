/**
 * Via Labs V4 Core Types
 *
 * Minimal generic type definitions to eliminate repetition across the codebase.
 */

import { BN } from "bn.js";
import { PublicKey } from "@solana/web3.js";

// Core type aliases to replace repetitive InstanceType<typeof BN>
export type ChainId = InstanceType<typeof BN>;
export type TxId = InstanceType<typeof BN>;
export type RegistryType = "via" | "chain" | "project";

// Core validation utilities for chain IDs and transaction IDs
export function validateChainId(chainId: ChainId): void {
  if (!chainId || chainId.isNeg()) {
    throw new Error(`Invalid chain ID: ${chainId?.toString() ?? 'null'}`);
  }
}

export function validateTxId(txId: TxId): void {
  if (!txId || txId.isNeg()) {
    throw new Error(`Invalid TX ID: ${txId?.toString() ?? 'null'}`);
  }
}

/**
 * DecodedMessage PDA structure (client-side)
 *
 * This interface matches the Rust struct in client programs that implement
 * the three-transaction pattern. The PDA is created in TX2 (decode_and_store)
 * and consumed in TX3 (execute_stored).
 *
 * Seeds: ["decoded", tx_id (u64 le bytes)]
 *
 * @see contracts/solana/programs/client-test-v4/src/state.rs
 */
export interface DecodedMessagePda {
  /** Transaction ID (u64) */
  txId: InstanceType<typeof BN>;

  /** Source chain sender address (32 bytes) */
  sender: Buffer;

  /** Destination chain ID as string */
  destChainId: string;

  /** Recipient token account on Solana */
  recipient: PublicKey;

  /** Amount of tokens to mint/transfer (u64) */
  amount: InstanceType<typeof BN>;

  /** SPL token mint address */
  tokenMint: PublicKey;

  /** Gateway authority (proves MessageGateway created this PDA) */
  gatewayAuthority: PublicKey;

  /** Creation timestamp (i64 Unix timestamp) */
  createdAt: InstanceType<typeof BN>;

  /** PDA bump seed */
  bump: number;
}

/**
 * Decoded token bridge data from Ethereum ABI encoding
 *
 * This represents the decoded onChainData field from cross-chain messages
 * sent from EVM chains. The Ethereum ClientTestV4.sol encodes this data
 * using Solidity's abi.encode() before sending cross-chain.
 *
 * ABI Layout (96 bytes total):
 * - Bytes 0-31: recipient (Solana pubkey as bytes32)
 * - Bytes 32-63: amount (uint256 in big-endian)
 * - Bytes 64-95: tokenMint (Solana pubkey as bytes32)
 *
 * @see contracts/ethereum/src/ClientTestV4.sol (bridge function)
 */
export interface TokenBridgeData {
  /** Recipient token account on Solana */
  recipient: PublicKey;

  /** Amount of tokens (converted from uint256 to u64) */
  amount: InstanceType<typeof BN>;

  /** SPL token mint address */
  tokenMint: PublicKey;
}

/**
 * FeeConfig PDA structure
 *
 * Global configuration for fee collection via the Fee Handler V4 program.
 * Controls which SPL token is used for fees, minimum fee amounts, and where
 * collected fees are sent.
 *
 * Seeds: ["fee_config", gateway.key()]
 *
 * @see contracts/solana/programs/fee-handler-v4/src/state/fee_config.rs
 */
export interface FeeConfig {
  /** Gateway authority that can update fee configuration */
  authority: PublicKey;

  /** Gateway program this fee handler serves */
  gateway: PublicKey;

  /** SPL token mint used for fee payments (e.g., USDC) */
  feeTokenMint: PublicKey;

  /** Cached decimals for the fee token (6, 9, or 18) */
  feeTokenDecimals: number;

  /** Account where collected fees are sent */
  accountant: PublicKey;

  /** Minimum fee in 6-decimal precision (1_000_000 = 1 token) */
  minFee: InstanceType<typeof BN>;

  /** Emergency flag to disable fee collection */
  takeFeesOffline: boolean;

  /** PDA bump seed */
  bump: number;
}

/**
 * ClientFeeConfig PDA structure
 *
 * Per-client fee overrides allowing custom pricing for specific client programs.
 *
 * Seeds: ["client_fee_config", gateway.key(), client_program.key()]
 *
 * @see contracts/solana/programs/fee-handler-v4/src/state/client_config.rs
 */
export interface ClientFeeConfig {
  /** Client program ID this config applies to */
  clientProgram: PublicKey;

  /** Gateway program key */
  gateway: PublicKey;

  /** Optional custom fee (replaces min_fee if set) */
  customFee?: InstanceType<typeof BN>;

  /** Optional maximum fee cap (protection against excessive fees) */
  maxFee?: InstanceType<typeof BN>;

  /** Magic flag: if true, client pays zero fees (overrides all) */
  zeroFee: boolean;

  /** PDA bump seed */
  bump: number;
}

/**
 * GasConfig PDA structure
 *
 * Global configuration for SOL gas reimbursement via the Gas Handler V4 program.
 * Controls how much SOL relayers receive for processing messages.
 *
 * Seeds: ["gas_config", gateway.key()]
 *
 * @see contracts/solana/programs/gas-handler-v4/src/state/gas_config.rs
 */
export interface GasConfig {
  /** Gateway authority that can update gas configuration */
  authority: PublicKey;

  /** Gateway program this gas handler serves */
  gateway: PublicKey;

  /** Fixed SOL amount reimbursed per transaction (lamports) */
  baseReimbursement: InstanceType<typeof BN>;

  /** Maximum SOL reimbursement allowed (safety cap, lamports) */
  maxReimbursement: InstanceType<typeof BN>;

  /** Whether gas reimbursement is enabled */
  enabled: boolean;

  /** PDA bump seed */
  bump: number;
}

/**
 * ClientGasConfig PDA structure
 *
 * Per-client gas reimbursement overrides allowing custom caps for specific clients.
 *
 * Seeds: ["client_gas_config", gateway.key(), client_program.key()]
 *
 * @see contracts/solana/programs/gas-handler-v4/src/state/client_config.rs
 */
export interface ClientGasConfig {
  /** Client program ID this config applies to */
  clientProgram: PublicKey;

  /** Gateway program key */
  gateway: PublicKey;

  /** Optional client-specific gas cap (overrides base if set) */
  maxGasOverride?: InstanceType<typeof BN>;

  /** FUTURE: SPL token mint for gas payment (for non-SOL gas) */
  gasTokenMint: PublicKey;

  /** Whether gas reimbursement is enabled for this client */
  enabled: boolean;

  /** PDA bump seed */
  bump: number;
}

/**
 * GasPool PDA structure
 *
 * Holds the SOL pool used for gas reimbursements. Funded by the protocol
 * and distributed to relayers as they process messages.
 *
 * Seeds: ["gas_pool", gateway.key()]
 *
 * @see contracts/solana/programs/gas-handler-v4/src/state/gas_pool.rs
 */
export interface GasPool {
  /** Gateway program this pool serves */
  gateway: PublicKey;

  /** Authority that can fund or withdraw from the pool */
  authority: PublicKey;

  /** PDA bump seed */
  bump: number;
}