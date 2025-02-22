const sharp = require('sharp');

async function processImage(base64Image) {
  try {
    // Remove data:image/xyz;base64, prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Process image with sharp
    const processedImageBuffer = await sharp(imageBuffer)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toBuffer();

    // Convert back to base64
    return `data:image/png;base64,${processedImageBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image');
  }
}

module.exports = { processImage };