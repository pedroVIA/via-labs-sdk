/**
 * Message Encoding/Decoding Utilities for Via Labs V4 Protocol
 *
 * CRITICAL: This implementation MUST match the Rust encoding in:
 * contracts/solana/programs/message-gateway-v4/src/utils/hash.rs
 *
 * Encoding format (all little-endian):
 * - txId: 16 bytes (u128)
 * - sourceChainId: 8 bytes (u64)
 * - destChainId: 8 bytes (u64)
 * - sender: [u32 length][bytes] (length-prefixed)
 * - recipient: [u32 length][bytes] (length-prefixed)
 * - onChainData: [u32 length][bytes] (length-prefixed)
 * - offChainData: [u32 length][bytes] (length-prefixed)
 */

import BN from 'bn.js';

// Constants from Rust (hash.rs:16-20 and CLAUDE.md)
const MAX_SENDER_SIZE = 64;
const MAX_RECIPIENT_SIZE = 64;
const MAX_ON_CHAIN_DATA = 1024;
const MAX_OFF_CHAIN_DATA = 1024;

export interface DecodedViaMessage {
  txId: BN;
  sourceChainId: BN;
  destChainId: BN;
  sender: Buffer;
  recipient: Buffer;
  onChainData: Buffer;
  offChainData: Buffer;
}

/**
 * Encode a Via message into bytes
 * Validates all inputs to match Rust constraints (hash.rs:16-20)
 *
 * @throws Error if any field exceeds maximum size limits
 */
export function encodeViaMessage(
  txId: BN,
  sourceChainId: BN,
  destChainId: BN,
  sender: Buffer,
  recipient: Buffer,
  onChainData: Buffer,
  offChainData: Buffer
): Buffer {
  // Validate input sizes (matches Rust validation in hash.rs:16-20)
  if (sender.length > MAX_SENDER_SIZE) {
    throw new Error(`Sender too long: ${sender.length} bytes (max ${MAX_SENDER_SIZE})`);
  }
  if (recipient.length > MAX_RECIPIENT_SIZE) {
    throw new Error(`Recipient too long: ${recipient.length} bytes (max ${MAX_RECIPIENT_SIZE})`);
  }
  if (onChainData.length > MAX_ON_CHAIN_DATA) {
    throw new Error(`On-chain data too large: ${onChainData.length} bytes (max ${MAX_ON_CHAIN_DATA})`);
  }
  if (offChainData.length > MAX_OFF_CHAIN_DATA) {
    throw new Error(`Off-chain data too large: ${offChainData.length} bytes (max ${MAX_OFF_CHAIN_DATA})`);
  }

  const encoded: Buffer[] = [];

  // u128 tx_id (16 bytes, little endian) - matches Rust hash.rs:25
  encoded.push(txId.toArrayLike(Buffer, 'le', 16));

  // u64 source_chain_id (8 bytes, little endian) - matches Rust hash.rs:28
  encoded.push(sourceChainId.toArrayLike(Buffer, 'le', 8));

  // u64 dest_chain_id (8 bytes, little endian) - matches Rust hash.rs:31
  encoded.push(destChainId.toArrayLike(Buffer, 'le', 8));

  // Length-prefixed bytes (u32 length + data) - matches Rust encode_length_prefixed (hash.rs:46-49)
  encoded.push(encodeLengthPrefixed(sender));
  encoded.push(encodeLengthPrefixed(recipient));
  encoded.push(encodeLengthPrefixed(onChainData));
  encoded.push(encodeLengthPrefixed(offChainData));

  // Concatenate all encoded data
  return Buffer.concat(encoded);
}

/**
 * Decode a Via message from bytes
 *
 * @throws Error on malformed data (buffer too short, invalid length prefixes, etc.)
 */
export function decodeViaMessage(encoded: Buffer): DecodedViaMessage {
  let offset = 0;

  // Helper to safely read bytes
  const readBytes = (length: number, fieldName: string): Buffer => {
    if (offset + length > encoded.length) {
      throw new Error(
        `Buffer too short: cannot read ${fieldName} (need ${length} bytes at offset ${offset}, have ${encoded.length - offset})`
      );
    }
    const data = encoded.slice(offset, offset + length);
    offset += length;
    return data;
  };

  // Read fixed-size fields (little-endian)
  const txIdBytes = readBytes(16, 'txId');
  const txId = new BN(txIdBytes, 'le');

  const sourceChainIdBytes = readBytes(8, 'sourceChainId');
  const sourceChainId = new BN(sourceChainIdBytes, 'le');

  const destChainIdBytes = readBytes(8, 'destChainId');
  const destChainId = new BN(destChainIdBytes, 'le');

  // Read length-prefixed fields
  const sender = decodeLengthPrefixed(encoded, offset, 'sender');
  offset += 4 + sender.length;

  const recipient = decodeLengthPrefixed(encoded, offset, 'recipient');
  offset += 4 + recipient.length;

  const onChainData = decodeLengthPrefixed(encoded, offset, 'onChainData');
  offset += 4 + onChainData.length;

  const offChainData = decodeLengthPrefixed(encoded, offset, 'offChainData');
  offset += 4 + offChainData.length;

  // Verify we consumed the entire buffer
  if (offset !== encoded.length) {
    throw new Error(
      `Buffer has extra data: decoded ${offset} bytes but buffer is ${encoded.length} bytes`
    );
  }

  return {
    txId,
    sourceChainId,
    destChainId,
    sender,
    recipient,
    onChainData,
    offChainData,
  };
}

/**
 * Validate that a message can be encoded and decoded correctly
 * Returns true if round-trip encoding produces identical values
 *
 * Used for testing and validation before sending messages cross-chain
 */
export function validateMessageEncoding(
  txId: BN,
  sourceChainId: BN,
  destChainId: BN,
  sender: Buffer,
  recipient: Buffer,
  onChainData: Buffer,
  offChainData: Buffer
): boolean {
  try {
    // Encode message
    const encoded = encodeViaMessage(
      txId,
      sourceChainId,
      destChainId,
      sender,
      recipient,
      onChainData,
      offChainData
    );

    // Decode it back
    const decoded = decodeViaMessage(encoded);

    // Verify all fields match exactly
    return (
      decoded.txId.eq(txId) &&
      decoded.sourceChainId.eq(sourceChainId) &&
      decoded.destChainId.eq(destChainId) &&
      decoded.sender.equals(sender) &&
      decoded.recipient.equals(recipient) &&
      decoded.onChainData.equals(onChainData) &&
      decoded.offChainData.equals(offChainData)
    );
  } catch (error) {
    // If encoding/decoding fails, validation fails
    return false;
  }
}

/**
 * Encode data with u32 length prefix (matches Rust encode_length_prefixed in hash.rs:46-49)
 * Format: [u32 length (little-endian)][data bytes]
 */
function encodeLengthPrefixed(data: Buffer): Buffer {
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(data.length);
  return Buffer.concat([lengthBuffer, data]);
}

/**
 * Decode length-prefixed data
 *
 * @throws Error if buffer is too short or length prefix is invalid
 */
function decodeLengthPrefixed(buffer: Buffer, offset: number, fieldName: string): Buffer {
  // Read u32 length (little-endian)
  if (offset + 4 > buffer.length) {
    throw new Error(
      `Buffer too short: cannot read ${fieldName} length prefix at offset ${offset}`
    );
  }
  const length = buffer.readUInt32LE(offset);

  // Read data
  const dataOffset = offset + 4;
  if (dataOffset + length > buffer.length) {
    throw new Error(
      `Buffer too short: cannot read ${fieldName} data (need ${length} bytes at offset ${dataOffset}, have ${buffer.length - dataOffset})`
    );
  }

  return buffer.slice(dataOffset, dataOffset + length);
}
