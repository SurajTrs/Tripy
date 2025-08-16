// Test script to verify the authentication flow

async function testAuthFlow() {
  try {
    console.log('=== Testing Authentication Flow ===');
    
    // Step 1: Login
    console.log('\n1. Testing login...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      }),
      credentials: 'include'
    });
    
    const loginData = await loginResponse.json();
    console.log('Login status:', loginResponse.status);
    console.log('Login response:', loginData);
    
    // Get cookies from response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Cookies set:', cookies);
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }
    
    // Step 2: Check authentication status
    console.log('\n2. Testing /api/auth/me endpoint...');
    
    // Extract the session token from the cookies string
    let sessionToken = null;
    if (cookies) {
      const match = cookies.match(/session_token=([^;]+)/);
      if (match) {
        sessionToken = match[1];
        console.log('Extracted session token:', sessionToken);
      }
    }
    
    if (!sessionToken) {
      throw new Error('No session token found in cookies');
    }
    
    // Add a small delay to ensure the session is properly registered
    console.log('Waiting 500ms before checking authentication status...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const meResponse = await fetch('http://localhost:3000/api/auth/me', {
      credentials: 'include',
      headers: {
        Cookie: `session_token=${sessionToken}`, // Pass the session token cookie
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    const meData = await meResponse.json();
    console.log('/me status:', meResponse.status);
    console.log('/me response:', meData);
    
    if (!meResponse.ok) {
      throw new Error(`/me endpoint failed with status ${meResponse.status}`);
    }
    
    console.log('\n=== Authentication Flow Test Completed Successfully ===');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testAuthFlow();