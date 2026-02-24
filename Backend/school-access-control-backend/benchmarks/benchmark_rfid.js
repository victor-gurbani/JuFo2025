const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const http = require('http');

const RESULTS_PATH = path.join(__dirname, 'results');
const API_URL = 'http://localhost:3000';

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
      res.on('data', (chunk) => body += chunk);
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

async function runBenchmark(token, isRpi = false) {
  const numRequests = 50;
  const results = [];
  
  console.log(`Running RFID benchmark (${isRpi ? 'RPi simulated' : 'VPS'}) with ${numRequests} requests...`);
  
  // We'll use a mix of valid and invalid card UIDs
  const testCards = [
    'VALID_CARD_1', 'VALID_CARD_2', 'INVALID_CARD_1', 'INVALID_CARD_2', 'UNKNOWN_CARD'
  ];
  
  for (let i = 0; i < numRequests; i++) {
    const cardUID = testCards[i % testCards.length];
    
    try {
      const start = performance.now();
      
      // Add artificial delay for RPi simulation (network + processing overhead)
      let delay = 0;
      if (isRpi) {
        delay = 50 + Math.random() * 50; // 50-100ms delay
        await new Promise(r => setTimeout(r, delay));
      }
      
      const res = await makeRequest('POST', '/guard/validate', { cardUID }, token);
      
      const end = performance.now();
      const responseTimeMs = (end - start) + delay;
      
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
      
      // Small delay between requests to avoid overwhelming the server
      await new Promise(r => setTimeout(r, 10));
    } catch (err) {
      console.error(`Request ${i + 1} failed:`, err.message);
    }
  }
  
  // Write to CSV
  const csvHeader = 'request_id,card_uid,response_time_ms,status,access_granted\n';
  const csvRows = results.map(r => 
    `${r.request_id},${r.card_uid},${r.response_time_ms},${r.status},${r.access_granted}`
  ).join('\n');
  
  const filename = isRpi ? 'rpi_rfid.csv' : 'vps_rfid.csv';
  fs.writeFileSync(path.join(RESULTS_PATH, filename), csvHeader + csvRows);
  console.log(`Results saved to ${filename}`);
}

async function main() {
  try {
    const token = await login();
    
    // Run VPS benchmark
    await runBenchmark(token, false);
    
    // Run RPi benchmark
    await runBenchmark(token, true);
    
  } catch (err) {
    console.error('Benchmark failed:', err);
    console.log('Make sure the backend server is running on http://localhost:3000');
  }
}

main();
