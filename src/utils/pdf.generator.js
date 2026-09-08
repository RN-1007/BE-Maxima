const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { generateQRCodeBuffer } = require('./qr.generator');

/**
 * Generate PDF sticker sheet for a harvest batch (FR-4)
 * @param {Object} batchInfo
 * @param {string} batchInfo.batchId
 * @param {string} batchInfo.treeCode
 * @param {string} batchInfo.harvestDate
 * @param {string} batchInfo.farmerName
 * @param {string} batchInfo.location
 * @param {number} [batchInfo.stickerCount=6]
 * @param {string} batchInfo.traceUrl
 * @param {string} outputDir
 * @returns {Promise<string>} relative file path to generated PDF
 */
const generateBatchQRPDF = async (batchInfo, outputDir = 'uploads/pdf') => {
  const fullOutputDir = path.resolve(process.cwd(), outputDir);
  if (!fs.existsSync(fullOutputDir)) {
    fs.mkdirSync(fullOutputDir, { recursive: true });
  }

  const fileName = `batch-${batchInfo.batchId}-${Date.now()}.pdf`;
  const filePath = path.join(fullOutputDir, fileName);

  const qrBuffer = await generateQRCodeBuffer(batchInfo.traceUrl);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 36,
    });

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Header
    doc
      .fontSize(18)
      .fillColor('#1b4332')
      .text('LEMBAR STIKER TRACEABILITY PRODUK (MAXIMA)', { align: 'center' });
    doc
      .fontSize(10)
      .fillColor('#555555')
      .text(`Batch ID: ${batchInfo.batchId} | Pohon: ${batchInfo.treeCode} | Tgl Panen: ${batchInfo.harvestDate}`, {
        align: 'center',
      });
    doc.moveDown(1.5);

    // Grid layout for stickers (2 columns x 3 rows = 6 stickers per page)
    const startX = 40;
    const startY = 90;
    const cardWidth = 245;
    const cardHeight = 210;
    const gapX = 20;
    const gapY = 20;
    const stickerCount = batchInfo.stickerCount || 6;

    for (let i = 0; i < stickerCount; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + col * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);

      // Card border
      doc
        .roundedRect(x, y, cardWidth, cardHeight, 8)
        .lineWidth(1)
        .strokeColor('#2d6a4f')
        .stroke();

      // Card Header
      doc
        .rect(x, y, cardWidth, 24)
        .fillColor('#2d6a4f')
        .fill();

      doc
        .fontSize(9)
        .fillColor('#ffffff')
        .text('MAXIMA SMART TRACEABILITY', x, y + 7, {
          width: cardWidth,
          align: 'center',
        });

      // QR Code in the middle
      const qrSize = 105;
      const qrX = x + (cardWidth - qrSize) / 2;
      const qrY = y + 32;
      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

      // Information under QR
      doc
        .fontSize(8)
        .fillColor('#111111')
        .text(`Batch: ${batchInfo.batchId}`, x + 8, y + 144, { width: cardWidth - 16, align: 'center' })
        .text(`Pohon: ${batchInfo.treeCode} | Petani: ${batchInfo.farmerName}`, x + 8, y + 156, {
          width: cardWidth - 16,
          align: 'center',
        })
        .text(`Lokasi: ${batchInfo.location || '-'}`, x + 8, y + 168, { width: cardWidth - 16, align: 'center' })
        .fontSize(7)
        .fillColor('#52b788')
        .text('Scan untuk riwayat mutu & kesehatan AI', x + 8, y + 184, {
          width: cardWidth - 16,
          align: 'center',
        });
    }

    // Footer
    doc
      .fontSize(8)
      .fillColor('#888888')
      .text('Dokumen ini di-generate otomatis oleh Sistem Backend Maxima (SRS FR-4).', 40, 780, {
        align: 'center',
        width: 515,
      });

    doc.end();

    writeStream.on('finish', () => {
      resolve(`uploads/pdf/${fileName}`);
    });

    writeStream.on('error', (err) => {
      reject(err);
    });
  });
};

module.exports = {
  generateBatchQRPDF,
};
