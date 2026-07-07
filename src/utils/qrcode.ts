/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import QRCode from 'qrcode';

/**
 * Generates an offline QR Code as a Data URL (base64 image)
 * @param text The string to encode in the QR code
 * @param width Optional width in pixels (default 250)
 */
export async function generateQrDataUrl(text: string, width = 250): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Error generating QR code data URL:', err);
    return '';
  }
}

/**
 * Generates an offline QR Code as an SVG string
 * @param text The string to encode in the QR code
 */
export async function generateQrSvgString(text: string): Promise<string> {
  try {
    const svgStr = await QRCode.toString(text, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return svgStr;
  } catch (err) {
    console.error('Error generating QR code SVG:', err);
    return '';
  }
}
