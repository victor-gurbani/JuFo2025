const sharp = require('sharp');
const heicConvert = require('heic-convert');
// TODO fix garbage collection issue
async function processImage(base64Image) {
  try {
    // Remove data:image/xyz;base64, prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    let processedImageBuffer;

    // Check if the image is HEIC
    if (base64Image.startsWith('data:image/heic;base64,')) {
      try {
        const heicBuffer = await heicConvert({
          buffer: imageBuffer,
          format: 'PNG', // Convert HEIC to PNG
          quality: 1
        });
        processedImageBuffer = Buffer.from(heicBuffer.data); // Extract data as Buffer
      } catch (heicError) {
        console.error('HEIC conversion error:', heicError);
        throw new Error('Failed to convert HEIC image');
      }
    } else {
      processedImageBuffer = imageBuffer;
    }

    // Process image with sharp
    try {
      processedImageBuffer = await sharp(processedImageBuffer)
        .resize(1024, 1024, {
          fit: 'cover',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toBuffer();
    } catch (sharpError) {
      console.error('Sharp processing error:', sharpError);
      throw new Error('Failed to process image with Sharp');
    }

    // Add explicit cleanup
    // if (processedImageBuffer !== imageBuffer) {
    //   imageBuffer = null; // Help garbage collection
    // }
    
    const result = `data:image/png;base64,${processedImageBuffer.toString('base64')}`;
    // processedImageBuffer = null; // Help garbage collection
    
    return result;
  } catch (error) {
    console.error('Image processing error:', error);
    // Clean up on error too
    // imageBuffer = null;
    // processedImageBuffer = null;
    throw new Error('Failed to process image');
  }
}

module.exports = { processImage };