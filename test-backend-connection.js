// Simple test to check backend connection
const API_URL = 'https://my-shop-app-backend.onrender.com';

async function testBackendConnection() {
  console.log('Testing backend connection...');
  console.log('API URL:', API_URL);
  
  try {
    // Test basic health check
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_URL}/health`);
    console.log('Health status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health data:', JSON.stringify(healthData, null, 2));
    } else {
      console.log('Health check failed:', await healthResponse.text());
    }
    
    // Test POS terminals endpoint
    console.log('\n2. Testing POS terminals endpoint...');
    const posResponse = await fetch(`${API_URL}/api/v1/pos-terminals`);
    console.log('POS terminals status:', posResponse.status);
    
    if (posResponse.ok) {
      const posData = await posResponse.json();
      console.log('POS terminals data:', JSON.stringify(posData, null, 2));
    } else {
      console.log('POS terminals failed:', await posResponse.text());
    }
    
  } catch (error) {
    console.error('Connection error:', error.message);
  }
}

// Run the test
testBackendConnection();