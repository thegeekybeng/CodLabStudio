const http = require('http');

async function main() {
  try {
    console.log('--- STARTING PROACTIVE PACKAGE INSTALLATION ---');

    // 1. Authenticate to get token
    const token = await authenticate();
    const userId = parseJwt(token).userId;
    console.log(`Authenticated as user: ${userId}`);

    // 2. Install packages
    console.log('\n[1/1] Installing User Requirements (yfinance, rich)...');
    
    // Use extended timeout for installation
    const installRes = await makeRequest('/packages/install', 'POST', {
      language: 'python',
      packages: ['yfinance', 'rich'],
      userId: userId
    }, token);

    if (!installRes.success) {
      throw new Error(`Package installation failed: ${installRes.output}`);
    }
    console.log('✅ Packages Installed successfully');
    console.log('Output:', installRes.output);

    console.log('\n--- INSTALLATION COMPLETE ---');
    process.exit(0);

  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

// --- Helpers ---

function parseJwt (token) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

function authenticate() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: 'admin@codlabstudio.local',
      password: 'Admin@CodLabStudio2024!'
    });

    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const auth = JSON.parse(body);
          const token = auth.data?.tokens?.accessToken;
          if (!token) {
             reject(new Error(`No token in response: ${body}`));
             return;
          }
          resolve(token);
        } else {
          reject(new Error(`Auth failed: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function makeRequest(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          // Check for JSON response
          const json = responseBody ? JSON.parse(responseBody) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            console.log('Request failed with data:', responseBody);
            resolve({ success: false, output: JSON.stringify(json) || responseBody });
          }
        } catch (e) {
            console.log('Failed to parse response:', responseBody);
            resolve({ success: false, output: responseBody });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

main();
