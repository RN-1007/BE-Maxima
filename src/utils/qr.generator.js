const QRCode = require('qrcode');

/**
 * Generate QR Code as Buffer (PNG)
 * @param {string} text URL or payload to encode
 * @returns {Promise<Buffer>}
 */
const generateQRCodeBuffer = async (text) => {
  return await QRCode.toBuffer(text, {
    type: 'png',
    width: 250,
    margin: 2,
    color: {
      dark: '#1b4332',
      light: '#ffffff',
    },
  });
};

/**
 * Generate QR Code as Data URL (base64)
 * @param {string} text
 * @returns {Promise<string>}
 */
const generateQRCodeDataURL = async (text) => {
  return await QRCode.toDataURL(text, {
    width: 250,
    margin: 2,
  });
};

module.exports = {
  generateQRCodeBuffer,
  generateQRCodeDataURL,
};
