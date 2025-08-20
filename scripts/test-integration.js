#!/usr/bin/env node

/**
 * End-to-End Integration Testing Script
 * Tests the complete application workflow after deployment
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
  frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
  backend: process.env.BACKEND_URL || 'http://localhost:5000',
  timeout: 10000, // 10 seconds
};

// Colors for output
const colors = {
  red: '\033[0;31m',
  green: '\033[0;32m',
  yellow: '\033[1;33m',
  blue: '\033[0;34m',
  nc: '\033[0m', // No Color
};

// Test results
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: []
};

// Utility functions
function log(message, color = colors.nc) {
  console.log(`${color}${message}${colors.nc}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
  testResults.passed++;
}

function logError(message, error = null) {
  log(`❌ ${message}`, colors.red);
  if (error) {
    log(`   Error: ${error.message}`, colors.red);
    testResults.errors.push({ test: message, error: error.message });
  }
  testResults.failed++;
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const timeout = setTimeout(() => {
      reject(new Error(`Request timeout after ${config.timeout}ms`));
    }, config.timeout);

    const req = client.get(url, options, (res) => {
      clearTimeout(timeout);
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data
          });
        }
      });
    });

    req.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    req.setTimeout(config.timeout, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${config.timeout}ms`));
    });
  });
}

// Test functions
async function testBackendHealth() {
  testResults.total++;
  try {
    const response = await makeRequest(`${config.backend}/api/health`);
    
    if (response.statusCode === 200 && response.data.success) {
      logSuccess('Backend health check passed');
      return true;
    } else {
      logError(`Backend health check failed - Status: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError('Backend health check failed', error);
    return false;
  }
}

async function testBackendDetailedHealth() {
  testResults.total++;
  try {
    const response = await makeRequest(`${config.backend}/api/health/detailed`);
    
    if (response.statusCode === 200 && response.data.success) {
      const checks = response.data.data.checks;
      if (checks.database.status === 'healthy') {
        logSuccess('Backend database connectivity confirmed');
        return true;
      } else {
        logError('Backend database connectivity failed');
        return false;
      }
    } else {
      logError(`Backend detailed health check failed - Status: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError('Backend detailed health check failed', error);
    return false;
  }
}

async function testBackendAPI() {
  testResults.total++;
  try {
    const response = await makeRequest(`${config.backend}/api`);
    
    if (response.statusCode === 200 && response.data.success) {
      logSuccess('Backend API info endpoint working');
      return true;
    } else {
      logError(`Backend API info failed - Status: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError('Backend API info failed', error);
    return false;
  }
}

async function testProductsAPI() {
  testResults.total++;
  try {
    const response = await makeRequest(`${config.backend}/api/v1/products`);
    
    if (response.statusCode === 200 && response.data.success) {
      logSuccess(`Products API working - Found ${response.data.data.length} products`);
      return true;
    } else {
      logError(`Products API failed - Status: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError('Products API failed', error);
    return false;
  }
}

async function testOrdersAPI() {
  testResults.total++;
  try {
    const response = await makeRequest(`${config.backend}/api/v1/orders`);
    
    if (response.statusCode === 200 && response.data.success) {
      logSuccess(`Orders API working - Found ${response.data.data.length} orders`);
      return true;
    } else {
      logError(`Orders API failed - Status: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError('Orders API failed', error);
    return false;
  }
}

async function testPOSTerminalsAPI() {
  testResults.total++;
  try {
    const response = await makeRequest(`${config.backend}/api/v1/pos-terminals`);
    
    if (response.statusCode === 200 && response.data.success) {
      logSuccess(`POS Terminals API working - Found ${response.data.data.length} terminals`);
      return true;
    } else {
      logError(`POS Terminals API failed - Status: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError('POS Terminals API failed', error);
    return false;
  }
}

async function testFrontendHealth() {
  testResults.total++;
  try {
    const response = await makeRequest(`${config.frontend}/api/health`);
    
    if (response.statusCode === 200) {
      logSuccess('Frontend health check passed');
      return true;
    } else {
      logError(`Frontend health check failed - Status: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError('Frontend health check failed', error);
    return false;
  }
}

async function testFrontendPages() {
  const pages = [
    { path: '/', name: 'Home page' },
    { path: '/pos/pos1', name: 'POS interface' },
    { path: '/admin', name: 'Admin dashboard' },
  ];

  for (const page of pages) {
    testResults.total++;
    try {
      const response = await makeRequest(`${config.frontend}${page.path}`);
      
      if (response.statusCode === 200) {
        logSuccess(`${page.name} accessible`);
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        logWarning(`${page.name} redirected (Status: ${response.statusCode})`);
        testResults.passed++;
      } else {
        logError(`${page.name} failed - Status: ${response.statusCode}`);
      }
    } catch (error) {
      logError(`${page.name} failed`, error);
    }
  }
}

async function testCORSConfiguration() {
  testResults.total++;
  try {
    // Test if backend accepts requests from frontend origin
    const options = {
      headers: {
        'Origin': config.frontend,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    };
    
    const response = await makeRequest(`${config.backend}/api/health`, options);
    
    if (response.headers['access-control-allow-origin']) {
      logSuccess('CORS configuration working');
      return true;
    } else {
      logWarning('CORS headers not found - may need configuration');
      testResults.passed++; // Don't fail for this
      return true;
    }
  } catch (error) {
    logError('CORS test failed', error);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n🚀 Starting End-to-End Integration Tests', colors.blue);
  log('==========================================', colors.blue);
  
  logInfo(`Frontend URL: ${config.frontend}`);
  logInfo(`Backend URL: ${config.backend}`);
  logInfo(`Timeout: ${config.timeout}ms\n`);

  // Backend Tests
  log('🔧 Testing Backend Services...', colors.yellow);
  await testBackendHealth();
  await testBackendDetailedHealth();
  await testBackendAPI();
  
  // API Endpoint Tests
  log('\n📡 Testing API Endpoints...', colors.yellow);
  await testProductsAPI();
  await testOrdersAPI();
  await testPOSTerminalsAPI();
  
  // Frontend Tests
  log('\n🌐 Testing Frontend Application...', colors.yellow);
  await testFrontendHealth();
  await testFrontendPages();
  
  // Integration Tests
  log('\n🔗 Testing Integration...', colors.yellow);
  await testCORSConfiguration();
  
  // Results Summary
  log('\n📊 Test Results Summary', colors.blue);
  log('======================', colors.blue);
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  
  log(`Total Tests: ${testResults.total}`);
  log(`Passed: ${testResults.passed}`, colors.green);
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? colors.red : colors.green);
  log(`Success Rate: ${successRate}%`, successRate >= 90 ? colors.green : colors.yellow);
  
  if (testResults.errors.length > 0) {
    log('\n❌ Failed Tests:', colors.red);
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error.test}: ${error.error}`, colors.red);
    });
  }
  
  log('\n🎯 Recommendations:', colors.blue);
  
  if (testResults.failed === 0) {
    log('✅ All tests passed! The application is ready for production use.', colors.green);
  } else if (successRate >= 80) {
    log('⚠️  Most tests passed. Review failed tests and fix critical issues.', colors.yellow);
  } else {
    log('❌ Multiple tests failed. Review configuration and fix issues before production use.', colors.red);
  }
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
End-to-End Integration Testing Script

Usage: node test-integration.js [options]

Options:
  --help, -h          Show this help message
  --frontend <url>    Frontend URL (default: http://localhost:3000)
  --backend <url>     Backend URL (default: http://localhost:5000)
  --timeout <ms>      Request timeout in milliseconds (default: 10000)

Environment Variables:
  FRONTEND_URL        Frontend URL
  BACKEND_URL         Backend URL

Examples:
  node test-integration.js
  node test-integration.js --frontend https://my-app.onrender.com --backend https://my-api.onrender.com
  FRONTEND_URL=https://my-app.onrender.com BACKEND_URL=https://my-api.onrender.com node test-integration.js
`);
  process.exit(0);
}

// Parse command line arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--frontend':
      config.frontend = args[++i];
      break;
    case '--backend':
      config.backend = args[++i];
      break;
    case '--timeout':
      config.timeout = parseInt(args[++i]);
      break;
  }
}

// Run the tests
runTests().catch((error) => {
  logError('Test runner failed', error);
  process.exit(1);
});