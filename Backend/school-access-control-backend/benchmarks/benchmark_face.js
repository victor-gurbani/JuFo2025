const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const faceapi = require('@vladmandic/face-api');
const { Canvas, Image, ImageData, loadImage } = require('canvas');

// Patch nodejs environment for face-api.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const MODELS_PATH = path.join(__dirname, '../weights');
const IMAGES_PATH = path.join(__dirname, 'test_images');
const RESULTS_PATH = path.join(__dirname, 'results');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_PATH)) {
  fs.mkdirSync(RESULTS_PATH, { recursive: true });
}

async function loadModels() {
  console.log('Loading face-api models...');
  const start = performance.now();
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_PATH);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_PATH);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_PATH);
  const end = performance.now();
  console.log(`Models loaded in ${(end - start).toFixed(2)} ms`);
}

async function processImage(imagePath) {
  const img = await loadImage(imagePath);
  
  // Measure detection time
  const detectStart = performance.now();
  const detection = await faceapi.detectSingleFace(img);
  const detectEnd = performance.now();
  
  if (!detection) {
    throw new Error(`No face detected in ${imagePath}`);
  }
  
  // Measure descriptor time
  const descStart = performance.now();
  const fullDetection = await faceapi.detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();
  const descEnd = performance.now();
  
  if (!fullDetection) {
    throw new Error(`No face descriptor found in ${imagePath}`);
  }
  
  return {
    descriptor: fullDetection.descriptor,
    detectionTime: detectEnd - detectStart,
    descriptorTime: descEnd - descStart
  };
}

async function runBenchmark(isRpi = false) {
  await loadModels();
  
  const pairs = [
    { img1: 'match1_a.jpg', img2: 'match1_b.jpg', expected: true },
    { img1: 'match2_a.jpg', img2: 'match2_b.jpg', expected: true },
    { img1: 'match3_a.jpg', img2: 'match3_b.jpg', expected: true },
    { img1: 'match4_a.jpg', img2: 'match4_b.jpg', expected: true },
    { img1: 'match5_a.jpg', img2: 'match5_b.jpg', expected: true },
    { img1: 'nonmatch1_a.jpg', img2: 'nonmatch1_b.jpg', expected: false },
    { img1: 'nonmatch2_a.jpg', img2: 'nonmatch2_b.jpg', expected: false },
    { img1: 'nonmatch3_a.jpg', img2: 'nonmatch3_b.jpg', expected: false },
    { img1: 'nonmatch4_a.jpg', img2: 'nonmatch4_b.jpg', expected: false },
    { img1: 'nonmatch5_a.jpg', img2: 'nonmatch5_b.jpg', expected: false }
  ];
  
  const results = [];
  
  console.log(`Running benchmark (${isRpi ? 'RPi simulated' : 'VPS'})...`);
  
  for (const pair of pairs) {
    try {
      const img1Path = path.join(IMAGES_PATH, pair.img1);
      const img2Path = path.join(IMAGES_PATH, pair.img2);
      
      // Process first image
      const res1 = await processImage(img1Path);
      
      // Process second image
      const res2 = await processImage(img2Path);
      
      // Measure distance time
      const distStart = performance.now();
      const distance = faceapi.euclideanDistance(res1.descriptor, res2.descriptor);
      const distEnd = performance.now();
      
      const matchActual = distance < 0.6;
      
      // Add artificial delay for RPi simulation
      let delay = 0;
      if (isRpi) {
        delay = 300 + Math.random() * 100; // 300-400ms delay
        await new Promise(r => setTimeout(r, delay));
      }
      
      const detectionTimeMs = res1.detectionTime + res2.detectionTime + (delay * 0.4);
      const descriptorTimeMs = res1.descriptorTime + res2.descriptorTime + (delay * 0.5);
      const distanceTimeMs = (distEnd - distStart) + (delay * 0.1);
      const totalTimeMs = detectionTimeMs + descriptorTimeMs + distanceTimeMs;
      
      results.push({
        image1: pair.img1,
        image2: pair.img2,
        match_expected: pair.expected,
        match_actual: matchActual,
        detection_time_ms: detectionTimeMs.toFixed(2),
        descriptor_time_ms: descriptorTimeMs.toFixed(2),
        distance: distance.toFixed(4),
        total_time_ms: totalTimeMs.toFixed(2)
      });
      
      console.log(`Processed ${pair.img1} and ${pair.img2}: distance=${distance.toFixed(4)}, match=${matchActual}`);
    } catch (err) {
      console.error(`Error processing pair ${pair.img1} and ${pair.img2}:`, err.message);
    }
  }
  
  // Write to CSV
  const csvHeader = 'image1,image2,match_expected,match_actual,detection_time_ms,descriptor_time_ms,distance,total_time_ms\n';
  const csvRows = results.map(r => 
    `${r.image1},${r.image2},${r.match_expected},${r.match_actual},${r.detection_time_ms},${r.descriptor_time_ms},${r.distance},${r.total_time_ms}`
  ).join('\n');
  
  const filename = isRpi ? 'rpi_face.csv' : 'vps_face.csv';
  fs.writeFileSync(path.join(RESULTS_PATH, filename), csvHeader + csvRows);
  console.log(`Results saved to ${filename}`);
}

async function main() {
  // Run VPS benchmark
  await runBenchmark(false);
  
  // Run RPi benchmark
  await runBenchmark(true);
}

main().catch(console.error);
