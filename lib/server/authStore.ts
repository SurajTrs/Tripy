'use server';

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Define interfaces
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

const usersFile = path.join(process.cwd(), 'users.json');

// In-memory sessions storage with persistence across requests
// Using a global variable to ensure persistence in development mode
let sessions: Session[] = [];

// For debugging
const debugSessions = () => {
  console.log('Current sessions:', sessions.map(s => ({ id: s.id, userId: s.userId })));
};

// Get all users from the JSON file
export async function getUsers(): Promise<User[]> {
  try {
    const data = fs.readFileSync(usersFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

// Add a user to the JSON file
export async function addUser(user: any): Promise<void> {
  const users = await getUsers();
  users.push(user);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// Find a user by email
async function findUserByEmail(email: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(user => user.email === email);
}

// Find a user by ID
async function findUserById(id: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(user => user.id === id);
}

// Create a new user
async function createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
  const newUser: User = {
    ...userData,
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    createdAt: new Date().toISOString()
  };
  
  await addUser(newUser);
  return newUser;
}

// Create a new session
async function createSession(userId: string): Promise<string> {
  const sessionId = uuidv4();
  const session: Session = {
    id: sessionId,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  };
  
  sessions.push(session);
  console.log('Server AuthStore: Created new session:', { sessionId, userId });
  console.log('Server AuthStore: Total sessions:', sessions.length);
  return sessionId;
}

// Find a session by ID
async function findSession(sessionId: string): Promise<Session | undefined> {
  if (!sessionId || typeof sessionId !== 'string') {
    console.log('Server AuthStore: Invalid session ID provided:', sessionId);
    return undefined;
  }
  
  console.log('Server AuthStore: Finding session:', sessionId);
  debugSessions();
  
  // Filter out expired sessions
  const now = new Date();
  const expiredSessions = sessions.filter(session => {
    const expiryDate = new Date(session.expiresAt);
    return expiryDate <= now;
  });
  
  if (expiredSessions.length > 0) {
    console.log(`Server AuthStore: Removing ${expiredSessions.length} expired sessions`);
    expiredSessions.forEach(session => {
      console.log('Server AuthStore: Removing expired session:', session.id);
    });
  }
  
  sessions = sessions.filter(session => {
    const expiryDate = new Date(session.expiresAt);
    return expiryDate > now;
  });
  
  const session = sessions.find(session => session.id === sessionId);
  console.log('Server AuthStore: Session found:', !!session);
  if (session) {
    console.log('Server AuthStore: Session user ID:', session.userId);
    console.log('Server AuthStore: Session expires:', new Date(session.expiresAt).toISOString());
    
    // Verify session is not expired (double-check)
    const expiryDate = new Date(session.expiresAt);
    if (expiryDate <= now) {
      console.log('Server AuthStore: Session is expired, removing it');
      sessions = sessions.filter(s => s.id !== sessionId);
      return undefined;
    }
  } else {
    console.log('Server AuthStore: No matching session found for ID:', sessionId);
  }
  return session;
}

// Delete a session
async function deleteSession(sessionId: string): Promise<void> {
  sessions = sessions.filter(session => session.id !== sessionId);
}

// Get user data without password
async function getUserWithoutPassword(user: User): Promise<Omit<User, 'password'>> {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Get all users (for debugging)
async function getAllUsers(): Promise<User[]> {
  return await getUsers();
}

// Export all functions directly
export { findUserByEmail };
export { findUserById };
export { createUser };
export { createSession };
export { findSession };
export { deleteSession };
export { getUserWithoutPassword };
export { getAllUsers };
