/**
 * Via Labs V4 Constants
 *
 * Centralized constants for the Via Labs cross-chain messaging protocol.
 */

import { BN } from "bn.js";
import { PublicKey } from "@solana/web3.js";

// Common chain IDs for reference
export const SOLANA_CHAIN_ID = new BN("9999999999999999999");
export const AVALANCHE_CHAIN_ID = new BN("43113");

// Buffer size constants for PDA derivation
export const CHAIN_ID_BYTES = 8;
export const TX_ID_BYTES = 16;

// Handler Program IDs (Devnet)
// NOTE: These are now loaded dynamically from Anchor.toml by ViaLabsSDK
// These constants are kept for backward compatibility but may be deprecated
// Use ViaLabsSDK instance properties instead
export const FEE_HANDLER_PROGRAM_ID = new PublicKey("2VSo9ub3wPfPsA1FPQbpekgUKZ8wb4diAptrijZ5eCFk");
export const GAS_HANDLER_PROGRAM_ID = new PublicKey("3kxFuY83fNGiq24zfHPHRMhPoXak3bDhHHMGWBwuwqrx");