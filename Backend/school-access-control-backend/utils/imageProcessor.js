const sharp = require('sharp');
const heicConvert = require('heic-convert');

async function processImage(base64Image) {
  try {
    // Remove data:image/xyz;base64, prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    let processedImageBuffer;

    // Check if the image is HEIC
    if (base64Image.startsWith('data:image/heic;base64,')) {
      const heicBuffer = await heicConvert({
      buffer: imageBuffer,
      format: 'JPEG', // or 'PNG'
      quality: 1 // between 0 and 1
      });
      processedImageBuffer = heicBuffer;
    } else {
      processedImageBuffer = imageBuffer;
    }

    // Process image with sharp
    processedImageBuffer = await sharp(processedImageBuffer)
      .resize(1024, 1024, {
      fit: 'cover',
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