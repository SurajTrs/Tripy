import { create } from 'zustand';
import { persist, createJSONStorage, type PersistOptions, type StateStorage, type StorageValue } from 'zustand/middleware';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          console.log('AuthStore: Attempting login for:', email);
          
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include', // Important for cookies
          });

          const data = await response.json();
          console.log('AuthStore: Login response:', { status: response.status, data });

          if (!response.ok) {
            throw new Error(data.message || 'Login failed');
          }

          // Set authenticated state immediately with user data from login response
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null, // Ensure error is cleared on successful login
          });
          
          // Then verify with /me endpoint to ensure everything is consistent
          try {
            // Add timestamp to prevent caching
            const timestamp = new Date().getTime();
            const meResponse = await fetch(`/api/auth/me?_=${timestamp}`, { 
              credentials: 'include',
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
              },
            });
            
            if (meResponse.ok) {
              const userData = await meResponse.json();
              console.log('AuthStore: Verified user data after login:', userData);
              set({
                user: userData,
                isAuthenticated: true,
                error: null,
              });
            } else {
              console.warn('AuthStore: /me endpoint returned non-OK status after login:', meResponse.status);
              // We already set the user from the login response, so don't change authentication state
            }
          } catch (verifyErr) {
            console.error('AuthStore: Failed to verify user after login:', verifyErr);
            // We already set the user from the login response, so no need to set again
          }
        } catch (error: any) {
          console.error('AuthStore: Login error:', error);
          set({
            error: error.message || 'An error occurred during login',
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
        }
      },

      signup: async (userData) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
            credentials: 'include', // Important for cookies
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Signup failed');
          }

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null, // Ensure error is cleared on successful signup
          });
          
          // Verify with /me endpoint to ensure everything is consistent
          try {
            // Add timestamp to prevent caching
            const timestamp = new Date().getTime();
            const meResponse = await fetch(`/api/auth/me?_=${timestamp}`, { 
              credentials: 'include',
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
              },
            });
            
            if (meResponse.ok) {
              const userData = await meResponse.json();
              console.log('AuthStore: Verified user data after signup:', userData);
              set({
                user: userData,
                isAuthenticated: true,
                error: null,
              });
            }
          } catch (verifyErr) {
            console.error('AuthStore: Failed to verify user after signup:', verifyErr);
            // We already set the user from the signup response, so no need to set again
          }
        } catch (error: any) {
          console.error('AuthStore: Signup error:', error);
          set({
            error: error.message || 'An error occurred during signup',
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true, error: null });
          
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include', // Important for cookies
          });

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error('AuthStore: Logout error:', error);
          // Still clear the user data even if the logout API call fails
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || 'An error occurred during logout',
          });
        }
      },

      checkAuth: async () => {
        try {
          // Get current state to check if we're already authenticated
          const currentState = get();
          set({ isLoading: true, error: null }); // Clear any previous errors
          console.log('AuthStore: Checking authentication status');
          
          // Add a timestamp to prevent caching issues
          const timestamp = new Date().getTime();
          const response = await fetch(`/api/auth/me?_=${timestamp}`, {
            credentials: 'include', // Important for cookies
            cache: 'no-store', // Prevent caching
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          });
          
          console.log('AuthStore: /api/auth/me status:', response.status);
          
          if (response.ok) {
            try {
              const data = await response.json();
              console.log('AuthStore: User authenticated:', data);
              
              if (data && data.id) {
                set({
                  user: data,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null, // Clear any previous errors
                });
                return true;
              } else {
                console.log('AuthStore: Invalid user data received');
                set({
                  user: null,
                  isAuthenticated: false,
                  isLoading: false,
                  error: null, // Don't set error for normal unauthenticated state
                });
                return false;
              }
            } catch (jsonError) {
              console.error('AuthStore: Error parsing JSON response:', jsonError);
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: 'Error parsing authentication response',
              });
              return false;
            }
          } else {
            console.log('AuthStore: User not authenticated, status:', response.status);
            // Don't set error for normal unauthenticated state (401)
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: response.status !== 401 ? 'Authentication failed' : null,
            });
            return false;
          }
        } catch (error) {
          console.error('AuthStore: Error checking auth:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Authentication check failed',
          });
          return false;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage', // name of the item in the storage
      storage: createJSONStorage(() => {
        // Check if window is defined (browser environment)
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        // Return a no-op storage for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {}
        };
      })
    }
  )
);