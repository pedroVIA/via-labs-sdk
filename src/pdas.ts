/**
 * Via Labs V4 PDA Utilities
 *
 * Brutally competent, chain-agnostic PDA derivation with validation and error handling.
 */

import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import type { MessageGatewayV4 } from "./types/message_gateway_v4.js";
import type { ChainId, TxId, RegistryType } from "./types.js";
import { validateChainId, validateTxId } from "./types.js";
import { CHAIN_ID_BYTES, TX_ID_BYTES } from "./constants.js";

/**
 * Convert registry type to discriminant value (matches Rust enum discriminants)
 */
function registryTypeToDiscriminant(registryType: RegistryType): number {
  switch (registryType) {
    case "via": return 0;
    case "chain": return 1;
    case "project": return 2;
    default:
      throw new Error(`Invalid registry type: ${registryType}`);
  }
}

/**
 * Brutally competent PDA utilities with validation and error handling
 */
export class ViaLabsPDAs {
  constructor(private program: Program<MessageGatewayV4>) {}

  /**
   * Get gateway PDA for a specific chain
   * @param chainId The chain ID for the gateway
   */
  getGatewayPda(chainId: ChainId): PublicKey {
    validateChainId(chainId);

    const [gatewayPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("gateway"), chainId.toArrayLike(Buffer, "le", CHAIN_ID_BYTES)],
      this.program.programId
    );
    return gatewayPda;
  }

  /**
   * Get signer registry PDA for a specific registry type and chain
   * @param registryType The type of registry (via, chain, or project)
   * @param chainId The chain ID for the registry
   */
  getSignerRegistryPda(registryType: RegistryType, chainId: ChainId): PublicKey {
    validateChainId(chainId);

    // Use simple discriminant bytes to match Rust: registry_type.discriminant().to_le_bytes()
    const discriminantBuffer = Buffer.from([registryTypeToDiscriminant(registryType)]);

    const [signerRegistryPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("signer_registry"),
        discriminantBuffer,
        chainId.toArrayLike(Buffer, "le", CHAIN_ID_BYTES)
      ],
      this.program.programId
    );
    return signerRegistryPda;
  }

  /**
   * Get counter PDA for a specific source chain
   * Tracks highest tx_id seen FROM each source chain (for incoming messages)
   * @param sourceChainId The source chain ID for the counter
   */
  getCounterPda(sourceChainId: ChainId): PublicKey {
    validateChainId(sourceChainId);

    const [counterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), sourceChainId.toArrayLike(Buffer, "le", CHAIN_ID_BYTES)],
      this.program.programId
    );
    return counterPda;
  }

  /**
   * Get tx_counter PDA for a specific chain (for outgoing messages)
   * @param chainId The chain ID for the tx counter
   */
  getTxCounterPda(chainId: ChainId): PublicKey {
    validateChainId(chainId);

    const [txCounterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("tx_counter"), chainId.toArrayLike(Buffer, "le", CHAIN_ID_BYTES)],
      this.program.programId
    );
    return txCounterPda;
  }

  /**
   * Get TX ID PDA for replay protection
   * @param sourceChainId The source chain ID for the transaction
   * @param txId The transaction ID
   */
  getTxIdPda(sourceChainId: ChainId, txId: TxId): PublicKey {
    validateChainId(sourceChainId);
    validateTxId(txId);

    const [txIdPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("tx"),
        sourceChainId.toArrayLike(Buffer, "le", CHAIN_ID_BYTES),
        txId.toArrayLike(Buffer, "le", TX_ID_BYTES)
      ],
      this.program.programId
    );
    return txIdPda;
  }

  /**
   * Get FeeConfig PDA for the fee handler
   * @param gatewayKey The gateway PublicKey
   * @param feeHandlerProgramId The fee handler program ID
   */
  getFeeConfigPda(gatewayKey: PublicKey, feeHandlerProgramId: PublicKey): PublicKey {
    const [feeConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fee_config"), gatewayKey.toBuffer()],
      feeHandlerProgramId
    );
    return feeConfigPda;
  }

  /**
   * Get ClientFeeConfig PDA for per-client fee overrides
   * @param gatewayKey The gateway PublicKey
   * @param clientProgramId The client program ID
   * @param feeHandlerProgramId The fee handler program ID
   */
  getClientFeeConfigPda(
    gatewayKey: PublicKey,
    clientProgramId: PublicKey,
    feeHandlerProgramId: PublicKey
  ): PublicKey {
    const [clientFeeConfigPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("client_fee_config"),
        gatewayKey.toBuffer(),
        clientProgramId.toBuffer()
      ],
      feeHandlerProgramId
    );
    return clientFeeConfigPda;
  }

  /**
   * Get GasConfig PDA for the gas handler
   * @param gatewayKey The gateway PublicKey
   * @param gasHandlerProgramId The gas handler program ID
   */
  getGasConfigPda(gatewayKey: PublicKey, gasHandlerProgramId: PublicKey): PublicKey {
    const [gasConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("gas_config"), gatewayKey.toBuffer()],
      gasHandlerProgramId
    );
    return gasConfigPda;
  }

  /**
   * Get ClientGasConfig PDA for per-client gas overrides
   * @param gatewayKey The gateway PublicKey
   * @param clientProgramId The client program ID
   * @param gasHandlerProgramId The gas handler program ID
   */
  getClientGasConfigPda(
    gatewayKey: PublicKey,
    clientProgramId: PublicKey,
    gasHandlerProgramId: PublicKey
  ): PublicKey {
    const [clientGasConfigPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("client_gas_config"),
        gatewayKey.toBuffer(),
        clientProgramId.toBuffer()
      ],
      gasHandlerProgramId
    );
    return clientGasConfigPda;
  }

  /**
   * Get GasPool PDA for the gas handler
   * @param gatewayKey The gateway PublicKey
   * @param gasHandlerProgramId The gas handler program ID
   */
  getGasPoolPda(gatewayKey: PublicKey, gasHandlerProgramId: PublicKey): PublicKey {
    const [gasPoolPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("gas_pool"), gatewayKey.toBuffer()],
      gasHandlerProgramId
    );
    return gasPoolPda;
  }
}

/**
 * Derive DecodedMessage PDA for a client program (three-transaction pattern)
 *
 * In the three-transaction pattern, the DecodedMessage PDA is created in TX2
 * (decode_and_store instruction) and consumed in TX3 (execute_stored instruction).
 * This PDA stores the decoded onChainData (recipient, amount, tokenMint) so that
 * TX3 can provide the correct accounts without needing to decode the data again.
 *
 * Seeds: ["decoded", tx_id (u64 le bytes)]
 *
 * @param txId The transaction ID (u64) - must match the txId from the cross-chain message
 * @param clientProgramId The client program ID that owns this PDA (e.g., ClientTestV4)
 * @returns Tuple of [PublicKey, bump] where PublicKey is the derived PDA address
 *
 * @example
 * ```typescript
 * import { deriveDecodedMessagePda } from '@via-labs/sdk';
 * import BN from 'bn.js';
 * import { PublicKey } from '@solana/web3.js';
 *
 * const txId = new BN(12345);
 * const clientProgramId = new PublicKey("EdL6j6sckXrgEBApimg6CW4kcY7fzniav2Kt4vGceW8s");
 * const [decodedMessagePda, bump] = deriveDecodedMessagePda(txId, clientProgramId);
 * ```
 *
 * @see contracts/solana/programs/client-test-v4/src/instructions/decode_and_store.rs
 * @see contracts/solana/programs/client-test-v4/src/instructions/execute_stored.rs
 */
export function deriveDecodedMessagePda(
  txId: TxId,
  clientProgramId: PublicKey
): [PublicKey, number] {
  validateTxId(txId);

  const [decodedMessagePda, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("decoded"),
      txId.toArrayLike(Buffer, "le", 8)  // u64 in little-endian (8 bytes)
    ],
    clientProgramId
  );

  return [decodedMessagePda, bump];
}
