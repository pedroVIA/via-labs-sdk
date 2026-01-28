/**
 * Via Labs V4 Client Library
 *
 * Main exports for client utilities.
 */

export { ViaLabsClient, createClient } from "./connection.js";
export { ViaLabsPDAs, deriveDecodedMessagePda } from "./pdas.js";
export type {
  ChainId,
  TxId,
  RegistryType,
  DecodedMessagePda,
  TokenBridgeData,
  FeeConfig,
  ClientFeeConfig,
  GasConfig,
  ClientGasConfig,
  GasPool
} from "./types.js";
export { validateChainId, validateTxId } from "./types.js";
export { SOLANA_CHAIN_ID, AVALANCHE_CHAIN_ID, CHAIN_ID_BYTES, TX_ID_BYTES } from "./constants.js";
export { ViaLabsSDK, createSDK } from "./sdk.js";
export type { MessageSignature } from "./signatures.js";
export {
  createMessageHash,
  createEd25519Instruction,
  signMessage,
  createMessageSignature
} from "./signatures.js";
export type { DecodedViaMessage } from "./encoding.js";
export {
  encodeViaMessage,
  decodeViaMessage,
  validateMessageEncoding
} from "./encoding.js";
export {
  decodeTokenBridgeData,
  u256ToU64,
  validateTokenBridgeData
} from "./abi.js";
export {
  validateGatewayAuthority,
  validateAmount,
  validatePublicKey,
  validateDecodedMessage,
  validateDecodeAndStoreCaller
} from "./validation.js";