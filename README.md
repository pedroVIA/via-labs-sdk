# Via Labs SDK

TypeScript SDK for the Via Labs V4 cross-chain messaging protocol on Solana.

## Overview

This SDK provides a clean, type-safe interface for interacting with the Via Labs Message Gateway V4 Solana program. It handles all the complexity of PDA derivation, signature validation, and transaction construction.

## Features

- ✅ **Auto-configuration** - Loads connection and wallet from environment variables
- ✅ **Retry logic** - Built-in exponential backoff for network resilience
- ✅ **V0 transactions** - Support for versioned transactions with Address Lookup Tables (~280 byte savings)
- ✅ **Type-safe** - Full TypeScript support with proper type definitions
- ✅ **Flexible** - Optional project registry validation
- ✅ **Production-ready** - Used in live cross-chain deployments

## Installation

This SDK is part of the via-drivers monorepo. It uses peer dependencies that are already installed at the root level.

## Usage

### Basic Setup

```typescript
import { ViaLabsSDK, createClient } from '@pedrovia/sdk';

// SDK auto-loads from environment variables:
// - ANCHOR_PROVIDER_URL (Solana RPC endpoint)
// - ANCHOR_WALLET (path to wallet keypair JSON)
const sdk = new ViaLabsSDK();

// Or create with custom client:
const client = createClient();
const sdk = new ViaLabsSDK(client);
```

### Gateway Operations

```typescript
import { BN } from 'bn.js';

const chainId = new BN('43113'); // Avalanche Fuji

// Initialize gateway
await sdk.initializeGateway(chainId);

// Enable/disable system
await sdk.setSystemEnabled(chainId, true);
```

### Send Cross-Chain Messages

**⚠️ IMPORTANT: Users should NEVER call the Gateway directly!**

The correct architecture is: **User → ClientTest → Gateway**

```typescript
// ❌ WRONG: Never call Gateway directly
await sdk._sendMessageInternal(...);  // DON'T DO THIS!

// ✅ CORRECT: Users call ClientTest program
import { Program } from '@coral-xyz/anchor';

const clientTestProgram = new Program(clientTestIdl, provider);

// Users interact with ClientTest, which handles:
// 1. Burning/locking tokens
// 2. Encoding application data
// 3. Calling Gateway via CPI
await clientTestProgram.methods
  .bridgeTokens(destChainId, amount, message)
  .accounts({
    clientConfig: clientConfigPda,
    tokenMint: tokenMint,
    userTokenAccount: userTokenAccount,
    gatewayProgram: sdk.program.programId,  // Gateway called via CPI
    gateway: gatewayPda,
    counter: counterPda,
    // ... other accounts
  })
  .rpc();
```

**Note**: `_sendMessageInternal()` is for internal use by ClientTest programs only. See `scripts/solana/bridge-token.ts` and `contracts/solana/programs/client-test-v4/` for reference implementation.

### Process Incoming Messages (with signatures)

```typescript
import { createMessageSignature } from '@pedrovia/sdk';

// Create signatures from authorized signers
const signatures = [
  createMessageSignature(
    txId,
    sourceChainId,
    destChainId,
    sender,
    recipient,
    onChainData,
    offChainData,
    viaSigner1Keypair
  ),
  createMessageSignature(..., chainSigner1Keypair),
];

// Two-transaction pattern for incoming messages

// TX1: Create replay protection PDA
await sdk.createTxPdaWithSignatures(
  txId,
  sourceChainId,
  destChainId,
  sender,
  recipient,
  onChainData,
  offChainData,
  signatures
);

// TX2: Process and validate message
await sdk.processMessageWithSignatures(
  txId,
  sourceChainId,
  destChainId,
  sender,
  recipient,
  onChainData,
  offChainData,
  signatures,
  false // includeProjectRegistry (optional)
);
```

### V0 Transactions (with ALT)

```typescript
import { PublicKey } from '@solana/web3.js';

// Load Address Lookup Table first
const altAddress = new PublicKey('...');
await sdk.loadLookupTable(altAddress);

// Now use V0 transaction methods (max 3 signatures)
await sdk.createTxPdaWithSignaturesV0(...);
await sdk.processMessageWithSignaturesV0(...);
```

### Registry Operations

```typescript
import { PublicKey } from '@solana/web3.js';

const viaSigner1 = new PublicKey('...');
const viaSigner2 = new PublicKey('...');
const viaSigner3 = new PublicKey('...');

// Initialize registry with multi-signature setup
await sdk.initializeRegistry(
  'via',
  chainId,
  [viaSigner1, viaSigner2, viaSigner3],
  2 // threshold: require 2 of 3 signatures
);

// Manage signers
await sdk.addSigner('via', chainId, newSigner);
await sdk.removeSigner('via', chainId, oldSigner);
await sdk.updateThreshold('via', chainId, 2);

// Enable/disable registry
await sdk.setRegistryEnabled('via', chainId, true);
```

**NEW ARCHITECTURE - Combined Via/Chain Threshold:**
- Via and Chain signatures are pooled together and validated against a combined threshold
- Combined threshold = `max(via_registry.threshold, chain_registry.threshold)`
- At least 1 signature from via or chain is required
- Project signatures validated separately (optional)
- Example: If via threshold=2 and chain threshold=1, need 2 signatures total from via+chain pool

### Counter Operations

```typescript
// Initialize counter for tracking messages from a source chain
await sdk.initializeCounter(sourceChainId);
```

## Architecture

### File Structure

```
src/
├── index.ts          # Main exports
├── connection.ts     # ViaLabsClient - program connection
├── sdk.ts            # ViaLabsSDK - main SDK class
├── pdas.ts           # ViaLabsPDAs - PDA derivation utilities
├── types.ts          # Type definitions
├── constants.ts      # Protocol constants
└── signatures.ts     # Message signing utilities
```

### Key Classes

- **ViaLabsClient**: Handles Solana connection, wallet, and program instantiation
- **ViaLabsSDK**: Main SDK class with all protocol operations
- **ViaLabsPDAs**: PDA (Program Derived Address) utilities for all account types

### PDA Seeds

- Gateway: `["gateway", chain_id]`
- TxId: `["tx", source_chain_id, tx_id]`
- Counter: `["counter", source_chain_id]`
- TxCounter: `["tx_counter", chain_id]`
- SignerRegistry: `["signer_registry", registry_type, chain_id]`

## Breaking Changes

### v2.0.0 - Gas Handler Accounts in Address Lookup Table

Gas handler accounts are now stored in the Address Lookup Table (ALT) for new deployments.

**Accounts moved to ALT** (saves 96 bytes/tx):
- `gasHandlerProgram` - Gas handler program ID
- `gasConfig` - Global gas configuration PDA
- `gasPool` - Gas reimbursement pool PDA

**Still passed directly**:
- `clientGasConfig` - Client-specific config (varies per client)

**Migration**:
- New deployments: Automatic
- Existing deployments: Must redeploy gateway
- Old SDK: Works with both old and new deployments
- New SDK: Requires gas accounts in ALT

**Verification**:
```bash
solana address-lookup-table <lookupTableAddress> --url devnet
# Should show 9 addresses (6 base + 3 gas)
```

**Benefits**:
- Transaction size: Saves ~96 bytes per transaction
- Cost: Reduces transaction fees
- Efficiency: Cleaner transaction structure

## Environment Variables

Required environment variables:

```bash
# Solana RPC endpoint
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com

# Path to wallet keypair JSON
ANCHOR_WALLET=./keypairs/authority.json
```

## Migration Notes

This SDK was migrated from `message_gateway_v4/packages/via-labs-sdk/` with the following enhancements:

1. ✅ **Import paths fixed** - Updated to point to `contracts/solana/target/`
2. ✅ **_sendMessageInternal() added** - Internal Gateway method (renamed from sendMessage for clarity)
3. ✅ **Modern .js extensions** - Uses `.js` for TypeScript ESM imports
4. ✅ **Confirmed commitment** - Uses 'confirmed' level for faster transactions
5. ✅ **Optional project registry** - `includeProjectRegistry` parameter for flexibility

**Architecture Change**: The method was renamed from `sendMessage()` to `_sendMessageInternal()` to clarify that it should only be called by ClientTest programs via CPI, never directly by end users. Users should interact with ClientTest programs (e.g., `ClientTest.bridge_tokens()`) which handle application logic before calling the Gateway.

## Dependencies

Peer dependencies (provided by parent project):
- `@coral-xyz/anchor@^0.32.1` - Solana Anchor framework
- `@solana/web3.js@^1.98.4` - Solana web3 library
- `bn.js@^5.2.2` - Big number library
- `js-sha3@^0.9.3` - Keccak256 hashing
- `tweetnacl@^1.0.3` - Ed25519 signing

## License

MIT
# via-labs-sdk
