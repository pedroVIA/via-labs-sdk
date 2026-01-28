/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/gas_handler_v4.json`.
 */
export type GasHandlerV4 = {
  "address": "41eyyy8Ap3jVcXVaSp6AX9jNcrQzaJ7XUQdDhY3KCwt7",
  "metadata": {
    "name": "gasHandlerV4",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Gas reimbursement handler for Via Labs V4 cross-chain messaging"
  },
  "docs": [
    "Via Labs V4 Gas Handler Program",
    "",
    "Native SOL gas reimbursement handler for cross-chain messaging.",
    "Reimburses relayers for transaction costs from a dedicated pool."
  ],
  "instructions": [
    {
      "name": "fundGasPool",
      "docs": [
        "Fund the gas pool with SOL",
        "",
        "Transfers SOL from funder to the gas pool. The pool must be initialized",
        "first via `initialize_gas_pool`.",
        "",
        "# Arguments",
        "* `amount` - Amount of lamports to add to the pool",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `GasHandlerError::PoolFundingTooSmall` - If amount < MIN_POOL_BALANCE",
        "* `GasHandlerError::UnauthorizedAuthority` - If caller is not authority",
        "",
        "# Authority",
        "Only the gas pool authority can fund the pool",
        "",
        "# Events",
        "Emits `GasPoolFunded` event"
      ],
      "discriminator": [
        73,
        79,
        183,
        131,
        76,
        99,
        151,
        49
      ],
      "accounts": [
        {
          "name": "gasPool",
          "docs": [
            "Gas pool PDA to receive SOL"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  115,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "gateway"
              }
            ]
          }
        },
        {
          "name": "gasConfig",
          "docs": [
            "Gas config for this gateway (for validation)"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  115,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "gateway"
              }
            ]
          }
        },
        {
          "name": "gateway",
          "docs": [
            "Gateway this gas pool serves"
          ],
          "relations": [
            "gasPool"
          ]
        },
        {
          "name": "authority",
          "docs": [
            "Authority that can fund the pool"
          ],
          "signer": true,
          "relations": [
            "gasPool"
          ]
        },
        {
          "name": "funder",
          "docs": [
            "Account funding the pool (typically authority, but can be any account)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program for SOL transfer"
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeClientGasConfig",
      "docs": [
        "Initialize client-specific gas configuration",
        "",
        "Creates a gas override configuration for a specific client program.",
        "Allows custom max gas caps and enable/disable per client.",
        "",
        "# Arguments",
        "* `max_gas_override` - Optional client-specific max reimbursement cap",
        "* `gas_token_mint` - Token mint for gas (FUTURE: unused in MVP, native SOL only)",
        "* `enabled` - Whether gas reimbursement is enabled for this client",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `GasHandlerError::UnauthorizedAuthority` - If caller is not gas authority",
        "* `GasHandlerError::ReimbursementExceedsMaximum` - If override > global max",
        "",
        "# Authority",
        "Only the gas config authority can initialize client configs",
        "",
        "# Events",
        "Emits `ClientGasConfigInitialized` event"
      ],
      "discriminator": [
        190,
        200,
        92,
        117,
        195,
        191,
        102,
        80
      ],
      "accounts": [
        {
          "name": "clientConfig",
          "docs": [
            "Client gas configuration PDA"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  108,
                  105,
                  101,
                  110,
                  116,
                  95,
                  103,
                  97,
                  115,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "gateway"
              },
              {
                "kind": "account",
                "path": "clientProgram"
              }
            ]
          }
        },
        {
          "name": "gasConfig",
          "docs": [
            "Gas config for this gateway (must exist)"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  115,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "gateway"
              }
            ]
          }
        },
        {
          "name": "gateway",
          "docs": [
            "Gateway this client config serves"
          ]
        },
        {
          "name": "clientProgram",
          "docs": [
            "Client program ID this config applies to"
          ]
        },
        {
          "name": "authority",
          "docs": [
            "Authority from gas_config (must be signer)"
          ],
          "writable": true,
          "signer": true,
          "relations": [
            "gasConfig"
          ]
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program for PDA creation"
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "maxGasOverride",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "gasTokenMint",
          "type": "pubkey"
        },
        {
          "name": "enabled",
          "type": "bool"
        }
      ]
    },
    {
      "name": "initializeGasConfig",
      "docs": [
        "Initialize gas configuration for a gateway",
        "",
        "Creates the global gas configuration PDA for a specific gateway. This",
        "must be called once before gas reimbursements can be processed.",
        "",
        "# Arguments",
        "* `base_reimbursement` - Base reimbursement amount in lamports (e.g., 5_000_000 = 0.005 SOL)",
        "* `max_reimbursement` - Maximum reimbursement cap in lamports (e.g., 50_000_000 = 0.05 SOL)",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `GasHandlerError::ReimbursementBelowMinimum` - If base < MIN_REIMBURSEMENT_AMOUNT",
        "* `GasHandlerError::ReimbursementExceedsMaximum` - If max > MAX_REIMBURSEMENT_LIMIT or base > max",
        "",
        "# Authority",
        "Can be called by anyone, but caller becomes the gas authority",
        "",
        "# Events",
        "Emits `GasConfigInitialized` event"
      ],
      "discriminator": [
        223,
        206,
        21,
        37,
        172,
        126,
        253,
        158
      ],
      "accounts": [
        {
          "name": "gasConfig",
          "docs": [
            "Gas configuration PDA"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  115,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "gateway"
              }
            ]
          }
        },
        {
          "name": "gateway",
          "docs": [
            "Gateway this gas config serves (typically MessageGateway PDA)"
          ]
        },
        {
          "name": "authority",
          "docs": [
            "Authority that can modify gas settings (typically gateway authority)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program for PDA creation"
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "baseReimbursement",
          "type": "u64"
        },
        {
          "name": "maxReimbursement",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeGasPool",
      "docs": [
        "Initialize the gas pool to hold SOL for reimbursements",
        "",
        "Creates the gas pool PDA that will hold SOL. Must be called once",
        "before the pool can be funded or reimbursements can be processed.",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Authority",
        "Can be called by anyone, but authority is set from the caller"
      ],
      "discriminator": [
        40,
        202,
        173,
        113,
        4,
        162,
        24,
        113
      ],
      "accounts": [
        {
          "name": "gasPool",
          "docs": [
            "Gas pool PDA that will hold SOL"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  115,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "gateway"
              }
            ]
          }
        },
        {
          "name": "gateway",
          "docs": [
            "Gateway this gas pool serves"
          ]
        },
        {
          "name": "authority",
          "docs": [
            "Authority that can fund the pool and modify settings"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program for PDA creation"
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "processGasRefund",
      "docs": [
        "Process gas reimbursement for a cross-chain message",
        "",
        "Called via CPI from MessageGateway's process_message instruction.",
        "Transfers SOL from gas pool to relayer as reimbursement for gas costs.",
        "",
        "# Reimbursement Calculation",
        "1. Start with `base_reimbursement` from GasConfig",
        "2. Apply `max_gas_override` from ClientGasConfig if exists (minimum of base and override)",
        "3. Apply global `max_reimbursement` cap",
        "4. Validate minimum threshold",
        "",
        "# Arguments",
        "* `client_program_id` - Client program initiating the message",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `GasHandlerError::GasReimbursementDisabled` - If globally or client-specific disabled",
        "* `GasHandlerError::InsufficientPoolFunds` - If pool balance < reimbursement (REVERTS TX)",
        "* `GasHandlerError::ReimbursementBelowMinimum` - If calculated amount too small",
        "",
        "# Critical Behavior",
        "**This instruction REVERTS the entire transaction if the pool has insufficient funds.**",
        "This ensures relayers are always reimbursed or the message processing fails.",
        "",
        "# Events",
        "Emits `GasRefundProcessed` event on success"
      ],
      "discriminator": [
        40,
        250,
        220,
        244,
        223,
        0,
        165,
        176
      ],
      "accounts": [
        {
          "name": "gasConfig",
          "docs": [
            "Gas configuration (must be enabled)"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  115,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "gateway"
              }
            ]
          }
        },
        {
          "name": "gasPool",
          "docs": [
            "Gas pool to transfer SOL from"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  115,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "gateway"
              }
            ]
          }
        },
        {
          "name": "clientConfig",
          "docs": [
            "Optional: Client gas configuration for custom overrides",
            "If None, only global gas config is used"
          ],
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  108,
                  105,
                  101,
                  110,
                  116,
                  95,
                  103,
                  97,
                  115,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "gateway"
              },
              {
                "kind": "arg",
                "path": "clientProgramId"
              }
            ]
          }
        },
        {
          "name": "gateway",
          "docs": [
            "Gateway this gas config serves"
          ],
          "relations": [
            "gasPool"
          ]
        },
        {
          "name": "relayer",
          "docs": [
            "Relayer account to receive gas refund"
          ],
          "writable": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program for SOL transfer"
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "clientProgramId",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "setEnabled",
      "docs": [
        "Set gas reimbursement enabled/disabled status",
        "",
        "Emergency switch to disable or enable gas reimbursement globally.",
        "",
        "# Arguments",
        "* `enabled` - true to enable gas reimbursement, false to disable",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `GasHandlerError::UnauthorizedAuthority` - If caller is not gas authority",
        "",
        "# Authority",
        "Only the gas config authority can change enabled status",
        "",
        "# Events",
        "Emits `GasReimbursementStatusChanged` event"
      ],
      "discriminator": [
        108,
        151,
        239,
        151,
        181,
        233,
        110,
        123
      ],
      "accounts": [
        {
          "name": "gasConfig",
          "docs": [
            "Gas configuration to update"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  115,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "gateway"
              }
            ]
          }
        },
        {
          "name": "gateway",
          "docs": [
            "Gateway this gas config serves"
          ]
        },
        {
          "name": "authority",
          "docs": [
            "Authority that can modify settings"
          ],
          "signer": true,
          "relations": [
            "gasConfig"
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
      "name": "updateClientConfig",
      "docs": [
        "Update client gas configuration",
        "",
        "Updates the gas overrides for a specific client program.",
        "",
        "# Arguments",
        "* `max_gas_override` - Optional client-specific max reimbursement cap",
        "* `enabled` - Whether gas reimbursement is enabled for this client",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `GasHandlerError::UnauthorizedAuthority` - If caller is not gas authority",
        "* `GasHandlerError::ReimbursementExceedsMaximum` - If override > global max",
        "",
        "# Authority",
        "Only the gas config authority can update client configs",
        "",
        "# Events",
        "Emits `ClientGasConfigUpdated` event"
      ],
      "discriminator": [
        54,
        6,
        9,
        50,
        104,
        245,
        179,
        12
      ],
      "accounts": [
        {
          "name": "clientConfig",
          "docs": [
            "Client gas configuration to update"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  108,
                  105,
                  101,
                  110,
                  116,
                  95,
                  103,
                  97,
                  115,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "gateway"
              },
              {
                "kind": "account",
                "path": "clientProgram"
              }
            ]
          }
        },
        {
          "name": "gasConfig",
          "docs": [
            "Gas config for authority validation"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  115,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "gateway"
              }
            ]
          }
        },
        {
          "name": "gateway",
          "docs": [
            "Gateway this client config serves"
          ]
        },
        {
          "name": "clientProgram",
          "docs": [
            "Client program this config applies to"
          ]
        },
        {
          "name": "authority",
          "docs": [
            "Authority from gas_config"
          ],
          "signer": true,
          "relations": [
            "gasConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "maxGasOverride",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "enabled",
          "type": "bool"
        }
      ]
    },
    {
      "name": "updateGasConfig",
      "docs": [
        "Update gas configuration settings",
        "",
        "Allows the authority to update base and max reimbursement amounts.",
        "",
        "# Arguments",
        "* `new_base_reimbursement` - Optional new base reimbursement amount",
        "* `new_max_reimbursement` - Optional new max reimbursement cap",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `GasHandlerError::UnauthorizedAuthority` - If caller is not gas authority",
        "* `GasHandlerError::ReimbursementBelowMinimum` - If new_base < MIN_REIMBURSEMENT_AMOUNT",
        "* `GasHandlerError::ReimbursementExceedsMaximum` - If new_max > MAX_REIMBURSEMENT_LIMIT",
        "",
        "# Authority",
        "Only the gas config authority can update settings",
        "",
        "# Events",
        "Emits `GasConfigUpdated` event"
      ],
      "discriminator": [
        125,
        146,
        136,
        51,
        113,
        242,
        53,
        199
      ],
      "accounts": [
        {
          "name": "gasConfig",
          "docs": [
            "Gas configuration to update"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  115,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "gateway"
              }
            ]
          }
        },
        {
          "name": "gateway",
          "docs": [
            "Gateway this gas config serves"
          ]
        },
        {
          "name": "authority",
          "docs": [
            "Authority that can modify settings"
          ],
          "signer": true,
          "relations": [
            "gasConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "newBaseReimbursement",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "newMaxReimbursement",
          "type": {
            "option": "u64"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "clientGasConfig",
      "discriminator": [
        131,
        145,
        207,
        167,
        180,
        38,
        10,
        124
      ]
    },
    {
      "name": "gasConfig",
      "discriminator": [
        131,
        191,
        40,
        215,
        228,
        172,
        84,
        177
      ]
    },
    {
      "name": "gasPool",
      "discriminator": [
        41,
        29,
        229,
        57,
        24,
        152,
        210,
        34
      ]
    }
  ],
  "events": [
    {
      "name": "clientGasConfigInitialized",
      "discriminator": [
        194,
        136,
        61,
        243,
        251,
        153,
        79,
        218
      ]
    },
    {
      "name": "clientGasConfigUpdated",
      "discriminator": [
        232,
        112,
        107,
        37,
        232,
        210,
        221,
        217
      ]
    },
    {
      "name": "gasConfigInitialized",
      "discriminator": [
        124,
        238,
        29,
        42,
        178,
        172,
        237,
        252
      ]
    },
    {
      "name": "gasConfigUpdated",
      "discriminator": [
        253,
        13,
        123,
        32,
        241,
        55,
        22,
        143
      ]
    },
    {
      "name": "gasPoolFunded",
      "discriminator": [
        51,
        166,
        151,
        66,
        102,
        179,
        107,
        193
      ]
    },
    {
      "name": "gasRefundProcessed",
      "discriminator": [
        227,
        97,
        140,
        35,
        199,
        84,
        100,
        255
      ]
    },
    {
      "name": "gasReimbursementStatusChanged",
      "discriminator": [
        249,
        148,
        179,
        175,
        24,
        174,
        176,
        32
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "gasReimbursementDisabled",
      "msg": "Gas reimbursement is disabled - refunds cannot be processed"
    },
    {
      "code": 6001,
      "name": "unauthorizedAuthority",
      "msg": "Unauthorized authority - caller does not have permission"
    },
    {
      "code": 6002,
      "name": "reimbursementExceedsMaximum",
      "msg": "Reimbursement amount exceeds maximum allowed - check max_reimbursement configuration"
    },
    {
      "code": 6003,
      "name": "reimbursementBelowMinimum",
      "msg": "Reimbursement amount is below minimum threshold"
    },
    {
      "code": 6004,
      "name": "gasCalculationOverflow",
      "msg": "Arithmetic overflow in gas calculation"
    },
    {
      "code": 6005,
      "name": "insufficientPoolFunds",
      "msg": "Gas pool has insufficient funds - please fund the pool"
    },
    {
      "code": 6006,
      "name": "gasRefundTransferFailed",
      "msg": "Gas refund transfer failed - check pool balance and relayer account"
    },
    {
      "code": 6007,
      "name": "invalidGasPoolAccount",
      "msg": "Invalid gas pool account - does not match expected PDA"
    },
    {
      "code": 6008,
      "name": "invalidGatewayAccount",
      "msg": "Invalid gateway account - does not match configuration"
    },
    {
      "code": 6009,
      "name": "poolFundingTooSmall",
      "msg": "Pool funding amount is too small - must be at least minimum pool balance"
    }
  ],
  "types": [
    {
      "name": "clientGasConfig",
      "docs": [
        "Per-client gas configuration for custom gas reimbursement overrides",
        "Seeds: [b\"client_gas_config\", gateway.key().as_ref(), client_program.key().as_ref()]"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "clientProgram",
            "docs": [
              "Client program ID this config applies to"
            ],
            "type": "pubkey"
          },
          {
            "name": "gateway",
            "docs": [
              "Gateway this client config serves"
            ],
            "type": "pubkey"
          },
          {
            "name": "maxGasOverride",
            "docs": [
              "Client-specific maximum gas reimbursement cap (overrides global max)",
              "If set, effective max = min(max_gas_override, gas_config.max_reimbursement)"
            ],
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "gasTokenMint",
            "docs": [
              "FUTURE: SPL token mint for gas reimbursement (e.g., USDC, USDT)",
              "Currently unused in MVP (native SOL only)",
              "Will be used in Phase 2 for SPL token-based gas reimbursement"
            ],
            "type": "pubkey"
          },
          {
            "name": "enabled",
            "docs": [
              "Whether gas reimbursement is enabled for this client"
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
      "name": "clientGasConfigInitialized",
      "docs": [
        "Event emitted when ClientGasConfig is initialized"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gateway",
            "type": "pubkey"
          },
          {
            "name": "clientProgram",
            "type": "pubkey"
          },
          {
            "name": "maxGasOverride",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "enabled",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "clientGasConfigUpdated",
      "docs": [
        "Event emitted when ClientGasConfig is updated"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gateway",
            "type": "pubkey"
          },
          {
            "name": "clientProgram",
            "type": "pubkey"
          },
          {
            "name": "maxGasOverride",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "enabled",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "gasConfig",
      "docs": [
        "Global gas configuration for a gateway",
        "Seeds: [b\"gas_config\", gateway.key().as_ref()]"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Admin authority that can modify gas settings (typically gateway authority)"
            ],
            "type": "pubkey"
          },
          {
            "name": "gateway",
            "docs": [
              "Gateway this gas config serves"
            ],
            "type": "pubkey"
          },
          {
            "name": "baseReimbursement",
            "docs": [
              "Base reimbursement amount in lamports per transaction (1 SOL = 1_000_000_000 lamports)",
              "Default: 5_000_000 (0.005 SOL)"
            ],
            "type": "u64"
          },
          {
            "name": "maxReimbursement",
            "docs": [
              "Maximum reimbursement amount in lamports (safety cap)",
              "Default: 50_000_000 (0.05 SOL)"
            ],
            "type": "u64"
          },
          {
            "name": "enabled",
            "docs": [
              "Whether gas reimbursement is enabled"
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
      "name": "gasConfigInitialized",
      "docs": [
        "Event emitted when GasConfig is initialized"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gateway",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "baseReimbursement",
            "type": "u64"
          },
          {
            "name": "maxReimbursement",
            "type": "u64"
          },
          {
            "name": "enabled",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "gasConfigUpdated",
      "docs": [
        "Event emitted when GasConfig is updated"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gateway",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "baseReimbursement",
            "type": "u64"
          },
          {
            "name": "maxReimbursement",
            "type": "u64"
          },
          {
            "name": "enabled",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "gasPool",
      "docs": [
        "Gas pool account that holds SOL for gas reimbursements",
        "Seeds: [b\"gas_pool\", gateway.key().as_ref()]",
        "",
        "This PDA is owned by the gas-handler program and holds SOL",
        "that will be transferred to relayers as gas reimbursements.",
        "Admin can fund this pool via the fund_pool instruction."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gateway",
            "docs": [
              "Gateway this gas pool serves"
            ],
            "type": "pubkey"
          },
          {
            "name": "authority",
            "docs": [
              "Admin authority that can fund the pool"
            ],
            "type": "pubkey"
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
      "name": "gasPoolFunded",
      "docs": [
        "Event emitted when gas pool is funded"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gateway",
            "type": "pubkey"
          },
          {
            "name": "funder",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "newBalance",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "gasRefundProcessed",
      "docs": [
        "Event emitted when a gas refund is processed"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gateway",
            "type": "pubkey"
          },
          {
            "name": "clientProgram",
            "type": "pubkey"
          },
          {
            "name": "relayer",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "poolBalanceAfter",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "gasReimbursementStatusChanged",
      "docs": [
        "Event emitted when gas reimbursement status changes"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gateway",
            "type": "pubkey"
          },
          {
            "name": "enabled",
            "type": "bool"
          }
        ]
      }
    }
  ]
};
