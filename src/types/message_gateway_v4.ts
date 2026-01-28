/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/message_gateway_v4.json`.
 */
export type MessageGatewayV4 = {
  "address": "3A9hsJkXg6aJoFxWKpo9BnYtuuYmtckWVSwd52efqFzL",
  "metadata": {
    "name": "messageGatewayV4",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "docs": [
    "Via Labs V4 Message Gateway Program",
    "",
    "Core cross-chain messaging protocol implementation for Solana",
    "featuring two-transaction replay protection and three-layer security"
  ],
  "instructions": [
    {
      "name": "addSigner",
      "docs": [
        "Add a signer to an existing registry",
        "",
        "Adds a single new authorized signer to the registry without affecting",
        "existing signers. More efficient than [`update_signers`] for single additions.",
        "",
        "# Arguments",
        "* `registry_type` - Type of registry: `Via`, `Chain`, or `Project`",
        "* `chain_id` - Chain identifier for the registry",
        "* `new_signer` - Public key of the new signer to add",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `GatewayError::UnauthorizedAuthority` - If caller is not the gateway authority",
        "* `GatewayError::DuplicateSigner` - If signer already exists in the registry",
        "* `GatewayError::TooManySignatures` - If registry already has 10 signers (max)",
        "",
        "# Authority",
        "Only the gateway authority can add signers",
        "",
        "See also: [`initialize_signer_registry`] prerequisite, [`remove_signer`] opposite operation",
        "",
        "# Ethereum Equivalent",
        "Part of `setChainSigners()` array management"
      ],
      "discriminator": [
        76,
        104,
        61,
        51,
        179,
        139,
        47,
        222
      ],
      "accounts": [
        {
          "name": "signerRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  105,
                  103,
                  110,
                  101,
                  114,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "registryType"
              },
              {
                "kind": "arg",
                "path": "chainId"
              }
            ]
          }
        },
        {
          "name": "gateway",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  116,
                  101,
                  119,
                  97,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "gateway.chain_id",
                "account": "messageGateway"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "signerRegistry",
            "gateway"
          ]
        }
      ],
      "args": [
        {
          "name": "registryType",
          "type": {
            "defined": {
              "name": "signerRegistryType"
            }
          }
        },
        {
          "name": "chainId",
          "type": "u64"
        },
        {
          "name": "newSigner",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "createTxPda",
      "docs": [
        "TX1: Create TxId PDA for replay protection (AUTO-DISCOVERY)",
        "",
        "First transaction in the two-transaction message processing pattern.",
        "Creates a PDA that proves this transaction ID hasn't been processed yet.",
        "Signatures are auto-discovered from Ed25519 instructions in the transaction.",
        "",
        "# Arguments",
        "* `tx_id` - Unique message identifier from source chain",
        "* `source_chain_id` - Chain ID where the message originated",
        "* `dest_chain_id` - Chain ID where the message is being processed (must match gateway)",
        "* `sender` - Sender address on source chain (max 64 bytes)",
        "* `recipient` - Recipient address on this chain (max 64 bytes)",
        "* `on_chain_data` - Application payload (max 1024 bytes)",
        "* `off_chain_data` - Additional data for validation (max 1024 bytes)",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `GatewayError::SenderTooLong` - If sender > 64 bytes (DOS protection)",
        "* `GatewayError::RecipientTooLong` - If recipient > 64 bytes (DOS protection)",
        "* `GatewayError::OnChainDataTooLarge` - If on_chain_data > 1024 bytes",
        "* `GatewayError::OffChainDataTooLarge` - If off_chain_data > 1024 bytes",
        "* `GatewayError::TxIdTooOld` - If tx_id ≤ highest seen (replay protection)",
        "* `GatewayError::Ed25519VerificationFailed` - If signature validation fails",
        "* `GatewayError::TooFewSignatures` - If < 2 valid signatures found",
        "",
        "# Events",
        "Emits `TxPdaCreated` event",
        "",
        "# Auto-Discovery",
        "Signatures are NOT passed as parameters. Instead, they are automatically",
        "discovered from Ed25519 precompile instructions in the transaction.",
        "This saves 292 bytes per transaction.",
        "",
        "# Two-Transaction Flow",
        "- **Previous:** [`send_message`] emitted the message on source chain",
        "- **This (TX1):** Creates [`TxIdPDA`] for replay protection, validated against [`CounterPDA`]",
        "- **Next (TX2):** [`process_message`] validates signatures and closes PDA",
        "",
        "Requires [`initialize_counter`] to be called first for the source chain.",
        "",
        "# Ethereum Equivalent",
        "`processedTransfers[_txId] = true;` replay protection in `process()` function"
      ],
      "discriminator": [
        15,
        162,
        95,
        238,
        177,
        211,
        197,
        5
      ],
      "accounts": [
        {
          "name": "txIdPda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  120
                ]
              },
              {
                "kind": "arg",
                "path": "sourceChainId"
              },
              {
                "kind": "arg",
                "path": "txId"
              }
            ]
          }
        },
        {
          "name": "counterPda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "arg",
                "path": "sourceChainId"
              }
            ]
          }
        },
        {
          "name": "relayer",
          "writable": true,
          "signer": true
        },
        {
          "name": "instructions",
          "address": "Sysvar1nstructions1111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "txId",
          "type": "u128"
        },
        {
          "name": "sourceChainId",
          "type": "u64"
        },
        {
          "name": "destChainId",
          "type": "u64"
        },
        {
          "name": "sender",
          "type": "bytes"
        },
        {
          "name": "recipient",
          "type": "bytes"
        },
        {
          "name": "onChainData",
          "type": "bytes"
        },
        {
          "name": "offChainData",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "initializeCounter",
      "docs": [
        "Initialize a Counter PDA for a source chain (admin only)",
        "",
        "Creates a counter account to track the highest transaction ID seen from a",
        "specific source chain. Required before processing messages from that chain.",
        "This enables out-of-order message processing while detecting gaps.",
        "",
        "# Arguments",
        "* `source_chain_id` - Chain ID of the source blockchain (e.g., 43113 for Avalanche Fuji)",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `GatewayError::UnauthorizedAccess` - If caller is not the gateway authority",
        "* `GatewayError::GatewayDisabled` - If gateway system is disabled",
        "* `GatewayError::InvalidChainId` - If source_chain_id is 0 or invalid",
        "",
        "# Authority",
        "Only the gateway authority can initialize counters",
        "",
        "# Solana-Specific",
        "This is required for Solana's replay protection mechanism. Each source chain",
        "needs its own counter to track message ordering independently.",
        "",
        "See also: [`CounterPDA`] state, [`create_tx_pda`] validates against this counter",
        "",
        "# Ethereum Equivalent",
        "No direct equivalent - Ethereum uses `mapping(uint => bool) processedTransfers`"
      ],
      "discriminator": [
        67,
        89,
        100,
        87,
        231,
        172,
        35,
        124
      ],
      "accounts": [
        {
          "name": "counterPda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "arg",
                "path": "sourceChainId"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "gateway",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  116,
                  101,
                  119,
                  97,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "gateway.chain_id",
                "account": "messageGateway"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "sourceChainId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeGateway",
      "docs": [
        "Initialize the gateway for a specific chain",
        "",
        "Sets up the gateway PDA and transaction counter for the specified blockchain.",
        "This instruction must be called once during initial deployment before any",
        "cross-chain messages can be sent or received.",
        "",
        "# Arguments",
        "* `chain_id` - Unique blockchain identifier (e.g., 43113 for Avalanche Fuji,",
        "1399811149 for Solana Devnet)",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* Account validation errors if PDAs are incorrectly derived",
        "* `anchor_lang::error::Error` if initialization fails",
        "",
        "# Authority",
        "Can be called by anyone, but the caller becomes the gateway authority",
        "",
        "# Ethereum Equivalent",
        "`constructor(bytes32 _chainId, uint256 _messagePrefix)`"
      ],
      "discriminator": [
        121,
        125,
        32,
        43,
        123,
        11,
        240,
        118
      ],
      "accounts": [
        {
          "name": "gateway",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  116,
                  101,
                  119,
                  97,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "chainId"
              }
            ]
          }
        },
        {
          "name": "counter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  120,
                  95,
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "arg",
                "path": "chainId"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "chainId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeSignerRegistry",
      "docs": [
        "Initialize a signer registry for a specific tier and chain",
        "",
        "Creates a new signer registry for three-layer signature validation (Via/Chain/Project).",
        "Each registry type and chain combination requires a separate registry account.",
        "",
        "# NEW ARCHITECTURE",
        "Via and Chain registries work together with a combined threshold model:",
        "- Via + Chain signatures count toward a single pool",
        "- Combined threshold = max(via_registry.required_signatures, chain_registry.required_signatures)",
        "- Minimum 1 signature from via or chain required",
        "- Project signatures validated separately (optional)",
        "",
        "# Arguments",
        "* `registry_type` - Type of registry: `Via`, `Chain`, or `Project`",
        "* `chain_id` - Chain identifier this registry applies to",
        "* `initial_signers` - Initial list of authorized signer public keys (max 10)",
        "* `required_signatures` - For Via/Chain: contributes to combined threshold (uses max).",
        "For Project: separate threshold validation.",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `GatewayError::UnauthorizedAuthority` - If caller is not the gateway authority",
        "* `GatewayError::InsufficientSignatures` - If initial_signers is empty",
        "* `GatewayError::TooManySignatures` - If more than 10 signers provided",
        "* `GatewayError::InvalidThreshold` - If required_signatures is 0 or > signers.length",
        "",
        "# Authority",
        "Only the gateway authority can initialize registries",
        "",
        "See also: [`SignerRegistry`] state, [`process_message`] validates using these, [`update_signers`] to modify",
        "",
        "# Ethereum Equivalent",
        "`setChainSigners()`, `setViaSigners()`, and `setProjectSigners()` initialization"
      ],
      "discriminator": [
        199,
        71,
        137,
        193,
        184,
        158,
        159,
        35
      ],
      "accounts": [
        {
          "name": "signerRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  105,
                  103,
                  110,
                  101,
                  114,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "registryType"
              },
              {
                "kind": "arg",
                "path": "chainId"
              }
            ]
          }
        },
        {
          "name": "gateway",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  116,
                  101,
                  119,
                  97,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "gateway.chain_id",
                "account": "messageGateway"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "gateway"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "registryType",
          "type": {
            "defined": {
              "name": "signerRegistryType"
            }
          }
        },
        {
          "name": "chainId",
          "type": "u64"
        },
        {
          "name": "initialSigners",
          "type": {
            "vec": "pubkey"
          }
        },
        {
          "name": "requiredSignatures",
          "type": "u8"
        }
      ]
    },
    {
      "name": "processMessage",
      "docs": [
        "TX2: Process message with atomic PDA closure (AUTO-DISCOVERY)",
        "",
        "Second transaction in the two-transaction pattern. Validates three-layer",
        "signatures (Via/Chain/Project), executes the message, and atomically closes",
        "the TxId PDA to reclaim rent. Signatures are auto-discovered from Ed25519",
        "instructions.",
        "",
        "# NEW ARCHITECTURE - Combined Via/Chain Threshold",
        "Via and Chain signatures are pooled together and validated against a combined",
        "threshold = max(via_registry.required_signatures, chain_registry.required_signatures).",
        "At least 1 signature from via or chain is required. Project signatures are",
        "validated separately (optional).",
        "",
        "# Arguments",
        "* `tx_id` - Unique message identifier (must match TX1)",
        "* `source_chain_id` - Chain ID where the message originated",
        "* `dest_chain_id` - Chain ID where the message is being processed",
        "* `sender` - Sender address on source chain (max 64 bytes)",
        "* `recipient` - Recipient program address on this chain (max 64 bytes)",
        "* `on_chain_data` - Application payload to deliver (max 1024 bytes)",
        "* `off_chain_data` - Additional validation data (max 1024 bytes)",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `GatewayError::SystemDisabled` - If gateway is disabled",
        "* `GatewayError::InvalidDestChain` - If dest_chain_id doesn't match gateway",
        "* `GatewayError::InvalidTxId` - If TxId PDA doesn't exist (TX1 not done)",
        "* `GatewayError::SenderTooLong` - If sender > 64 bytes",
        "* `GatewayError::RecipientTooLong` - If recipient > 64 bytes",
        "* `GatewayError::OnChainDataTooLarge` - If on_chain_data > 1024 bytes",
        "* `GatewayError::OffChainDataTooLarge` - If off_chain_data > 1024 bytes",
        "* `GatewayError::InsufficientViaSignatures` - If combined via+chain threshold not met (NEW: reused for combined validation)",
        "* `GatewayError::InsufficientSignatures` - If no via or chain signatures provided",
        "* `GatewayError::InsufficientProjectSignatures` - If Project threshold not met",
        "* `GatewayError::UnauthorizedSigner` - If signer not in any registry",
        "* `GatewayError::SignerRegistryDisabled` - If required registry is disabled",
        "",
        "# Events",
        "Emits `MessageProcessed` event on success",
        "",
        "# Auto-Discovery",
        "Signatures are automatically discovered from Ed25519 precompile instructions,",
        "then validated against three [`SignerRegistry`] tiers (Via/Chain/Project).",
        "",
        "# Rent Reclaim",
        "Closes [`TxIdPDA`] atomically after [`create_tx_pda`], returning ~0.002 SOL to relayer.",
        "",
        "# Security",
        "Combined via+chain signature validation via [`SignerRegistry`]. Use [`set_registry_enabled`] to disable layers.",
        "",
        "# TODO",
        "- CPI to recipient program for message delivery",
        "- Gas refund processing via gas handler",
        "",
        "# Ethereum Equivalent",
        "`process()` function - Solana splits into TX1 ([`create_tx_pda`]) and TX2 (this)"
      ],
      "discriminator": [
        110,
        226,
        44,
        138,
        206,
        41,
        48,
        136
      ],
      "accounts": [
        {
          "name": "gateway",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  116,
                  101,
                  119,
                  97,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "gateway.chain_id",
                "account": "messageGateway"
              }
            ]
          }
        },
        {
          "name": "txIdPda",
          "docs": [
            "TxId PDA that will be closed atomically"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  120
                ]
              },
              {
                "kind": "arg",
                "path": "sourceChainId"
              },
              {
                "kind": "arg",
                "path": "txId"
              }
            ]
          }
        },
        {
          "name": "viaRegistry",
          "docs": [
            "Via signer registry for Via-level validation"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  105,
                  103,
                  110,
                  101,
                  114,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "const",
                "value": [
                  0
                ]
              },
              {
                "kind": "arg",
                "path": "destChainId"
              }
            ]
          }
        },
        {
          "name": "chainRegistry",
          "docs": [
            "Chain signer registry for source chain validation"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  105,
                  103,
                  110,
                  101,
                  114,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "const",
                "value": [
                  1
                ]
              },
              {
                "kind": "arg",
                "path": "sourceChainId"
              }
            ]
          }
        },
        {
          "name": "projectRegistry",
          "docs": [
            "Optional project signer registry for application-level validation"
          ],
          "optional": true
        },
        {
          "name": "relayer",
          "writable": true,
          "signer": true
        },
        {
          "name": "decodedMessagePda",
          "writable": true
        },
        {
          "name": "clientConfig",
          "docs": [
            "Client configuration PDA (if applicable)"
          ],
          "optional": true
        },
        {
          "name": "instructions",
          "address": "Sysvar1nstructions1111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "gasHandlerProgram",
          "optional": true
        },
        {
          "name": "gasConfig",
          "optional": true
        },
        {
          "name": "clientGasConfig",
          "optional": true
        },
        {
          "name": "gasPool",
          "writable": true,
          "optional": true
        }
      ],
      "args": [
        {
          "name": "txId",
          "type": "u128"
        },
        {
          "name": "sourceChainId",
          "type": "u64"
        },
        {
          "name": "destChainId",
          "type": "u64"
        },
        {
          "name": "sender",
          "type": "bytes"
        },
        {
          "name": "recipient",
          "type": "bytes"
        },
        {
          "name": "onChainData",
          "type": "bytes"
        },
        {
          "name": "offChainData",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "removeSigner",
      "docs": [
        "Remove a signer from an existing registry",
        "",
        "Removes a single signer from the registry. Automatically validates that",
        "the required signature threshold is still achievable after removal.",
        "",
        "# Arguments",
        "* `registry_type` - Type of registry: `Via`, `Chain`, or `Project`",
        "* `chain_id` - Chain identifier for the registry",
        "* `signer_to_remove` - Public key of the signer to remove",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `GatewayError::UnauthorizedAuthority` - If caller is not the gateway authority",
        "* `GatewayError::UnauthorizedSigner` - If signer is not in the registry",
        "* `GatewayError::ThresholdTooHigh` - If removal would make threshold impossible to meet",
        "",
        "# Authority",
        "Only the gateway authority can remove signers",
        "",
        "See also: [`initialize_signer_registry`] prerequisite, [`add_signer`] opposite operation",
        "",
        "# Ethereum Equivalent",
        "Part of `setChainSigners()` array management"
      ],
      "discriminator": [
        212,
        32,
        97,
        47,
        61,
        67,
        184,
        141
      ],
      "accounts": [
        {
          "name": "signerRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  105,
                  103,
                  110,
                  101,
                  114,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "registryType"
              },
              {
                "kind": "arg",
                "path": "chainId"
              }
            ]
          }
        },
        {
          "name": "gateway",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  116,
                  101,
                  119,
                  97,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "gateway.chain_id",
                "account": "messageGateway"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "signerRegistry",
            "gateway"
          ]
        }
      ],
      "args": [
        {
          "name": "registryType",
          "type": {
            "defined": {
              "name": "signerRegistryType"
            }
          }
        },
        {
          "name": "chainId",
          "type": "u64"
        },
        {
          "name": "signerToRemove",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "sendMessage",
      "docs": [
        "Send a cross-chain message (tx_id auto-generated from counter)",
        "",
        "Initiates a cross-chain message that will be picked up by relayers and",
        "delivered to the destination chain. The transaction ID is automatically",
        "generated from the gateway's counter.",
        "",
        "# Arguments",
        "* `recipient` - Destination contract address in bytes format (20 bytes for EVM, 32 for Solana)",
        "* `dest_chain_id` - Destination blockchain identifier",
        "* `chain_data` - Application-specific message payload (max 1024 bytes)",
        "* `confirmations` - Number of block confirmations required before relaying",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `GatewayError::SystemDisabled` - If the gateway system is disabled",
        "* `GatewayError::EmptyRecipient` - If recipient bytes are empty",
        "* `GatewayError::EmptyChainData` - If chain_data is empty",
        "* `GatewayError::RecipientTooLong` - If recipient > 64 bytes (DOS protection)",
        "* `GatewayError::OnChainDataTooLarge` - If chain_data > 1024 bytes (DOS protection)",
        "* `GatewayError::TxIdOverflow` - If counter has reached maximum value",
        "",
        "# Events",
        "Emits `SendRequested` event with all message details for relayers to process",
        "",
        "# Cross-Chain Flow",
        "1. This function emits an event on the source chain",
        "2. Relayers pick up the event and deliver to destination chain",
        "3. On destination: [`create_tx_pda`] (TX1) creates replay protection",
        "4. On destination: [`process_message`] (TX2) validates and executes",
        "",
        "# Ethereum Equivalent",
        "`send(bytes memory _recipient, bytes32 _destChain, bytes memory _chainData, uint16 _confirmations) returns (uint _txId)`"
      ],
      "discriminator": [
        57,
        40,
        34,
        178,
        189,
        10,
        65,
        26
      ],
      "accounts": [
        {
          "name": "gateway",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  116,
                  101,
                  119,
                  97,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "gateway.chain_id",
                "account": "messageGateway"
              }
            ]
          }
        },
        {
          "name": "counter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  120,
                  95,
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "gateway.chain_id",
                "account": "messageGateway"
              }
            ]
          }
        },
        {
          "name": "sender",
          "signer": true
        },
        {
          "name": "senderProgram"
        },
        {
          "name": "feeHandlerProgram"
        },
        {
          "name": "feeConfig"
        },
        {
          "name": "clientFeeConfig"
        },
        {
          "name": "feePayer",
          "docs": [
            "Fee payer (typically same as sender, but can be different)"
          ],
          "signer": true
        },
        {
          "name": "feePayerTokenAccount",
          "writable": true
        },
        {
          "name": "accountantTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "programId",
          "type": "pubkey"
        },
        {
          "name": "recipient",
          "type": "bytes"
        },
        {
          "name": "destChainId",
          "type": "u64"
        },
        {
          "name": "chainData",
          "type": "bytes"
        },
        {
          "name": "confirmations",
          "type": "u16"
        }
      ]
    },
    {
      "name": "setRegistryEnabled",
      "docs": [
        "Enable or disable a signer registry",
        "",
        "Temporarily disables signature validation for a specific registry without",
        "deleting signers. Useful for maintenance or emergency situations.",
        "",
        "# Arguments",
        "* `registry_type` - Type of registry: `Via`, `Chain`, or `Project`",
        "* `chain_id` - Chain identifier for the registry",
        "* `enabled` - `true` to enable validation, `false` to disable",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `GatewayError::UnauthorizedAuthority` - If caller is not the gateway authority",
        "",
        "# Authority",
        "Only the gateway authority can enable/disable registries",
        "",
        "# Security Note",
        "Disabling a registry means that layer of validation will be skipped in [`process_message`].",
        "Use with extreme caution as it reduces the three-layer security architecture.",
        "",
        "# Ethereum Equivalent",
        "No direct equivalent - Solana-specific feature"
      ],
      "discriminator": [
        182,
        206,
        110,
        162,
        187,
        35,
        250,
        156
      ],
      "accounts": [
        {
          "name": "signerRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  105,
                  103,
                  110,
                  101,
                  114,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "registryType"
              },
              {
                "kind": "arg",
                "path": "chainId"
              }
            ]
          }
        },
        {
          "name": "gateway",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  116,
                  101,
                  119,
                  97,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "gateway.chain_id",
                "account": "messageGateway"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "signerRegistry",
            "gateway"
          ]
        }
      ],
      "args": [
        {
          "name": "registryType",
          "type": {
            "defined": {
              "name": "signerRegistryType"
            }
          }
        },
        {
          "name": "chainId",
          "type": "u64"
        },
        {
          "name": "enabled",
          "type": "bool"
        }
      ]
    },
    {
      "name": "setSystemEnabled",
      "docs": [
        "Update system enabled status (admin only)",
        "",
        "Emergency stop switch that enables or disables the entire messaging system.",
        "When disabled, no new messages can be sent and no messages can be processed.",
        "",
        "# Arguments",
        "* `enabled` - `true` to enable the system, `false` to disable",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `GatewayError::UnauthorizedAuthority` - If caller is not the gateway authority",
        "",
        "# Authority",
        "Only the gateway authority can call this instruction",
        "",
        "# Ethereum Equivalent",
        "`setSystemEnabled(bool _enabled)`"
      ],
      "discriminator": [
        111,
        56,
        184,
        154,
        1,
        178,
        253,
        178
      ],
      "accounts": [
        {
          "name": "gateway",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  116,
                  101,
                  119,
                  97,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "gateway.chain_id",
                "account": "messageGateway"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "gateway"
          ]
        }
      ],
      "args": [
        {
          "name": "enabled",
          "type": "bool"
        }
      ]
    },
    {
      "name": "updateSigners",
      "docs": [
        "Update signers in an existing registry",
        "",
        "Completely replaces the current signer list and threshold with new values.",
        "Use this for bulk updates or key rotation scenarios.",
        "",
        "# Arguments",
        "* `registry_type` - Type of registry to update: `Via`, `Chain`, or `Project`",
        "* `chain_id` - Chain identifier for the registry",
        "* `new_signers` - New list of authorized signer public keys (max 10)",
        "* `new_required_signatures` - New minimum signature threshold (must be ≤ new_signers.length)",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `GatewayError::UnauthorizedAuthority` - If caller is not the gateway authority",
        "* `GatewayError::InsufficientSignatures` - If new_signers is empty",
        "* `GatewayError::TooManySignatures` - If more than 10 signers provided",
        "* `GatewayError::InvalidThreshold` - If new_required_signatures is invalid",
        "",
        "# Authority",
        "Only the gateway authority can update registries",
        "",
        "See also: [`initialize_signer_registry`] prerequisite, [`add_signer`]/[`remove_signer`] for incremental changes",
        "",
        "# Ethereum Equivalent",
        "`setChainSigners()`, `setViaSigners()`, and `setProjectSigners()` functions"
      ],
      "discriminator": [
        228,
        82,
        68,
        150,
        92,
        66,
        140,
        174
      ],
      "accounts": [
        {
          "name": "signerRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  105,
                  103,
                  110,
                  101,
                  114,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "registryType"
              },
              {
                "kind": "arg",
                "path": "chainId"
              }
            ]
          }
        },
        {
          "name": "gateway",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  116,
                  101,
                  119,
                  97,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "gateway.chain_id",
                "account": "messageGateway"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "signerRegistry",
            "gateway"
          ]
        }
      ],
      "args": [
        {
          "name": "registryType",
          "type": {
            "defined": {
              "name": "signerRegistryType"
            }
          }
        },
        {
          "name": "chainId",
          "type": "u64"
        },
        {
          "name": "newSigners",
          "type": {
            "vec": "pubkey"
          }
        },
        {
          "name": "newRequiredSignatures",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updateThreshold",
      "docs": [
        "Update signature threshold for a registry",
        "",
        "Changes the minimum number of signatures required for validation without",
        "modifying the signer list. Useful for adjusting security levels.",
        "",
        "# NEW ARCHITECTURE",
        "For Via/Chain registries: The combined threshold used in validation is",
        "max(via_threshold, chain_threshold). Updating either registry's threshold",
        "may change the effective combined threshold used in message processing.",
        "For Project registry: Threshold is validated separately from via/chain.",
        "",
        "# Arguments",
        "* `registry_type` - Type of registry: `Via`, `Chain`, or `Project`",
        "* `chain_id` - Chain identifier for the registry",
        "* `new_threshold` - New minimum signature requirement (must be > 0 and ≤ current signer count)",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `GatewayError::UnauthorizedAuthority` - If caller is not the gateway authority",
        "* `GatewayError::InvalidThreshold` - If new_threshold is 0",
        "* `GatewayError::ThresholdTooHigh` - If new_threshold > current number of signers",
        "",
        "# Authority",
        "Only the gateway authority can update thresholds",
        "",
        "See also: [`initialize_signer_registry`] prerequisite, [`process_message`] uses threshold for validation",
        "",
        "# Ethereum Equivalent",
        "Part of `setChainSigners()` threshold management"
      ],
      "discriminator": [
        251,
        36,
        24,
        179,
        157,
        31,
        239,
        234
      ],
      "accounts": [
        {
          "name": "signerRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  105,
                  103,
                  110,
                  101,
                  114,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "registryType"
              },
              {
                "kind": "arg",
                "path": "chainId"
              }
            ]
          }
        },
        {
          "name": "gateway",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  116,
                  101,
                  119,
                  97,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "gateway.chain_id",
                "account": "messageGateway"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "signerRegistry",
            "gateway"
          ]
        }
      ],
      "args": [
        {
          "name": "registryType",
          "type": {
            "defined": {
              "name": "signerRegistryType"
            }
          }
        },
        {
          "name": "chainId",
          "type": "u64"
        },
        {
          "name": "newThreshold",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "counterPda",
      "discriminator": [
        187,
        249,
        83,
        230,
        177,
        79,
        22,
        88
      ]
    },
    {
      "name": "messageGateway",
      "discriminator": [
        101,
        7,
        242,
        247,
        127,
        9,
        194,
        239
      ]
    },
    {
      "name": "signerRegistry",
      "discriminator": [
        37,
        94,
        245,
        241,
        133,
        24,
        160,
        60
      ]
    },
    {
      "name": "txIdCounter",
      "discriminator": [
        98,
        66,
        48,
        99,
        203,
        247,
        202,
        42
      ]
    },
    {
      "name": "txIdPda",
      "discriminator": [
        106,
        104,
        187,
        35,
        237,
        148,
        236,
        80
      ]
    }
  ],
  "events": [
    {
      "name": "counterInitialized",
      "discriminator": [
        115,
        205,
        233,
        189,
        129,
        219,
        117,
        64
      ]
    },
    {
      "name": "messageProcessed",
      "discriminator": [
        2,
        130,
        134,
        46,
        240,
        230,
        84,
        167
      ]
    },
    {
      "name": "sendRequested",
      "discriminator": [
        217,
        24,
        132,
        154,
        4,
        108,
        119,
        122
      ]
    },
    {
      "name": "systemStatusChanged",
      "discriminator": [
        18,
        131,
        41,
        24,
        16,
        116,
        41,
        118
      ]
    },
    {
      "name": "txPdaCreated",
      "discriminator": [
        13,
        56,
        119,
        169,
        156,
        177,
        62,
        120
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "systemDisabled",
      "msg": "System is disabled"
    },
    {
      "code": 6001,
      "name": "emptyRecipient",
      "msg": "Empty recipient address"
    },
    {
      "code": 6002,
      "name": "emptyChainData",
      "msg": "Empty chain data"
    },
    {
      "code": 6003,
      "name": "invalidDestChain",
      "msg": "Invalid destination chain"
    },
    {
      "code": 6004,
      "name": "unauthorizedAuthority",
      "msg": "Unauthorized authority"
    },
    {
      "code": 6005,
      "name": "invalidTxId",
      "msg": "Invalid transaction ID"
    },
    {
      "code": 6006,
      "name": "senderTooLong",
      "msg": "Sender address too long"
    },
    {
      "code": 6007,
      "name": "recipientTooLong",
      "msg": "Recipient address too long"
    },
    {
      "code": 6008,
      "name": "invalidSenderLength",
      "msg": "Invalid sender length. Must be 20 bytes (EVM) or 32 bytes (Solana/Stellar)"
    },
    {
      "code": 6009,
      "name": "invalidRecipientLength",
      "msg": "Invalid recipient length. Must be 20 bytes (EVM) or 32 bytes (Solana/Stellar)"
    },
    {
      "code": 6010,
      "name": "onChainDataTooLarge",
      "msg": "On-chain data too large"
    },
    {
      "code": 6011,
      "name": "offChainDataTooLarge",
      "msg": "Off-chain data too large"
    },
    {
      "code": 6012,
      "name": "invalidSignature",
      "msg": "Invalid signature provided"
    },
    {
      "code": 6013,
      "name": "insufficientSignatures",
      "msg": "Insufficient signatures for validation"
    },
    {
      "code": 6014,
      "name": "unauthorizedSigner",
      "msg": "Unauthorized signer"
    },
    {
      "code": 6015,
      "name": "invalidMessageHash",
      "msg": "Invalid message hash"
    },
    {
      "code": 6016,
      "name": "insufficientViaSignatures",
      "msg": "Via signature threshold not met"
    },
    {
      "code": 6017,
      "name": "insufficientChainSignatures",
      "msg": "Chain signature threshold not met"
    },
    {
      "code": 6018,
      "name": "insufficientProjectSignatures",
      "msg": "Project signature threshold not met"
    },
    {
      "code": 6019,
      "name": "duplicateSigner",
      "msg": "Duplicate signer detected"
    },
    {
      "code": 6020,
      "name": "tooManySignatures",
      "msg": "Too many signatures provided"
    },
    {
      "code": 6021,
      "name": "tooFewSignatures",
      "msg": "Too few signatures provided"
    },
    {
      "code": 6022,
      "name": "invalidSignerRegistryType",
      "msg": "Invalid signer registry type"
    },
    {
      "code": 6023,
      "name": "signerRegistryDisabled",
      "msg": "Signer registry is disabled"
    },
    {
      "code": 6024,
      "name": "invalidThreshold",
      "msg": "Invalid threshold configuration"
    },
    {
      "code": 6025,
      "name": "thresholdTooHigh",
      "msg": "Threshold too high for signer count"
    },
    {
      "code": 6026,
      "name": "ed25519VerificationFailed",
      "msg": "Ed25519 signature verification failed"
    },
    {
      "code": 6027,
      "name": "messageHashMismatch",
      "msg": "Message hash mismatch"
    },
    {
      "code": 6028,
      "name": "hashGenerationFailed",
      "msg": "Cross-chain hash generation failed"
    },
    {
      "code": 6029,
      "name": "invalidSignatureFormat",
      "msg": "Signature format invalid"
    },
    {
      "code": 6030,
      "name": "ed25519InstructionTooSmall",
      "msg": "Ed25519 instruction data too small"
    },
    {
      "code": 6031,
      "name": "ed25519InvalidHeader",
      "msg": "Ed25519 header format invalid"
    },
    {
      "code": 6032,
      "name": "ed25519MultipleSignaturesUnsupported",
      "msg": "Ed25519 instruction supports only single signature"
    },
    {
      "code": 6033,
      "name": "ed25519CrossInstructionUnsupported",
      "msg": "Ed25519 cross-instruction references not supported"
    },
    {
      "code": 6034,
      "name": "ed25519SignatureOffsetInvalid",
      "msg": "Ed25519 signature offset out of bounds"
    },
    {
      "code": 6035,
      "name": "ed25519PublicKeyOffsetInvalid",
      "msg": "Ed25519 public key offset out of bounds"
    },
    {
      "code": 6036,
      "name": "ed25519MessageOffsetInvalid",
      "msg": "Ed25519 message offset out of bounds"
    },
    {
      "code": 6037,
      "name": "ed25519MessageSizeMismatch",
      "msg": "Ed25519 message size mismatch"
    },
    {
      "code": 6038,
      "name": "ed25519InstructionNotFound",
      "msg": "No matching Ed25519 instruction found"
    },
    {
      "code": 6039,
      "name": "invalidChainId",
      "msg": "Invalid chain ID"
    },
    {
      "code": 6040,
      "name": "unsupportedChain",
      "msg": "Unsupported chain"
    },
    {
      "code": 6041,
      "name": "unauthorizedAccess",
      "msg": "Unauthorized access"
    },
    {
      "code": 6042,
      "name": "gatewayDisabled",
      "msg": "Gateway is disabled"
    },
    {
      "code": 6043,
      "name": "txIdTooOld",
      "msg": "Transaction ID is too old - must be greater than highest seen"
    },
    {
      "code": 6044,
      "name": "txIdOverflow",
      "msg": "Transaction ID counter overflow - maximum transactions reached"
    },
    {
      "code": 6045,
      "name": "serializationFailed",
      "msg": "Failed to serialize CPI instruction data"
    },
    {
      "code": 6046,
      "name": "tooManyAccounts",
      "msg": "Too many accounts provided - exceeds protocol limit"
    },
    {
      "code": 6047,
      "name": "invalidRecipientPda",
      "msg": "Recipient PDA verification failed - invalid derivation"
    },
    {
      "code": 6048,
      "name": "noExecutableProgram",
      "msg": "No executable program found in remaining accounts"
    },
    {
      "code": 6049,
      "name": "invalidClientConfigSeed",
      "msg": "ClientConfig PDA seed mismatch - expected standard derivation"
    },
    {
      "code": 6050,
      "name": "feeHandlerFailed",
      "msg": "Fee collection failed - transaction reverted"
    },
    {
      "code": 6051,
      "name": "gasHandlerFailed",
      "msg": "Gas reimbursement failed (non-critical)"
    }
  ],
  "types": [
    {
      "name": "counterInitialized",
      "docs": [
        "Event emitted when a Counter PDA is initialized"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "sourceChainId",
            "type": "u64"
          },
          {
            "name": "counterPda",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "gateway",
            "type": "pubkey"
          },
          {
            "name": "highestTxIdSeen",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "counterPda",
      "docs": [
        "Counter PDA tracking message processing per source chain",
        "Allows out-of-order message processing while detecting gaps"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "sourceChainId",
            "docs": [
              "Source chain identifier"
            ],
            "type": "u64"
          },
          {
            "name": "highestTxIdSeen",
            "docs": [
              "Highest transaction ID seen from this chain"
            ],
            "type": "u128"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "messageGateway",
      "docs": [
        "Main gateway account storing configuration and state"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Admin authority that can modify gateway settings"
            ],
            "type": "pubkey"
          },
          {
            "name": "chainId",
            "docs": [
              "Chain identifier for this gateway instance"
            ],
            "type": "u64"
          },
          {
            "name": "systemEnabled",
            "docs": [
              "System enable flag for emergency stops"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "messageProcessed",
      "docs": [
        "Event emitted when a message is processed (TX2)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "txId",
            "type": "u128"
          },
          {
            "name": "sourceChainId",
            "type": "u64"
          },
          {
            "name": "relayer",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "sendRequested",
      "docs": [
        "Event emitted when a message is sent"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "txId",
            "type": "u128"
          },
          {
            "name": "sender",
            "type": "bytes"
          },
          {
            "name": "recipient",
            "type": "bytes"
          },
          {
            "name": "destChainId",
            "type": "u64"
          },
          {
            "name": "chainData",
            "type": "bytes"
          },
          {
            "name": "confirmations",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "signerRegistry",
      "docs": [
        "Signer registry for managing authorized signers in three-layer security model"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "registryType",
            "docs": [
              "Type of registry (Via, Chain, or Project)"
            ],
            "type": {
              "defined": {
                "name": "signerRegistryType"
              }
            }
          },
          {
            "name": "authority",
            "docs": [
              "Authority that can modify this registry"
            ],
            "type": "pubkey"
          },
          {
            "name": "signers",
            "docs": [
              "List of authorized signer public keys"
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "requiredSignatures",
            "docs": [
              "Required number of signatures for validation"
            ],
            "type": "u8"
          },
          {
            "name": "chainId",
            "docs": [
              "Chain ID this registry is associated with"
            ],
            "type": "u64"
          },
          {
            "name": "enabled",
            "docs": [
              "Whether this registry is active"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "signerRegistryType",
      "docs": [
        "Type of signer registry for three-layer security"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "via"
          },
          {
            "name": "chain"
          },
          {
            "name": "project"
          }
        ]
      }
    },
    {
      "name": "systemStatusChanged",
      "docs": [
        "Event emitted when system status changes"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "enabled",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "txIdCounter",
      "docs": [
        "Separate PDA account for tracking transaction ID counter",
        "",
        "This account is created per gateway to track sequential message IDs",
        "without modifying the existing MessageGateway structure.",
        "The chain_id relationship is enforced by PDA derivation."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nextTxId",
            "docs": [
              "Next transaction ID to assign (increments sequentially)"
            ],
            "type": "u128"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "txIdPda",
      "docs": [
        "TxId PDA for two-transaction replay protection",
        "Created in TX1, closed in TX2 (rent reclaimed)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "txId",
            "docs": [
              "Transaction ID from source chain"
            ],
            "type": "u128"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "txPdaCreated",
      "docs": [
        "Event emitted when TxId PDA is created (TX1)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "txId",
            "type": "u128"
          },
          {
            "name": "sourceChainId",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
