/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CRC16-CCITT checksum calculation for EMVCo standard (PromptPay)
 */
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i);
    crc ^= charCode << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Generates the EMVCo string payload for PromptPay QR code
 * @param target The PromptPay ID (Phone number like 0812345678 or Tax ID like 0123456789012)
 * @param amount Optional payment amount (positive number)
 */
export function generatePromptPayPayload(target: string, amount?: number): string {
  // Sanitize input
  const sanitized = target.replace(/[^0-9]/g, '');
  
  let targetField = '';
  if (sanitized.length === 13) {
    // Tax ID / National ID
    targetField = `0213${sanitized}`;
  } else if (sanitized.length === 10) {
    // Mobile Phone Number (Must convert leading 0 to 66 and pad to 13 digits)
    const mobile = sanitized.substring(1);
    const formattedMobile = `000066${mobile}`.slice(-13);
    targetField = `0113${formattedMobile}`;
  } else {
    // Return empty if invalid length
    return '';
  }

  // Merchant Account Info (Tag 29)
  // Subtag 00: AID (A000000677010111) -> length 16
  // Subtag 01 or 02: Target number formatted -> length 17
  const promptPayAid = '0016A000000677010111';
  const merchantInfoPayload = `${promptPayAid}${targetField}`;
  const merchantInfo = `29${merchantInfoPayload.length.toString().padStart(2, '0')}${merchantInfoPayload}`;

  // Basic EMVCo tags
  let payload = '000201'; // Payload Format Indicator (Tag 00)
  payload += amount && amount > 0 ? '010212' : '010211'; // Point of Initiation Method (Tag 01)
  payload += merchantInfo; // Tag 29
  payload += '5303764'; // Transaction Currency THB (Tag 53)

  // Transaction Amount (Tag 54)
  if (amount && amount > 0) {
    const formattedAmount = amount.toFixed(2);
    payload += `54${formattedAmount.length.toString().padStart(2, '0')}${formattedAmount}`;
  }

  payload += '5802TH'; // Country Code TH (Tag 58)
  payload += '6304'; // CRC Checksum tag header (Tag 63)

  // Calculate CRC16 and append to payload
  const checksum = crc16(payload);
  return payload + checksum;
}
