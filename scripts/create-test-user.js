const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    // Define the test user
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '1234567890',
      password: await bcrypt.hash('password123', 12), // Hash the password
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      createdAt: new Date().toISOString()
    };
    
    console.log('Test user created with ID:', testUser.id);
    console.log('Email:', testUser.email);
    console.log('Password (unhashed): password123');
    
    // Read the existing users file
    const usersFilePath = path.join(process.cwd(), 'users.json');
    const usersData = fs.readFileSync(usersFilePath, 'utf-8');
    const users = JSON.parse(usersData);
    
    // Check if a user with this email already exists
    const existingUser = users.find(user => user.email === testUser.email);
    if (existingUser) {
      console.log('User with this email already exists. Updating password...');
      existingUser.password = testUser.password;
    } else {
      // Add the new user
      users.push(testUser);
      console.log('Added new test user');
    }
    
    // Write the updated users back to the file
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    console.log('Users file updated successfully');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createTestUser();