const sharp = require('sharp');
const { promisify } = require('util');
const fs = require('fs');

const heicConvert = require('heic-convert');

async function processImage(base64Image) {
  // For memory tracking - uncomment when debugging
  // const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  // console.log(`Memory usage at start: ${startMemory.toFixed(2)} MB`);
  
  let imageBuffer = null;
  let processedImageBuffer = null;
  let heicBuffer = null;
  
  try {
    // Remove data:image/xyz;base64, prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Check if the image is HEIC or HEIF
    const isHeicFormat = base64Image.startsWith('data:image/heic;base64,');
    const isHeifFormat = base64Image.startsWith('data:image/heif;base64,');
    
    if (isHeicFormat || isHeifFormat) {
      try {
        heicBuffer = await heicConvert({
          buffer: imageBuffer,
          format: 'PNG',
          quality: 1
        });
        
        // Add validation to prevent errors
        if (!heicBuffer) {
          throw new Error('HEIC conversion returned empty buffer');
        }
        
        // Check if heicBuffer is already a Buffer or has a data property
        if (Buffer.isBuffer(heicBuffer)) {
          processedImageBuffer = Buffer.from(heicBuffer);
        } else if (heicBuffer.data && Buffer.isBuffer(heicBuffer.data)) {
          processedImageBuffer = Buffer.from(heicBuffer.data);
        } else {
          throw new Error('Unexpected HEIC conversion result format');
        }
        
        heicBuffer = null; // Help garbage collection
      } catch (conversionError) {
        console.error('HEIC/HEIF conversion error:', conversionError);
        throw new Error(`Failed to convert ${isHeicFormat ? 'HEIC' : 'HEIF'} image: ${conversionError.message}`);
      }
    } else {
      // For non-HEIC/HEIF formats, we still need to clone the buffer to avoid issues
      processedImageBuffer = Buffer.from(imageBuffer);
    }
    
    // Free the original image buffer as soon as possible
    imageBuffer = null;

    // Process image with sharp
    try {
      const sharpOutput = await sharp(processedImageBuffer)
        .resize(1024, 1024, {
          fit: 'cover',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toBuffer();
      
      // Replace buffer with processed version and clear the old one
      processedImageBuffer = sharpOutput;
    } catch (sharpError) {
      console.error('Sharp processing error:', sharpError);
      throw new Error('Failed to process image with Sharp');
    }
    
    // Create the result string
    const result = `data:image/png;base64,${processedImageBuffer.toString('base64')}`;
    
    // Clear the processed buffer as we've extracted what we needed
    processedImageBuffer = null;
    
    // For memory tracking - uncomment when debugging
    // const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    // console.log(`Memory usage at end: ${endMemory.toFixed(2)} MB`);
    // console.log(`Memory change: ${(endMemory - startMemory).toFixed(2)} MB`);
    
    // Force garbage collection if available (requires --expose-gc flag)
    if (global.gc) {
      global.gc();
    }
    
    return result;
  } catch (error) {
    console.error('Image processing error:', error);
    
    // Clean up all buffers on error
    imageBuffer = null;
    processedImageBuffer = null;
    heicBuffer = null;
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    throw new Error('Failed to process image');
  }
}

module.exports = { processImage };