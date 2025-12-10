const http = require('http');
const jwt = require('jsonwebtoken');

// 1. Generate Token
const secret = process.env.JWT_SECRET || 'development_jwt_secret_key_12345';
// Use the REAL admin ID retrieved from DB
const token = jwt.sign({ userId: 'e11f0d87-d363-4035-8539-c7164fc63727', role: 'ADMIN' }, secret, { expiresIn: '1h' });

const makeRequest = (path, method, body) => {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
      email: 'admin@codlabstudio.local',
      password: 'Admin@CodLabStudio2024!'
    });
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                     const parsed = JSON.parse(data);
                     if (res.statusCode >= 200 && res.statusCode < 300) {
                         resolve(parsed);
                     } else {
                         reject({ status: res.statusCode, body: parsed });
                     }
                } catch (e) {
                    reject({ status: res.statusCode, raw: data });
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

// Helper to poll for execution result
const waitForExecution = async (executionId) => {
    let retries = 20; // 20 * 500ms = 10 seconds
    while (retries > 0) {
        const res = await makeRequest(`/executions/${executionId}`, 'GET');
        if (res.data.status === 'COMPLETED' || res.data.status === 'FAILED') {
            return res.data;
        }
        await new Promise(r => setTimeout(r, 500));
        retries--;
    }
    throw new Error('Execution timed out');
};

async function verify() {
    console.log('--- STARTING SYSTEM VERIFICATION ---');

    // TEST 1: Basic Execution
    try {
        console.log('\n[1/4] Testing Basic Execution...');
        const res = await makeRequest('/executions/execute', 'POST', {
            language: 'python',
            code: "print('System Verification: OK')"
        });
        
        const executionId = res.data.executionId;
        console.log(`Submitted execution: ${executionId}, waiting...`);
        
        const result = await waitForExecution(executionId);
        
        if (result.status === 'COMPLETED' && result.stdout.trim() === 'System Verification: OK') {
            console.log('✅ Basic Execution Verified');
        } else {
             throw new Error(`Execution failed or output mismatch. Status: ${result.status}, Stdout: ${result.stdout}, Stderr: ${result.stderr}`);
        }
    } catch (e) {
        console.error('❌ Basic Execution Failed:', e);
        process.exit(1);
    }

    // TEST 2: Package Installation
    try {
        console.log('\n[2/4] Testing Package Installation (numpy)...');
        const res = await makeRequest('/packages/install', 'POST', {
            language: 'python',
            packages: ['numpy']
        });
        if (res.success) {
            console.log('✅ Package Installation Verified');
        } else {
            throw new Error(`API returned success: false. Error: ${JSON.stringify(res.error)}`);
        }
    } catch (e) {
         console.error('❌ Package Installation Failed:', e);
         process.exit(1);
    }

    // TEST 3: Library Usage
    try {
        console.log('\n[3/4] Testing Library Usage...');
        const res = await makeRequest('/executions/execute', 'POST', {
            language: 'python',
            code: "import numpy; print('Numpy Installed')"
        });
        
        const executionId = res.data.executionId;
        const result = await waitForExecution(executionId);

        if (result.status === 'COMPLETED' && result.stdout.trim() === 'Numpy Installed') {
            console.log('✅ Library Usage Verified');
        } else {
             throw new Error(`Library import failed. Stderr: ${result.stderr}`);
        }
    } catch (e) {
        console.error('❌ Library Usage Failed:', e);
        // Don't exit yet, check debug
    }

    // TEST 4: Debug Session Creation
    try {
        console.log('\n[4/4] Testing Debug Session Creation...');
        const res = await makeRequest('/debug/start', 'POST', {
            language: 'python',
            code: "print('Debug Start')"
        });
        if (res.success && res.data.sessionId) {
            console.log('✅ Debug Session Verified');
        } else {
             throw new Error('Failed to create debug session');
        }
    } catch (e) {
        console.error('❌ Debug Session Creation Failed:', e);
    }

    console.log('\n--- VERIFICATION COMPLETE ---');
}

verify();
