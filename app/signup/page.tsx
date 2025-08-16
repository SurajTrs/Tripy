'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/authStore';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const router = useRouter();
  const { signup, isLoading, error, clearError } = useAuthStore();
  
  useEffect(() => {
    // Clear any previous auth errors when component mounts
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (formData.password !== formData.confirmPassword) {
      // Use the store's error state
      useAuthStore.setState({ error: 'Passwords do not match' });
      return;
    }

    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password
    };

    await signup(userData);
    
    // If no error after signup attempt, redirect to login
    if (!useAuthStore.getState().error) {
      router.push('/login?message=Account created successfully! Please log in.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join Tripy for personalized travel planning</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
               <div>
                 <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                   First Name
                 </label>
                 <input
                   id="firstName"
                   type="text"
                   required
                   value={formData.firstName}
                   onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                   placeholder="Enter your first name"
                 />
               </div>
               <div>
                 <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                   Last Name
                 </label>
                 <input
                   id="lastName"
                   type="text"
                   required
                   value={formData.lastName}
                   onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                   placeholder="Enter your last name"
                 />
               </div>
             </div>

             <div>
               <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                 Email
               </label>
               <input
                 id="email"
                 type="email"
                 required
                 value={formData.email}
                 onChange={(e) => setFormData({...formData, email: e.target.value})}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                 placeholder="Enter your email address"
               />
             </div>

             <div>
               <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                 Phone Number
               </label>
               <input
                 id="phone"
                 type="tel"
                 required
                 value={formData.phone}
                 onChange={(e) => setFormData({...formData, phone: e.target.value})}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                 placeholder="Enter your phone number"
               />
             </div>

             <div>
               <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                 Password
               </label>
               <input
                 id="password"
                 type="password"
                 required
                 value={formData.password}
                 onChange={(e) => setFormData({...formData, password: e.target.value})}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                 placeholder="Enter your password"
               />
             </div>

             <div>
               <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                 Confirm Password
               </label>
               <input
                 id="confirmPassword"
                 type="password"
                 required
                 value={formData.confirmPassword}
                 onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                 placeholder="Confirm your password"
               />
             </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-violet-600 hover:text-violet-700 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
