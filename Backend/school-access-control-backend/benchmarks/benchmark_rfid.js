const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const http = require('http');
const os = require('os');

const RESULTS_PATH = path.join(__dirname, 'results');
const API_URL = process.env.API_URL || 'http://localhost:' + (process.env.PORT || '3000');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_PATH)) {
  fs.mkdirSync(RESULTS_PATH, { recursive: true });
}

// Helper function to make HTTP requests
function makeRequest(method, endpoint, data, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
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
  console.log('--------------------------\n');
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

async function login() {
  console.log('Authenticating...');
  const res = await makeRequest('POST', '/auth/login', {
    id: 'admin',
    password: 'prototype_secret'
  });
  
  if (res.status !== 200 || !res.data.token) {
    throw new Error(`Login failed: ${JSON.stringify(res.data)}`);
  }
  
  console.log('Authentication successful');
  return res.data.token;
}

async function runBenchmark(token) {
  const platformName = getPlatformName();
  const numRequests = 50;
  const results = [];
  const responseTimes = [];

  printSystemInfo();
  
  console.log(`Running benchmark on ${os.hostname()} (Platform: ${platformName}) with ${numRequests} requests...`);
  
  // We'll use a mix of valid and invalid card UIDs
  const testCards = [
    'VALID_CARD_1', 'VALID_CARD_2', 'INVALID_CARD_1', 'INVALID_CARD_2', 'UNKNOWN_CARD'
  ];

  console.log('\nRunning warmup phase (5 requests)...');
  for (let i = 0; i < 5; i++) {
    const cardUID = testCards[i % testCards.length];
    try {
      await makeRequest('POST', '/guard/validate', { cardUID }, token);
    } catch {
    }
  }
  console.log('Warmup complete.\n');
  
  for (let i = 0; i < numRequests; i++) {
    const cardUID = testCards[i % testCards.length];
    
    try {
      const start = performance.now();
      const res = await makeRequest('POST', '/guard/validate', { cardUID }, token);
      
      const end = performance.now();
      const responseTimeMs = end - start;

      responseTimes.push(responseTimeMs);
      
      results.push({
        request_id: i + 1,
        card_uid: cardUID,
        response_time_ms: responseTimeMs.toFixed(2),
        status: res.status,
        access_granted: res.data.valid === true
      });
      
      
      if ((i + 1) % 10 === 0) {
        console.log(`Completed ${i + 1}/${numRequests} requests`);
      }
    } catch (err) {
      console.error(`Request ${i + 1} failed:`, err.message);
    }
  }

  const stats = calculateStats(responseTimes);
  if (stats) {
    console.log('\n--- Benchmark Summary ---');
    console.log(`Average Time: ${stats.avg.toFixed(2)} ms`);
    console.log(`Min Time:     ${stats.min.toFixed(2)} ms`);
    console.log(`Max Time:     ${stats.max.toFixed(2)} ms`);
    console.log(`Std Dev:      ${stats.stddev.toFixed(2)} ms`);
    console.log(`95th Pct:     ${stats.p95.toFixed(2)} ms`);
    console.log(`99th Pct:     ${stats.p99.toFixed(2)} ms`);
    console.log('-------------------------\n');
  }
  
  // Write to CSV
  const csvHeader = 'request_id,card_uid,response_time_ms,status,access_granted\n';
  const csvRows = results.map(r => 
    `${r.request_id},${r.card_uid},${r.response_time_ms},${r.status},${r.access_granted}`
  ).join('\n');
  
  const filename = `${platformName}_rfid.csv`;
  fs.writeFileSync(path.join(RESULTS_PATH, filename), csvHeader + csvRows);
  console.log(`Results saved to ${filename}`);
}

async function main() {
  try {
    const token = await login();
    await runBenchmark(token);
    
  } catch (err) {
    console.error('Benchmark failed:', err);
    console.log(`Make sure the backend server is running on ${API_URL}`);
  }
}

main();
