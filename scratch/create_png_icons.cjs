const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create a simple valid RGBA PNG generator
function createSolidPng(width, height, r, g, b, a = 255) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // color type (RGBA)
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image data with flame shape
  const rowLength = width * 4 + 1; // 1 filter byte + RGBA pixels
  const rawData = Buffer.alloc(rowLength * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.38;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // filter byte: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Dark background rounded box
      const isCorner = Math.abs(dx) > width * 0.44 && Math.abs(dy) > height * 0.44;
      if (dist < radius) {
        // Ember flame gradient
        const factor = y / height;
        rawData[pxOffset] = Math.min(255, Math.round(245 - factor * 60)); // R
        rawData[pxOffset + 1] = Math.min(255, Math.round(158 - factor * 80)); // G
        rawData[pxOffset + 2] = Math.min(255, Math.round(18 + factor * 20)); // B
        rawData[pxOffset + 3] = 255;
      } else if (!isCorner) {
        // Dark background #141411
        rawData[pxOffset] = 20;
        rawData[pxOffset + 1] = 20;
        rawData[pxOffset + 2] = 17;
        rawData[pxOffset + 3] = 255;
      } else {
        rawData[pxOffset] = 245;
        rawData[pxOffset + 1] = 239;
        rawData[pxOffset + 2] = 230;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  // IDAT chunk
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuffer, data]);

  const crc = crc32(body);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, body, crcBuffer]);
}

// Standard CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const iconsDir = path.join(__dirname, '../frontend/public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createSolidPng(192, 192, 200, 109, 52));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createSolidPng(512, 512, 200, 109, 52));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512.png'), createSolidPng(512, 512, 200, 109, 52));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), createSolidPng(180, 180, 200, 109, 52));

console.log('Successfully generated PWA PNG icons in frontend/public/icons/');
