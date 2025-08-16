'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/authStore';

// User interface is now imported from authStore

interface Booking {
  id: string;
  bookingId: string;
  origin?: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  returnTrip?: boolean;
  totalAmount: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  type: 'flight' | 'train' | 'bus' | 'hotel' | 'package';
}

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, logout, checkAuth } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      console.log('Dashboard: Initial auth state:', { isAuthenticated, isLoading, user });
      
      // Check authentication status
      const isAuth = await checkAuth();
      
      console.log('Dashboard: Auth state after checkAuth:', { 
        isAuthenticated: useAuthStore.getState().isAuthenticated, 
        user: useAuthStore.getState().user,
        isAuth
      });
      
      // If authenticated, fetch bookings
      if (isAuth) {
        fetchBookings();
      }
    };
    
    verifyAuth();
  }, [checkAuth]);

  // Middleware will handle redirection, but we'll add a client-side check as a fallback
  useEffect(() => {
    console.log('Dashboard: Checking redirect condition:', { isLoading, isAuthenticated });
    if (!isLoading && !isAuthenticated) {
      console.log('Dashboard: Not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
      if (response.ok) {
        const bookingsData = await response.json();
        setBookings(bookingsData);
      }
    } catch {
      console.error('Failed to fetch bookings');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Tripy Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.firstName}!</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'bookings', name: 'My Bookings', icon: '✈️' },
                { id: 'profile', name: 'Profile', icon: '👤' },
                { id: 'plan', name: 'Plan New Trip', icon: '🗺️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-violet-500 text-violet-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Total Bookings</h3>
                    <p className="text-3xl font-bold">{bookings.length}</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Active Trips</h3>
                    <p className="text-3xl font-bold">
                      {bookings.filter(b => b.status === 'confirmed').length}
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Total Spent</h3>
                    <p className="text-3xl font-bold">
                      ₹{bookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                      href="/"
                      className="bg-white p-4 rounded-lg border border-gray-200 hover:border-violet-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">🎤</span>
                        <div>
                          <h4 className="font-semibold">Voice Assistant</h4>
                          <p className="text-sm text-gray-600">Plan your next trip with AI</p>
                        </div>
                      </div>
                    </Link>
                    <Link
                      href="/dashboard?tab=bookings"
                      onClick={() => setActiveTab('bookings')}
                      className="bg-white p-4 rounded-lg border border-gray-200 hover:border-violet-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">📋</span>
                        <div>
                          <h4 className="font-semibold">View Bookings</h4>
                          <p className="text-sm text-gray-600">Check your travel history</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">My Bookings</h3>
                {bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No bookings yet</p>
                    <Link
                      href="/"
                      className="bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700"
                    >
                      Plan Your First Trip
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{booking.origin && booking.returnTrip ? `${booking.origin} ↔ ${booking.destination}` : booking.destination}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(booking.departureDate).toLocaleDateString()}
                              {booking.returnDate && booking.returnTrip && (
                                <> - {new Date(booking.returnDate).toLocaleDateString()}</>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">Booking ID: {booking.bookingId}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{booking.totalAmount.toLocaleString()}</p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Profile Information</h3>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <p className="text-gray-900">{user.firstName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <p className="text-gray-900">{user.lastName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <p className="text-gray-900">{user.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                      <p className="text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'plan' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Plan New Trip</h3>
                <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white p-6 rounded-lg">
                  <h4 className="text-lg font-semibold mb-2">Ready to travel?</h4>
                  <p className="mb-4">Use our AI-powered voice assistant to plan your perfect trip!</p>
                  <Link
                    href="/"
                    className="bg-white text-violet-600 px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors inline-block"
                  >
                    Start Planning
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
