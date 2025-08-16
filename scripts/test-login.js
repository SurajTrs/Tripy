// Test script to verify login functionality
// Use dynamic import for node-fetch
import('node-fetch').then(({ default: fetch }) => {
  testLogin(fetch);
});

async function testLogin(fetch) {
  try {
    console.log('Testing login functionality...');
    
    // Test credentials
    const credentials = {
      email: 'suraj@gmail.com',
      password: 'password123'
    };
    
    console.log(`Attempting to login with email: ${credentials.email}`);
    
    // Make login request
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    // Get cookies from response
    const cookies = response.headers.get('set-cookie');
    console.log('Response status:', response.status);
    console.log('Cookies:', cookies);
    
    // Parse response body
    const data = await response.json();
    console.log('Response data:', data);
    
    // If login successful, test /api/auth/me endpoint
    if (response.ok && cookies) {
      console.log('\nTesting /api/auth/me endpoint with session cookie...');
      
      const meResponse = await fetch('http://localhost:3000/api/auth/me', {
        headers: {
          'Cookie': cookies
        }
      });
      
      console.log('/api/auth/me status:', meResponse.status);
      const meData = await meResponse.json();
      console.log('/api/auth/me data:', meData);
    }
    
    console.log('\nTest completed.');
  } catch (error) {
    console.error('Test error:', error);
  }
}