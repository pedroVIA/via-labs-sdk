/**
 * Via Labs V4 SDK
 *
 * Atomic operations for the Via Labs cross-chain messaging protocol.
 * Provides building blocks for composing complex workflows.
 * No opinionated patterns - maximum flexibility.
 */

import { AnchorProvider } from "@coral-xyz/anchor";
import {
  PublicKey,
  Transaction,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  TransactionMessage,
  VersionedTransaction,
  AddressLookupTableAccount,
  SystemProgram
} from "@solana/web3.js";
import { ViaLabsClient } from "./connection.js";
import { ViaLabsPDAs } from "./pdas.js";
import type { ChainId, TxId, RegistryType } from "./types.js";
import { createMessageHash, createEd25519Instruction } from "./signatures.js";
import type { MessageSignature } from "./signatures.js";
import { Program, BN } from "@coral-xyz/anchor";
import type { FeeHandlerV4 } from "./types/fee_handler_v4.js";
import type { GasHandlerV4 } from "./types/gas_handler_v4.js";
import FeeHandlerIDL from "./idl/fee_handler_v4.json" with { type: "json" };
import GasHandlerIDL from "./idl/gas_handler_v4.json" with { type: "json" };
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Options for SDK initialization
 */
export interface ViaLabsSDKOptions {
  client?: ViaLabsClient;
  feeHandlerProgramId?: PublicKey;
  gasHandlerProgramId?: PublicKey;
}

/**
 * Load handler program IDs from Anchor.toml
 */
function loadHandlerProgramIdsFromAnchorToml(): { feeHandler: PublicKey | null; gasHandler: PublicKey | null } {
  try {
    const tomlPath = resolve(process.cwd(), 'contracts/solana/Anchor.toml');
    const tomlContent = readFileSync(tomlPath, 'utf8');

    const feeMatch = tomlContent.match(/fee_handler_v4\s*=\s*"([^"]*)"/);
    const gasMatch = tomlContent.match(/gas_handler_v4\s*=\s*"([^"]*)"/);

    return {
      feeHandler: feeMatch ? new PublicKey(feeMatch[1]) : null,
      gasHandler: gasMatch ? new PublicKey(gasMatch[1]) : null
    };
  } catch (error) {
    // Silently return null - will use defaults
    return { feeHandler: null, gasHandler: null };
  }
}

/**
 * Main SDK class - atomic operations for Via Labs protocol
 */
export class ViaLabsSDK {
  private client: ViaLabsClient;
  private pdas: ViaLabsPDAs;
  private lookupTableAccount: AddressLookupTableAccount | null = null;
  private feeHandlerProgram: Program<FeeHandlerV4>;
  private gasHandlerProgram: Program<GasHandlerV4>;
  private feeHandlerProgramId: PublicKey;
  private gasHandlerProgramId: PublicKey;

  constructor(options?: ViaLabsSDKOptions) {
    this.client = options?.client || new ViaLabsClient();
    this.pdas = new ViaLabsPDAs(this.client.program);

    // Load handler program IDs: priority is options > Anchor.toml > hardcoded defaults
    const anchorTomlIds = loadHandlerProgramIdsFromAnchorToml();

    // Default fallback IDs (original production IDs)
    const DEFAULT_FEE_HANDLER = new PublicKey("2VSo9ub3wPfPsA1FPQbpekgUKZ8wb4diAptrijZ5eCFk");
    const DEFAULT_GAS_HANDLER = new PublicKey("3kxFuY83fNGiq24zfHPHRMhPoXak3bDhHHMGWBwuwqrx");

    this.feeHandlerProgramId = options?.feeHandlerProgramId || anchorTomlIds.feeHandler || DEFAULT_FEE_HANDLER;
    this.gasHandlerProgramId = options?.gasHandlerProgramId || anchorTomlIds.gasHandler || DEFAULT_GAS_HANDLER;

    console.log(`📋 Fee Handler Program ID: ${this.feeHandlerProgramId.toBase58()}`);
    console.log(`📋 Gas Handler Program ID: ${this.gasHandlerProgramId.toBase58()}`);

    // Initialize fee handler program
    this.feeHandlerProgram = new Program<FeeHandlerV4>(
      FeeHandlerIDL as any,
      this.client.program.provider
    );

    // Initialize gas handler program
    this.gasHandlerProgram = new Program<GasHandlerV4>(
      GasHandlerIDL as any,
      this.client.program.provider
    );
  }

  /**
   * Common retry logic with exponential backoff
   * @param name - Operation name for error messages
   * @param operation - Async operation to retry
   * @param maxRetries - Maximum retry attempts (default: 3)
   */
  private async executeWithRetry<T>(
    name: string,
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Don't retry on known user errors
        const nonRetryableErrors = [
          'already in use',
          'invalid',
          'insufficient',
          'TxIdAlreadyExists',
          'TxIdNotFound',
          'SystemDisabled',
          'SignerNotRegistered',
        ];

        const isNonRetryable = nonRetryableErrors.some(err =>
          error.message?.toLowerCase().includes(err.toLowerCase())
        );

        if (isNonRetryable) {
          throw new Error(`${name} failed: ${error.message || error}`);
        }

        // Retry on network/RPC errors
        if (attempt < maxRetries) {
          const backoffMs = 1000 * Math.pow(2, attempt - 1); // Exponential backoff: 1s, 2s, 4s
          console.warn(`${name} attempt ${attempt} failed, retrying in ${backoffMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
      }
    }

    throw new Error(`${name} failed after ${maxRetries} attempts: ${lastError?.message || lastError}`);
  }

  /**
   * Execute transaction with retry logic and error handling
   * @param name - Operation name for error messages
   * @param txBuilder - Function that returns transaction signature
   * @param maxRetries - Maximum retry attempts (default: 3)
   */
  private async executeTransaction(
    name: string,
    txBuilder: () => Promise<string>,
    maxRetries: number = 3
  ): Promise<string> {
    return this.executeWithRetry(name, async () => {
      const signature = await txBuilder();

      // Confirm transaction
      const confirmation = await this.client.connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      return signature;
    }, maxRetries);
  }

  /**
   * Execute V0 transaction with retry logic
   * @param name - Operation name for error messages
   * @param instructions - Array of transaction instructions
   * @param maxRetries - Maximum retry attempts (default: 3)
   */
  private async executeV0Transaction(
    name: string,
    instructions: any[],
    maxRetries: number = 3
  ): Promise<string> {
    if (!this.lookupTableAccount) {
      throw new Error('Lookup table not loaded. Call loadLookupTable() first.');
    }

    return this.executeWithRetry(name, async () => {
      const recentBlockhash = await this.client.connection.getLatestBlockhash();

      const messageV0 = new TransactionMessage({
        payerKey: this.client.wallet.publicKey,
        recentBlockhash: recentBlockhash.blockhash,
        instructions: instructions,
      }).compileToV0Message([this.lookupTableAccount!]);

      const versionedTx = new VersionedTransaction(messageV0);
      versionedTx.sign([this.client.wallet.payer]);

      const signature = await this.client.connection.sendTransaction(versionedTx);
      await this.client.connection.confirmTransaction({
        signature,
        blockhash: recentBlockhash.blockhash,
        lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
      });

      return signature;
    }, maxRetries);
  }

  /**
   * Load Address Lookup Table for versioned transactions
   * Required for V0 transactions. Enables up to 3 signatures per transaction (saves ~280 bytes)
   */
  async loadLookupTable(lookupTableAddress: PublicKey): Promise<void> {
    const lookupTableAccountInfo = await this.client.connection.getAddressLookupTable(lookupTableAddress);

    if (!lookupTableAccountInfo.value) {
      throw new Error(`Lookup table not found: ${lookupTableAddress.toBase58()}`);
    }

    this.lookupTableAccount = lookupTableAccountInfo.value;
    console.log(`✅ Loaded ALT with ${this.lookupTableAccount.state.addresses.length} addresses`);

    // Validate that gas handler program is in ALT (required since v2.0.0)
    const addresses = this.lookupTableAccount.state.addresses;
    const gasHandlerProgramId = this.gasHandlerProgramId;

    const hasGasHandler = addresses.some(addr => addr.equals(gasHandlerProgramId));

    if (!hasGasHandler) {
      console.warn(
        `⚠️  WARNING: Gas handler program not found in ALT.\n` +
        `   This deployment appears to be from a version before v2.0.0.\n` +
        `   Gas handler operations may fail.\n` +
        `   Please redeploy the gateway to add gas accounts to ALT.\n` +
        `   ALT address: ${lookupTableAddress.toBase58()}\n` +
        `   Expected gas handler: ${gasHandlerProgramId.toBase58()}`
      );
    } else {
      console.log(`✅ Gas handler program found in ALT`);
    }
  }

  // ============= Gateway Operations =============

  async initializeGateway(chainId: ChainId): Promise<string> {
    return this.executeTransaction(
      'initializeGateway',
      () => this.client.program.methods
        .initializeGateway(chainId)
        .accountsPartial({
          gateway: this.pdas.getGatewayPda(chainId),
          counter: this.pdas.getTxCounterPda(chainId),
          authority: this.client.wallet.publicKey,
        })
        .rpc()
    );
  }

  async setSystemEnabled(chainId: ChainId, enabled: boolean): Promise<string> {
    return this.executeTransaction(
      'setSystemEnabled',
      () => this.client.program.methods
        .setSystemEnabled(enabled)
        .accountsPartial({
          gateway: this.pdas.getGatewayPda(chainId),
          authority: this.client.wallet.publicKey,
        })
        .rpc()
    );
  }

  /**
   * ⚠️ INTERNAL USE ONLY - Do not call directly from user applications!
   *
   * This method is for ClientTest programs to call via CPI when bridging tokens.
   * End users should NEVER call this directly. Instead, users should interact with
   * ClientTest programs (e.g., ClientTest.bridge_tokens()) which handle application
   * logic (burning tokens, encoding data) before calling the Gateway.
   *
   * Architecture: User → ClientTest → Gateway (this method)
   *
   * Send a cross-chain message directly to Gateway (tx_id auto-generated from counter)
   * @param chainId Source chain ID
   * @param programId Client Program ID (for PDA verification and event emission)
   * @param recipient Recipient address on destination chain
   * @param destChainId Destination chain ID
   * @param chainData On-chain data for the message
   * @param confirmations Number of confirmations required (default: 32)
   * @internal
   */
  async _sendMessageInternal(
    chainId: ChainId,
    programId: PublicKey,
    recipient: Buffer,
    destChainId: ChainId,
    chainData: Buffer,
    confirmations: number = 32
  ): Promise<string> {
    return this.executeTransaction(
      '_sendMessageInternal',
      () => this.client.program.methods
        .sendMessage(
          programId,
          recipient,
          destChainId,
          chainData,
          confirmations
        )
        .accountsPartial({
          gateway: this.pdas.getGatewayPda(chainId),
          counter: this.pdas.getTxCounterPda(chainId),
          sender: this.client.wallet.publicKey,
          senderProgram: programId,
        })
        .rpc()
    );
  }

  // ============= Message Operations (Signature-Enabled) =============

  /**
   * Create TxId PDA with real Ed25519 signature validation
   * Replaces createTxPda for production use with real signatures
   */
  async createTxPdaWithSignatures(
    txId: TxId,
    sourceChainId: ChainId,
    destChainId: ChainId,
    sender: Buffer,
    recipient: Buffer,
    onChainData: Buffer,
    offChainData: Buffer,
    signatures: MessageSignature[]
  ): Promise<string> {
    const tx = new Transaction();

    // Add Ed25519 instructions first
    const messageHash = createMessageHash(
      txId, sourceChainId, destChainId, sender, recipient, onChainData, offChainData
    );

    for (const sig of signatures) {
      tx.add(createEd25519Instruction(sig.signature, sig.signer, messageHash));
    }

    // Add main instruction (AUTO-DISCOVERY: no signatures parameter)
    const instruction = await this.client.program.methods
      .createTxPda(
        txId,
        sourceChainId,
        destChainId,
        sender,
        recipient,
        onChainData,
        offChainData
        // AUTO-DISCOVERY: formatSignaturesForAnchor(signatures) removed
      )
      .accountsPartial({
        txIdPda: this.pdas.getTxIdPda(sourceChainId, txId),
        counterPda: this.pdas.getCounterPda(sourceChainId),
        relayer: this.client.wallet.publicKey,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .instruction();

    tx.add(instruction);
    return await (this.client.program.provider as AnchorProvider).sendAndConfirm(tx);
  }

  /**
   * Process message with real Ed25519 signature validation
   * Replaces processMessage for production use with real signatures
   * @param includeProjectRegistry - Whether to include project registry validation (default: false)
   */
  async processMessageWithSignatures(
    txId: TxId,
    sourceChainId: ChainId,
    destChainId: ChainId,
    sender: Buffer,
    recipient: Buffer,
    onChainData: Buffer,
    offChainData: Buffer,
    signatures: MessageSignature[],
    includeProjectRegistry: boolean = false
  ): Promise<string> {
    const tx = new Transaction();

    const messageHash = createMessageHash(
      txId, sourceChainId, destChainId, sender, recipient, onChainData, offChainData
    );

    for (const sig of signatures) {
      tx.add(createEd25519Instruction(sig.signature, sig.signer, messageHash));
    }

    const accounts: any = {
      gateway: this.pdas.getGatewayPda(destChainId),
      txIdPda: this.pdas.getTxIdPda(sourceChainId, txId),
      viaRegistry: this.pdas.getSignerRegistryPda("via", destChainId),
      chainRegistry: this.pdas.getSignerRegistryPda("chain", sourceChainId),
      relayer: this.client.wallet.publicKey,
      instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      systemProgram: SystemProgram.programId,
      // Gas Handler Accounts (enabled for production)
      gasHandlerProgram: this.gasHandlerProgramId,
      gasConfig: this.pdas.getGasConfigPda(this.pdas.getGatewayPda(destChainId), this.gasHandlerProgramId),
      clientGasConfig: null,  // Client program ID not available in this method signature
      gasPool: this.pdas.getGasPoolPda(this.pdas.getGatewayPda(destChainId), this.gasHandlerProgramId),
    };

    // Only include project registry if requested
    if (includeProjectRegistry) {
      accounts.projectRegistry = this.pdas.getSignerRegistryPda("project", destChainId);
    } else {
      accounts.projectRegistry = null;  // Explicitly pass null for optional account
    }

    const instruction = await this.client.program.methods
      .processMessage(
        txId,
        sourceChainId,
        destChainId,
        sender,
        recipient,
        onChainData,
        offChainData
        // AUTO-DISCOVERY: formatSignaturesForAnchor(signatures) removed
      )
      .accountsPartial(accounts)
      .instruction();

    tx.add(instruction);
    return await (this.client.program.provider as AnchorProvider).sendAndConfirm(tx);
  }

  /**
   * Create TxId PDA with versioned transaction (uses ALT for ~280 byte savings)
   * Maximum 3 signatures supported for V0 transactions to prevent size limit issues
   */
  async createTxPdaWithSignaturesV0(
    txId: TxId,
    sourceChainId: ChainId,
    destChainId: ChainId,
    sender: Buffer,
    recipient: Buffer,
    onChainData: Buffer,
    offChainData: Buffer,
    signatures: MessageSignature[]
  ): Promise<string> {
    // Validate signature count (V0 transaction size limit)
    const MAX_SIGNATURES_V0 = 3;
    if (signatures.length > MAX_SIGNATURES_V0) {
      throw new Error(
        `Too many signatures for V0 transaction: ${signatures.length} provided, ` +
        `maximum ${MAX_SIGNATURES_V0} supported. V0 transactions have a 1232 byte ` +
        `limit, and each Ed25519 instruction uses ~200 bytes.`
      );
    }

    if (signatures.length === 0) {
      throw new Error('At least one signature is required');
    }

    // Create Ed25519 instructions
    const messageHash = createMessageHash(
      txId, sourceChainId, destChainId, sender, recipient, onChainData, offChainData
    );

    const instructions = [];
    for (const sig of signatures) {
      instructions.push(createEd25519Instruction(sig.signature, sig.signer, messageHash));
    }

    // Add main instruction (AUTO-DISCOVERY: no signatures parameter)
    const mainInstruction = await this.client.program.methods
      .createTxPda(
        txId,
        sourceChainId,
        destChainId,
        sender,
        recipient,
        onChainData,
        offChainData
      )
      .accountsPartial({
        txIdPda: this.pdas.getTxIdPda(sourceChainId, txId),
        counterPda: this.pdas.getCounterPda(sourceChainId),
        relayer: this.client.wallet.publicKey,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .instruction();

    instructions.push(mainInstruction);

    return this.executeV0Transaction('createTxPda', instructions);
  }

  /**
   * Process message with versioned transaction (uses ALT for ~280 byte savings)
   * Maximum 3 signatures supported for V0 transactions to prevent size limit issues
   * @param includeProjectRegistry - Set to false to disable project registry validation (default: false)
   * @param remainingAccounts - Optional remaining accounts to pass to the instruction (e.g., for CPI to client programs)
   */
  async processMessageWithSignaturesV0(
    txId: TxId,
    sourceChainId: ChainId,
    destChainId: ChainId,
    sender: Buffer,
    recipient: Buffer,
    onChainData: Buffer,
    offChainData: Buffer,
    signatures: MessageSignature[],
    includeProjectRegistry: boolean = false,
    remainingAccounts?: PublicKey[]
  ): Promise<string> {
    // Validate signature count (V0 transaction size limit)
    const MAX_SIGNATURES_V0 = 3;
    if (signatures.length > MAX_SIGNATURES_V0) {
      throw new Error(
        `Too many signatures for V0 transaction: ${signatures.length} provided, ` +
        `maximum ${MAX_SIGNATURES_V0} supported. V0 transactions have a 1232 byte ` +
        `limit, and each Ed25519 instruction uses ~200 bytes.`
      );
    }

    if (signatures.length === 0) {
      throw new Error('At least one signature is required');
    }

    // Create Ed25519 instructions
    const messageHash = createMessageHash(
      txId, sourceChainId, destChainId, sender, recipient, onChainData, offChainData
    );

    const instructions = [];
    for (const sig of signatures) {
      instructions.push(createEd25519Instruction(sig.signature, sig.signer, messageHash));
    }

    // Derive accounts for three-transaction pattern
    // remainingAccounts contains: [clientProgramId, tokenMint, ...]
    // The gateway provides clientConfigPda, but we need to derive it for reference
    let decodedMessagePda: PublicKey | null = null;
    let clientConfigPda: PublicKey | null = null;
    let clientProgramId: PublicKey | null = null;

    if (remainingAccounts && remainingAccounts.length >= 1) {
      clientProgramId = remainingAccounts[0];  // Client program to CPI to

      // Derive clientConfigPda: seeds = ['client_config']
      [clientConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('client_config')],
        clientProgramId
      );

      // Derive decodedMessagePda: seeds = ['decoded', tx_id.to_le_bytes()]
      const txIdBytes = Buffer.alloc(16);
      txId.toArrayLike(Buffer, 'le', 16).copy(txIdBytes);
      [decodedMessagePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('decoded'), txIdBytes],
        clientProgramId
      );
    }

    // Add main instruction with accounts in exact IDL order
    // For Anchor's accountsPartial(), we must include ALL accounts including optional ones
    // Optional accounts are set to null when not used

    // Check if gas handler program exists on-chain
    // If not deployed, set all gas handler accounts to null to skip gas reimbursement
    let gasHandlerAccounts: any = {
      gasHandlerProgram: null,
      gasConfig: null,
      clientGasConfig: null,
      gasPool: null,
    };

    try {
      const gasHandlerInfo = await this.client.program.provider.connection.getAccountInfo(this.gasHandlerProgramId);
      if (gasHandlerInfo && gasHandlerInfo.executable) {
        // Gas handler is deployed - include accounts
        gasHandlerAccounts = {
          gasHandlerProgram: this.gasHandlerProgramId,
          gasConfig: this.pdas.getGasConfigPda(this.pdas.getGatewayPda(destChainId), this.gasHandlerProgramId),
          clientGasConfig: clientProgramId
            ? this.pdas.getClientGasConfigPda(this.pdas.getGatewayPda(destChainId), clientProgramId, this.gasHandlerProgramId)
            : null,
          gasPool: this.pdas.getGasPoolPda(this.pdas.getGatewayPda(destChainId), this.gasHandlerProgramId),
        };
      }
    } catch (error) {
      // Gas handler not found - accounts remain null (skip gas reimbursement)
    }

    const accounts: any = {
      gateway: this.pdas.getGatewayPda(destChainId),
      txIdPda: this.pdas.getTxIdPda(sourceChainId, txId),
      viaRegistry: this.pdas.getSignerRegistryPda("via", destChainId),
      chainRegistry: this.pdas.getSignerRegistryPda("chain", sourceChainId),
      projectRegistry: includeProjectRegistry
        ? this.pdas.getSignerRegistryPda("project", destChainId)
        : null,  // Optional
      relayer: this.client.wallet.publicKey,
      decodedMessagePda: decodedMessagePda || null,  // Optional (null if no client program)
      clientConfig: clientConfigPda || null,          // Optional (null if no client program)
      instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      systemProgram: SystemProgram.programId,
      // Gas Handler Accounts (optional - null if not deployed)
      ...gasHandlerAccounts,
    };

    let instructionBuilder = this.client.program.methods
      .processMessage(
        txId,
        sourceChainId,
        destChainId,
        sender,
        recipient,
        onChainData,
        offChainData
      )
      .accountsPartial(accounts);

    // Add remaining accounts if provided
    if (remainingAccounts && remainingAccounts.length > 0) {
      instructionBuilder = instructionBuilder.remainingAccounts(
        remainingAccounts.map(pubkey => ({
          pubkey,
          isSigner: false,
          isWritable: true
        }))
      );
    }

    const mainInstruction = await instructionBuilder.instruction();

    instructions.push(mainInstruction);

    return this.executeV0Transaction('processMessage', instructions);
  }

  // ============= Registry Operations =============

  private getRegistryEnum(type: RegistryType):
    | { via: Record<string, never> }
    | { chain: Record<string, never> }
    | { project: Record<string, never> } {
    // Type-safe enum creation for Anchor
    // Using Record<string, never> is the proper TypeScript way to represent empty objects
    switch(type) {
      case 'via':
        return { via: {} as Record<string, never> };
      case 'chain':
        return { chain: {} as Record<string, never> };
      case 'project':
        return { project: {} as Record<string, never> };
      default:
        // This should never happen due to TypeScript type checking
        throw new Error(`Invalid registry type: ${type}`);
    }
  }

  async initializeRegistry(
    type: RegistryType,
    chainId: ChainId,
    signers: PublicKey[] = [this.client.wallet.publicKey],
    threshold: number = 0
  ): Promise<string> {
    return this.executeTransaction(
      `initializeRegistry(${type})`,
      () => this.client.program.methods
        .initializeSignerRegistry(this.getRegistryEnum(type), chainId, signers, threshold)
        .accountsPartial({
          gateway: this.pdas.getGatewayPda(chainId),
          signerRegistry: this.pdas.getSignerRegistryPda(type, chainId),
          authority: this.client.wallet.publicKey,
        })
        .rpc()
    );
  }

  async addSigner(type: RegistryType, chainId: ChainId, signer: PublicKey): Promise<string> {
    return this.executeTransaction(
      `addSigner(${type})`,
      () => this.client.program.methods
        .addSigner(this.getRegistryEnum(type), chainId, signer)
        .accountsPartial({
          gateway: this.pdas.getGatewayPda(chainId),
          signerRegistry: this.pdas.getSignerRegistryPda(type, chainId),
          authority: this.client.wallet.publicKey,
        })
        .rpc()
    );
  }

  async removeSigner(type: RegistryType, chainId: ChainId, signer: PublicKey): Promise<string> {
    return this.executeTransaction(
      `removeSigner(${type})`,
      () => this.client.program.methods
        .removeSigner(this.getRegistryEnum(type), chainId, signer)
        .accountsPartial({
          gateway: this.pdas.getGatewayPda(chainId),
          signerRegistry: this.pdas.getSignerRegistryPda(type, chainId),
          authority: this.client.wallet.publicKey,
        })
        .rpc()
    );
  }

  async updateSigners(type: RegistryType, chainId: ChainId, signers: PublicKey[], threshold: number): Promise<string> {
    return this.executeTransaction(
      `updateSigners(${type})`,
      () => this.client.program.methods
        .updateSigners(this.getRegistryEnum(type), chainId, signers, threshold)
        .accountsPartial({
          gateway: this.pdas.getGatewayPda(chainId),
          signerRegistry: this.pdas.getSignerRegistryPda(type, chainId),
          authority: this.client.wallet.publicKey,
        })
        .rpc()
    );
  }

  async updateThreshold(type: RegistryType, chainId: ChainId, threshold: number): Promise<string> {
    return this.executeTransaction(
      `updateThreshold(${type})`,
      () => this.client.program.methods
        .updateThreshold(this.getRegistryEnum(type), chainId, threshold)
        .accountsPartial({
          gateway: this.pdas.getGatewayPda(chainId),
          signerRegistry: this.pdas.getSignerRegistryPda(type, chainId),
          authority: this.client.wallet.publicKey,
        })
        .rpc()
    );
  }

  async setRegistryEnabled(type: RegistryType, chainId: ChainId, enabled: boolean): Promise<string> {
    return this.executeTransaction(
      `setRegistryEnabled(${type})`,
      () => this.client.program.methods
        .setRegistryEnabled(this.getRegistryEnum(type), chainId, enabled)
        .accountsPartial({
          gateway: this.pdas.getGatewayPda(chainId),
          signerRegistry: this.pdas.getSignerRegistryPda(type, chainId),
          authority: this.client.wallet.publicKey,
        })
        .rpc()
    );
  }

  // ============= Counter Operations =============

  async initializeCounter(sourceChainId: ChainId): Promise<string> {
    return this.executeTransaction(
      'initializeCounter',
      () => this.client.program.methods
        .initializeCounter(sourceChainId)
        .accountsPartial({
          gateway: this.pdas.getGatewayPda(sourceChainId),
          authority: this.client.wallet.publicKey,
        })
        .rpc()
    );
  }

  // ============= Fee Handler Operations =============

  /**
   * Initialize fee configuration for a gateway
   *
   * @param gatewayKey Gateway PublicKey this fee handler serves
   * @param feeTokenMint SPL token mint for fee payments (e.g., USDC)
   * @param accountant Account where collected fees are sent
   * @param minFee Minimum fee in 6-decimal precision (e.g., 1_000_000 = 1 token)
   */
  async initializeFeeConfig(
    gatewayKey: PublicKey,
    feeTokenMint: PublicKey,
    accountant: PublicKey,
    minFee: BN
  ): Promise<string> {
    const feeConfigPda = this.pdas.getFeeConfigPda(gatewayKey, this.feeHandlerProgramId);

    return this.executeTransaction(
      'initializeFeeConfig',
      () => this.feeHandlerProgram.methods
        .initializeFeeConfig(minFee)
        .accountsPartial({
          feeConfig: feeConfigPda,
          gateway: gatewayKey,
          feeTokenMint: feeTokenMint,
          accountant: accountant,
          authority: this.client.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    );
  }

  /**
   * Initialize client-specific fee configuration
   *
   * @param gatewayKey Gateway PublicKey
   * @param clientProgramId Client program ID for this config
   * @param customFee Optional custom fee override (replaces min_fee)
   * @param maxFee Optional maximum fee cap for protection
   * @param zeroFee If true, no fee is collected (overrides all)
   */
  async initializeClientFeeConfig(
    gatewayKey: PublicKey,
    clientProgramId: PublicKey,
    customFee?: BN,
    maxFee?: BN,
    zeroFee: boolean = false
  ): Promise<string> {
    const feeConfigPda = this.pdas.getFeeConfigPda(gatewayKey, this.feeHandlerProgramId);
    const clientFeeConfigPda = this.pdas.getClientFeeConfigPda(
      gatewayKey,
      clientProgramId,
      this.feeHandlerProgramId
    );

    return this.executeTransaction(
      'initializeClientFeeConfig',
      () => this.feeHandlerProgram.methods
        .initializeClientFeeConfig(customFee || null, maxFee || null, zeroFee)
        .accountsPartial({
          feeConfig: feeConfigPda,
          clientConfig: clientFeeConfigPda,
          gateway: gatewayKey,
          clientProgram: clientProgramId,
          authority: this.client.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    );
  }

  /**
   * Update fee configuration settings
   *
   * @param gatewayKey Gateway PublicKey
   * @param newAccountant Optional new accountant address
   * @param newMinFee Optional new minimum fee amount
   */
  async updateFeeConfig(
    gatewayKey: PublicKey,
    newAccountant?: PublicKey,
    newMinFee?: BN
  ): Promise<string> {
    const feeConfigPda = this.pdas.getFeeConfigPda(gatewayKey, this.feeHandlerProgramId);

    return this.executeTransaction(
      'updateFeeConfig',
      () => this.feeHandlerProgram.methods
        .updateFeeConfig(newAccountant || null, newMinFee || null)
        .accountsPartial({
          feeConfig: feeConfigPda,
          authority: this.client.wallet.publicKey,
        })
        .rpc()
    );
  }

  /**
   * Set fee collection offline/online status
   *
   * @param gatewayKey Gateway PublicKey
   * @param offline true to disable fee collection, false to enable
   */
  async setFeeOffline(gatewayKey: PublicKey, offline: boolean): Promise<string> {
    const feeConfigPda = this.pdas.getFeeConfigPda(gatewayKey, this.feeHandlerProgramId);

    return this.executeTransaction(
      'setFeeOffline',
      () => this.feeHandlerProgram.methods
        .setOffline(offline)
        .accountsPartial({
          feeConfig: feeConfigPda,
          authority: this.client.wallet.publicKey,
        })
        .rpc()
    );
  }

  /**
   * Update client fee configuration
   *
   * @param gatewayKey Gateway PublicKey
   * @param clientProgramId Client program ID
   * @param customFee Optional custom fee override
   * @param maxFee Optional maximum fee cap
   * @param zeroFee If true, no fee is collected
   */
  async updateClientFeeConfig(
    gatewayKey: PublicKey,
    clientProgramId: PublicKey,
    customFee?: BN,
    maxFee?: BN,
    zeroFee: boolean = false
  ): Promise<string> {
    const feeConfigPda = this.pdas.getFeeConfigPda(gatewayKey, this.feeHandlerProgramId);
    const clientFeeConfigPda = this.pdas.getClientFeeConfigPda(
      gatewayKey,
      clientProgramId,
      this.feeHandlerProgramId
    );

    return this.executeTransaction(
      'updateClientFeeConfig',
      () => this.feeHandlerProgram.methods
        .updateClientConfig(customFee || null, maxFee || null, zeroFee)
        .accountsPartial({
          feeConfig: feeConfigPda,
          clientConfig: clientFeeConfigPda,
          authority: this.client.wallet.publicKey,
        })
        .rpc()
    );
  }

  // ============= Gas Handler Operations =============

  /**
   * Initialize gas configuration for a gateway
   *
   * @param gatewayKey Gateway PublicKey this gas handler serves
   * @param baseReimbursement Base reimbursement amount in lamports (e.g., 5_000_000 = 0.005 SOL)
   * @param maxReimbursement Maximum reimbursement cap in lamports (e.g., 50_000_000 = 0.05 SOL)
   */
  async initializeGasConfig(
    gatewayKey: PublicKey,
    baseReimbursement: BN,
    maxReimbursement: BN
  ): Promise<string> {
    const gasConfigPda = this.pdas.getGasConfigPda(gatewayKey, this.gasHandlerProgramId);

    return this.executeTransaction(
      'initializeGasConfig',
      () => this.gasHandlerProgram.methods
        .initializeGasConfig(baseReimbursement, maxReimbursement)
        .accountsPartial({
          gasConfig: gasConfigPda,
          gateway: gatewayKey,
          authority: this.client.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    );
  }

  /**
   * Initialize the gas pool to hold SOL for reimbursements
   *
   * @param gatewayKey Gateway PublicKey
   */
  async initializeGasPool(gatewayKey: PublicKey): Promise<string> {
    const gasPoolPda = this.pdas.getGasPoolPda(gatewayKey, this.gasHandlerProgramId);

    return this.executeTransaction(
      'initializeGasPool',
      () => this.gasHandlerProgram.methods
        .initializeGasPool()
        .accountsPartial({
          gasPool: gasPoolPda,
          gateway: gatewayKey,
          authority: this.client.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    );
  }

  /**
   * Fund the gas pool with SOL
   *
   * @param gatewayKey Gateway PublicKey
   * @param amount Amount of lamports to add to the pool
   */
  async fundGasPool(gatewayKey: PublicKey, amount: BN): Promise<string> {
    const gasConfigPda = this.pdas.getGasConfigPda(gatewayKey, this.gasHandlerProgramId);
    const gasPoolPda = this.pdas.getGasPoolPda(gatewayKey, this.gasHandlerProgramId);

    return this.executeTransaction(
      'fundGasPool',
      () => this.gasHandlerProgram.methods
        .fundGasPool(amount)
        .accountsPartial({
          gasConfig: gasConfigPda,
          gasPool: gasPoolPda,
          gateway: gatewayKey,
          authority: this.client.wallet.publicKey,
          funder: this.client.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    );
  }

  /**
   * Initialize client-specific gas configuration
   *
   * @param gatewayKey Gateway PublicKey
   * @param clientProgramId Client program ID for this config
   * @param maxGasOverride Optional client-specific max reimbursement cap
   * @param gasTokenMint Token mint for gas (FUTURE: unused in MVP, native SOL only)
   * @param enabled Whether gas reimbursement is enabled for this client
   */
  async initializeClientGasConfig(
    gatewayKey: PublicKey,
    clientProgramId: PublicKey,
    maxGasOverride?: BN,
    gasTokenMint: PublicKey = SystemProgram.programId,
    enabled: boolean = true
  ): Promise<string> {
    const gasConfigPda = this.pdas.getGasConfigPda(gatewayKey, this.gasHandlerProgramId);
    const clientGasConfigPda = this.pdas.getClientGasConfigPda(
      gatewayKey,
      clientProgramId,
      this.gasHandlerProgramId
    );

    return this.executeTransaction(
      'initializeClientGasConfig',
      () => this.gasHandlerProgram.methods
        .initializeClientGasConfig(maxGasOverride || null, gasTokenMint, enabled)
        .accountsPartial({
          gasConfig: gasConfigPda,
          clientConfig: clientGasConfigPda,
          gateway: gatewayKey,
          clientProgram: clientProgramId,
          authority: this.client.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    );
  }

  /**
   * Update gas configuration settings
   *
   * @param gatewayKey Gateway PublicKey
   * @param newBaseReimbursement Optional new base reimbursement amount
   * @param newMaxReimbursement Optional new max reimbursement cap
   */
  async updateGasConfig(
    gatewayKey: PublicKey,
    newBaseReimbursement?: BN,
    newMaxReimbursement?: BN
  ): Promise<string> {
    const gasConfigPda = this.pdas.getGasConfigPda(gatewayKey, this.gasHandlerProgramId);

    return this.executeTransaction(
      'updateGasConfig',
      () => this.gasHandlerProgram.methods
        .updateGasConfig(newBaseReimbursement || null, newMaxReimbursement || null)
        .accountsPartial({
          gasConfig: gasConfigPda,
          authority: this.client.wallet.publicKey,
        })
        .rpc()
    );
  }

  /**
   * Set gas reimbursement enabled/disabled status
   *
   * @param gatewayKey Gateway PublicKey
   * @param enabled true to enable gas reimbursement, false to disable
   */
  async setGasEnabled(gatewayKey: PublicKey, enabled: boolean): Promise<string> {
    const gasConfigPda = this.pdas.getGasConfigPda(gatewayKey, this.gasHandlerProgramId);

    return this.executeTransaction(
      'setGasEnabled',
      () => this.gasHandlerProgram.methods
        .setEnabled(enabled)
        .accountsPartial({
          gasConfig: gasConfigPda,
          authority: this.client.wallet.publicKey,
        })
        .rpc()
    );
  }

  /**
   * Update client gas configuration
   *
   * @param gatewayKey Gateway PublicKey
   * @param clientProgramId Client program ID
   * @param maxGasOverride Optional client-specific max reimbursement cap
   * @param enabled Whether gas reimbursement is enabled for this client
   */
  async updateClientGasConfig(
    gatewayKey: PublicKey,
    clientProgramId: PublicKey,
    maxGasOverride?: BN,
    enabled: boolean = true
  ): Promise<string> {
    const gasConfigPda = this.pdas.getGasConfigPda(gatewayKey, this.gasHandlerProgramId);
    const clientGasConfigPda = this.pdas.getClientGasConfigPda(
      gatewayKey,
      clientProgramId,
      this.gasHandlerProgramId
    );

    return this.executeTransaction(
      'updateClientGasConfig',
      () => this.gasHandlerProgram.methods
        .updateClientConfig(maxGasOverride || null, enabled)
        .accountsPartial({
          gasConfig: gasConfigPda,
          clientConfig: clientGasConfigPda,
          authority: this.client.wallet.publicKey,
        })
        .rpc()
    );
  }

  // ============= Getters =============

  get program() {
    return this.client.program;
  }

  get provider(): AnchorProvider {
    return this.client.program.provider as AnchorProvider;
  }

  get wallet(): PublicKey {
    return this.client.wallet.publicKey;
  }

  get pda(): ViaLabsPDAs {
    return this.pdas;
  }

  get feeHandler(): Program<FeeHandlerV4> {
    return this.feeHandlerProgram;
  }

  get gasHandler(): Program<GasHandlerV4> {
    return this.gasHandlerProgram;
  }
}

// Export factory function
export const createSDK = (client?: ViaLabsClient) => new ViaLabsSDK(client ? { client } : undefined);
