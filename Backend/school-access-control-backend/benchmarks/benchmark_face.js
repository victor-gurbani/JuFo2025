const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const os = require('os');
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

function getPlatformName() {
  const args = process.argv.slice(2);
  const platformIndex = args.indexOf('--platform');
  if (platformIndex !== -1 && args[platformIndex + 1]) {
    return args[platformIndex + 1].toLowerCase();
  }

  if (args.length > 0 && !args[0].startsWith('--')) {
    return args[0].toLowerCase();
  }

  const hostname = os.hostname().toLowerCase();
  const arch = os.arch().toLowerCase();
  const totalMemGb = os.totalmem() / (1024 * 1024 * 1024);

  if (hostname.includes('raspberry') || hostname.includes('pi')) {
    return 'rpi';
  }

  if ((arch === 'aarch64' || arch === 'arm64' || arch.startsWith('arm')) && totalMemGb <= 5) {
    return 'rpi';
  }

  return hostname;
}

function printSystemInfo() {
  console.log('--- System Information ---');
  console.log(`Hostname: ${os.hostname()}`);
  console.log(`Architecture: ${os.arch()}`);
  console.log(`Total Memory: ${(os.totalmem() / (1024 * 1024 * 1024)).toFixed(2)} GB`);
  console.log(`Node Version: ${process.version}`);
  console.log(`CPUs: ${os.cpus().length}x ${os.cpus()[0].model}`);
  console.log('--------------------------\\n');
}

function calculateStats(times) {
  if (times.length === 0) return null;
  const sum = times.reduce((a, b) => a + b, 0);
  const avg = sum / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  const squareDiffs = times.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / times.length;
  const stddev = Math.sqrt(avgSquareDiff);
  
  const sorted = [...times].sort((a, b) => a - b);
  const p95 = sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)];
  const p99 = sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.99) - 1)];
  
  return { avg, min, max, stddev, p95, p99 };
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

async function runBenchmark() {
  const platformName = getPlatformName();
  printSystemInfo();
  
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
  
  // Warmup phase
  console.log('\\nRunning warmup phase (5 requests)...');
  for (let i = 0; i < 5; i++) {
    try {
      const pair = pairs[i % pairs.length];
      const img1Path = path.join(IMAGES_PATH, pair.img1);
      const img2Path = path.join(IMAGES_PATH, pair.img2);
      const res1 = await processImage(img1Path);
      const res2 = await processImage(img2Path);
      faceapi.euclideanDistance(res1.descriptor, res2.descriptor);
    } catch (err) {
      // Ignore warmup errors
    }
  }
  console.log('Warmup complete.\\n');
  
  const results = [];
  const totalTimes = [];
  
  console.log(`Running benchmark on ${os.hostname()} (Platform: ${platformName})...`);
  
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
      
      const detectionTimeMs = res1.detectionTime + res2.detectionTime;
      const descriptorTimeMs = res1.descriptorTime + res2.descriptorTime;
      const distanceTimeMs = distEnd - distStart;
      const totalTimeMs = detectionTimeMs + descriptorTimeMs + distanceTimeMs;
      
      totalTimes.push(totalTimeMs);
      
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
      
      console.log(`Processed ${pair.img1} and ${pair.img2}: distance=${distance.toFixed(4)}, match=${matchActual}, time=${totalTimeMs.toFixed(2)}ms`);
    } catch (err) {
      console.error(`Error processing pair ${pair.img1} and ${pair.img2}:`, err.message);
    }
  }
  
  // Print summary statistics
  const stats = calculateStats(totalTimes);
  if (stats) {
    console.log('\\n--- Benchmark Summary ---');
    console.log(`Average Time: ${stats.avg.toFixed(2)} ms`);
    console.log(`Min Time:     ${stats.min.toFixed(2)} ms`);
    console.log(`Max Time:     ${stats.max.toFixed(2)} ms`);
    console.log(`Std Dev:      ${stats.stddev.toFixed(2)} ms`);
    console.log(`95th Pct:     ${stats.p95.toFixed(2)} ms`);
    console.log(`99th Pct:     ${stats.p99.toFixed(2)} ms`);
    console.log('-------------------------\\n');
  }
  
  // Write to CSV
  const csvHeader = 'image1,image2,match_expected,match_actual,detection_time_ms,descriptor_time_ms,distance,total_time_ms\\n';
  const csvRows = results.map(r => 
    `${r.image1},${r.image2},${r.match_expected},${r.match_actual},${r.detection_time_ms},${r.descriptor_time_ms},${r.distance},${r.total_time_ms}`
  ).join('\\n');
  
  const filename = `${platformName}_face.csv`;
  fs.writeFileSync(path.join(RESULTS_PATH, filename), csvHeader + csvRows);
  console.log(`Results saved to ${filename}`);
}

async function main() {
  await runBenchmark();
}

main().catch(console.error);
