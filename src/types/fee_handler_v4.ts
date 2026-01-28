/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/fee_handler_v4.json`.
 */
export type FeeHandlerV4 = {
  "address": "9HhgqsZdu36KDLeknQqBA6NNXodGWsQVM61EFSsMYqEY",
  "metadata": {
    "name": "feeHandlerV4",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Fee collection handler for Via Labs V4 cross-chain messaging"
  },
  "docs": [
    "Via Labs V4 Fee Handler Program",
    "",
    "SPL token fee collection handler for cross-chain messaging.",
    "Supports configurable fees with per-client overrides and decimal normalization."
  ],
  "instructions": [
    {
      "name": "initializeClientFeeConfig",
      "docs": [
        "Initialize client-specific fee configuration",
        "",
        "Creates a fee override configuration for a specific client program.",
        "Allows custom fees, fee caps, and zero-fee settings per client.",
        "",
        "# Arguments",
        "* `custom_fee` - Optional custom fee override (replaces min_fee)",
        "* `max_fee` - Optional maximum fee cap for protection",
        "* `zero_fee` - If true, no fee is collected (overrides all)",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `FeeHandlerError::UnauthorizedAuthority` - If caller is not fee authority",
        "* `FeeHandlerError::FeeExceedsMaximum` - If custom_fee > max_fee",
        "",
        "# Authority",
        "Only the fee config authority can initialize client configs",
        "",
        "# Events",
        "Emits `ClientFeeConfigInitialized` event"
      ],
      "discriminator": [
        210,
        57,
        109,
        99,
        59,
        103,
        94,
        87
      ],
      "accounts": [
        {
          "name": "clientConfig",
          "docs": [
            "Client fee configuration PDA"
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
                  102,
                  101,
                  101,
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
          "name": "feeConfig",
          "docs": [
            "Fee config for this gateway (must exist)"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
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
            "Authority from fee_config (must be signer)"
          ],
          "writable": true,
          "signer": true,
          "relations": [
            "feeConfig"
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
          "name": "customFee",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "maxFee",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "zeroFee",
          "type": "bool"
        }
      ]
    },
    {
      "name": "initializeFeeConfig",
      "docs": [
        "Initialize fee configuration for a gateway",
        "",
        "Creates the global fee configuration PDA for a specific gateway. This",
        "must be called once before fees can be collected.",
        "",
        "# Arguments",
        "* `min_fee` - Minimum fee amount in 6-decimal precision (e.g., 1_000_000 = 1 USDC)",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `FeeHandlerError::InvalidTokenDecimals` - If token decimals > 18",
        "",
        "# Authority",
        "Can be called by anyone, but caller becomes the fee authority",
        "",
        "# Events",
        "Emits `FeeConfigInitialized` event"
      ],
      "discriminator": [
        62,
        162,
        20,
        133,
        121,
        65,
        145,
        27
      ],
      "accounts": [
        {
          "name": "feeConfig",
          "docs": [
            "Fee configuration PDA"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
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
            "Gateway this fee config serves (can be any account, typically MessageGateway PDA)"
          ]
        },
        {
          "name": "feeTokenMint",
          "docs": [
            "SPL token mint for fee collection"
          ]
        },
        {
          "name": "accountant",
          "docs": [
            "Account where fees will be sent (must match fee_token_mint)"
          ]
        },
        {
          "name": "authority",
          "docs": [
            "Authority that can modify fee settings (typically gateway authority)"
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
        },
        {
          "name": "tokenProgram",
          "docs": [
            "Token program (required for SPL token operations)"
          ],
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "minFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "processFee",
      "docs": [
        "Process fee collection for a cross-chain message",
        "",
        "Called via CPI from MessageGateway's send_message instruction.",
        "Collects SPL token fees from sender and transfers to accountant.",
        "",
        "# Fee Priority",
        "1. If `zero_fee` flag set → Skip (return false)",
        "2. If `take_fees_offline` → Skip (return false)",
        "3. Use `custom_fee` if configured, otherwise `min_fee`",
        "4. Apply decimal normalization",
        "5. Enforce `max_fee` cap if configured",
        "",
        "# Arguments",
        "* `sender_program` - Client program initiating the message",
        "* `data_size` - Message data size (future use for dynamic fees)",
        "",
        "# Returns",
        "* `Result<bool>` - true if fee collected, false if skipped",
        "",
        "# Errors",
        "* `FeeHandlerError::InvalidFeeTokenMint` - Token mismatch",
        "* `FeeHandlerError::FeeExceedsMaximum` - Fee exceeds max_fee",
        "* `FeeHandlerError::FeeTransferFailed` - Transfer failed (e.g., insufficient balance)",
        "",
        "# Events",
        "Emits `FeeCollected` event on success"
      ],
      "discriminator": [
        37,
        183,
        11,
        109,
        146,
        52,
        65,
        141
      ],
      "accounts": [
        {
          "name": "feeConfig",
          "docs": [
            "Global fee configuration"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
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
                "path": "fee_config.gateway",
                "account": "feeConfig"
              }
            ]
          }
        },
        {
          "name": "clientFeeConfig",
          "docs": [
            "Optional client-specific fee configuration",
            "If not provided, uses default min_fee from fee_config"
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
                  102,
                  101,
                  101,
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
                "path": "fee_config.gateway",
                "account": "feeConfig"
              },
              {
                "kind": "arg",
                "path": "senderProgram"
              }
            ]
          }
        },
        {
          "name": "sender",
          "docs": [
            "Sender paying the fee"
          ],
          "signer": true
        },
        {
          "name": "senderTokenAccount",
          "docs": [
            "Sender's token account (source of fee payment)"
          ],
          "writable": true
        },
        {
          "name": "accountantTokenAccount",
          "docs": [
            "Accountant's token account (destination for fees)"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "docs": [
            "SPL Token program"
          ],
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "senderProgram",
          "type": "pubkey"
        },
        {
          "name": "dataSize",
          "type": "u64"
        }
      ],
      "returns": "bool"
    },
    {
      "name": "setOffline",
      "docs": [
        "Set fee collection offline/online status",
        "",
        "Emergency switch to disable or enable fee collection.",
        "",
        "# Arguments",
        "* `offline` - true to disable fee collection, false to enable",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `FeeHandlerError::UnauthorizedAuthority` - If caller is not fee authority",
        "",
        "# Authority",
        "Only the fee config authority can change offline status",
        "",
        "# Events",
        "Emits `FeeCollectionStatusChanged` event"
      ],
      "discriminator": [
        74,
        43,
        102,
        235,
        125,
        48,
        207,
        197
      ],
      "accounts": [
        {
          "name": "feeConfig",
          "docs": [
            "Fee configuration to update"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
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
            "Gateway this fee config serves"
          ]
        },
        {
          "name": "authority",
          "docs": [
            "Authority that can modify settings"
          ],
          "signer": true,
          "relations": [
            "feeConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "offline",
          "type": "bool"
        }
      ]
    },
    {
      "name": "updateClientConfig",
      "docs": [
        "Update client fee configuration",
        "",
        "Updates the fee overrides for a specific client program.",
        "",
        "# Arguments",
        "* `custom_fee` - Optional custom fee override",
        "* `max_fee` - Optional maximum fee cap",
        "* `zero_fee` - If true, no fee is collected",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `FeeHandlerError::UnauthorizedAuthority` - If caller is not fee authority",
        "* `FeeHandlerError::FeeExceedsMaximum` - If custom_fee > max_fee",
        "",
        "# Authority",
        "Only the fee config authority can update client configs",
        "",
        "# Events",
        "Emits `ClientFeeConfigUpdated` event"
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
            "Client fee configuration to update"
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
                  102,
                  101,
                  101,
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
          "name": "feeConfig",
          "docs": [
            "Fee config for authority validation"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
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
            "Authority from fee_config"
          ],
          "signer": true,
          "relations": [
            "feeConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "customFee",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "maxFee",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "zeroFee",
          "type": "bool"
        }
      ]
    },
    {
      "name": "updateFeeConfig",
      "docs": [
        "Update fee configuration settings",
        "",
        "Allows the authority to update the accountant or minimum fee.",
        "Note: Fee token mint cannot be changed after initialization.",
        "",
        "# Arguments",
        "* `new_accountant` - Optional new accountant address",
        "* `new_min_fee` - Optional new minimum fee amount",
        "",
        "# Returns",
        "* `Result<()>` - Success or error",
        "",
        "# Errors",
        "* `FeeHandlerError::UnauthorizedAuthority` - If caller is not fee authority",
        "",
        "# Authority",
        "Only the fee config authority can update settings",
        "",
        "# Events",
        "Emits `FeeConfigUpdated` event"
      ],
      "discriminator": [
        104,
        184,
        103,
        242,
        88,
        151,
        107,
        20
      ],
      "accounts": [
        {
          "name": "feeConfig",
          "docs": [
            "Fee configuration to update"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
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
            "Gateway this fee config serves"
          ]
        },
        {
          "name": "authority",
          "docs": [
            "Authority that can modify settings"
          ],
          "signer": true,
          "relations": [
            "feeConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "newAccountant",
          "type": {
            "option": "pubkey"
          }
        },
        {
          "name": "newMinFee",
          "type": {
            "option": "u64"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "clientFeeConfig",
      "discriminator": [
        141,
        101,
        37,
        204,
        77,
        24,
        254,
        101
      ]
    },
    {
      "name": "feeConfig",
      "discriminator": [
        143,
        52,
        146,
        187,
        219,
        123,
        76,
        155
      ]
    }
  ],
  "events": [
    {
      "name": "clientFeeConfigInitialized",
      "discriminator": [
        89,
        82,
        12,
        22,
        97,
        108,
        98,
        127
      ]
    },
    {
      "name": "clientFeeConfigUpdated",
      "discriminator": [
        20,
        53,
        4,
        32,
        168,
        116,
        4,
        245
      ]
    },
    {
      "name": "feeCollected",
      "discriminator": [
        12,
        28,
        17,
        248,
        244,
        36,
        8,
        73
      ]
    },
    {
      "name": "feeCollectionStatusChanged",
      "discriminator": [
        143,
        153,
        211,
        195,
        206,
        153,
        172,
        245
      ]
    },
    {
      "name": "feeConfigInitialized",
      "discriminator": [
        99,
        232,
        112,
        161,
        28,
        61,
        171,
        178
      ]
    },
    {
      "name": "feeConfigUpdated",
      "discriminator": [
        45,
        50,
        42,
        173,
        193,
        67,
        52,
        244
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "feeCollectionOffline",
      "msg": "Fee collection is offline - fees cannot be collected"
    },
    {
      "code": 6001,
      "name": "unauthorizedAuthority",
      "msg": "Unauthorized authority - caller does not have permission"
    },
    {
      "code": 6002,
      "name": "feeExceedsMaximum",
      "msg": "Fee amount exceeds maximum allowed - check max_fee configuration"
    },
    {
      "code": 6003,
      "name": "invalidFeeTokenMint",
      "msg": "Invalid fee token mint - does not match configured mint"
    },
    {
      "code": 6004,
      "name": "invalidTokenDecimals",
      "msg": "Invalid token decimals - must be between 0 and 18"
    },
    {
      "code": 6005,
      "name": "feeCalculationOverflow",
      "msg": "Arithmetic overflow in fee calculation"
    },
    {
      "code": 6006,
      "name": "invalidFeeTokenAccount",
      "msg": "Invalid fee token account - account does not match expected token"
    },
    {
      "code": 6007,
      "name": "feeTransferFailed",
      "msg": "Fee transfer failed - check token balances and approvals"
    }
  ],
  "types": [
    {
      "name": "clientFeeConfig",
      "docs": [
        "Per-client fee configuration for custom fee overrides",
        "Seeds: [b\"client_fee_config\", gateway.key().as_ref(), client_program.key().as_ref()]"
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
            "name": "customFee",
            "docs": [
              "Custom fee override (replaces min_fee from FeeConfig if set)",
              "In 6-decimal precision, adjusted for token decimals"
            ],
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "maxFee",
            "docs": [
              "Maximum fee cap for protection (prevents excessive fees)",
              "If set, effective fee = min(calculated_fee, max_fee)"
            ],
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "zeroFee",
            "docs": [
              "Magic flag: if true, no fee is collected (overrides all)"
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
      "name": "clientFeeConfigInitialized",
      "docs": [
        "Event emitted when ClientFeeConfig is initialized"
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
            "name": "customFee",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "maxFee",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "zeroFee",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "clientFeeConfigUpdated",
      "docs": [
        "Event emitted when ClientFeeConfig is updated"
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
            "name": "customFee",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "maxFee",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "zeroFee",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "feeCollected",
      "docs": [
        "Event emitted when a fee is collected"
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
            "name": "sender",
            "type": "pubkey"
          },
          {
            "name": "accountant",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "feeCollectionStatusChanged",
      "docs": [
        "Event emitted when fee collection status changes"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gateway",
            "type": "pubkey"
          },
          {
            "name": "offline",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "feeConfig",
      "docs": [
        "Global fee configuration for a gateway",
        "Seeds: [b\"fee_config\", gateway.key().as_ref()]"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Admin authority that can modify fee settings (typically gateway authority)"
            ],
            "type": "pubkey"
          },
          {
            "name": "gateway",
            "docs": [
              "Gateway this fee config serves"
            ],
            "type": "pubkey"
          },
          {
            "name": "feeTokenMint",
            "docs": [
              "SPL token mint for fee collection (e.g., USDC)"
            ],
            "type": "pubkey"
          },
          {
            "name": "feeTokenDecimals",
            "docs": [
              "Cached decimals for the fee token (for gas-efficient calculations)"
            ],
            "type": "u8"
          },
          {
            "name": "accountant",
            "docs": [
              "Account where collected fees are sent"
            ],
            "type": "pubkey"
          },
          {
            "name": "minFee",
            "docs": [
              "Minimum fee amount in 6-decimal precision",
              "Actual fee = min_fee * 10^(token_decimals - 6)"
            ],
            "type": "u64"
          },
          {
            "name": "takeFeesOffline",
            "docs": [
              "Emergency flag to disable fee collection"
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
      "name": "feeConfigInitialized",
      "docs": [
        "Event emitted when FeeConfig is initialized"
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
            "name": "feeTokenMint",
            "type": "pubkey"
          },
          {
            "name": "accountant",
            "type": "pubkey"
          },
          {
            "name": "minFee",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "feeConfigUpdated",
      "docs": [
        "Event emitted when FeeConfig is updated"
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
            "name": "feeTokenMint",
            "type": "pubkey"
          },
          {
            "name": "accountant",
            "type": "pubkey"
          },
          {
            "name": "minFee",
            "type": "u64"
          },
          {
            "name": "takeFeesOffline",
            "type": "bool"
          }
        ]
      }
    }
  ]
};
