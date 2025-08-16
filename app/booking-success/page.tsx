'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface BookingDetails {
  id: string;
  status: string;
  amount_total: number;
  customer_details: {
    email: string;
    name: string;
  };
  metadata: {
    tripId: string;
    transportType: string;
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    groupSize: string;
  };
}

export default function BookingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    async function fetchBookingDetails() {
      try {
        const response = await fetch(`/api/stripe/session?session_id=${sessionId}`);
        const data = await response.json();

        if (data.success && data.session) {
          setBookingDetails(data.session);
        } else {
          setError(data.message || 'Failed to retrieve booking details');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching booking details');
      } finally {
        setLoading(false);
      }
    }

    fetchBookingDetails();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
          <h1 className="text-2xl font-bold">Booking Successful!</h1>
          <p className="opacity-90 mt-1">Thank you for booking your trip with Tripy</p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              <p className="mt-4 text-gray-600">Loading your booking details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 text-xl mb-4">❌ Error</div>
              <p className="text-gray-700">{error}</p>
              <Link href="/" className="mt-6 inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Return Home
              </Link>
            </div>
          ) : bookingDetails ? (
            <div className="space-y-6">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-green-100 rounded-full p-3">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <div className="border-b pb-4">
                <h2 className="text-lg font-semibold text-gray-800">Booking Details</h2>
                <div className="mt-3 grid grid-cols-1 gap-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking ID:</span>
                    <span className="font-medium">{bookingDetails.metadata.tripId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-green-600">Confirmed</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">₹{(bookingDetails.amount_total / 100).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="border-b pb-4">
                <h2 className="text-lg font-semibold text-gray-800">Trip Details</h2>
                <div className="mt-3 grid grid-cols-1 gap-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transport Type:</span>
                    <span className="font-medium">{bookingDetails.metadata.transportType.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">From:</span>
                    <span className="font-medium">{bookingDetails.metadata.origin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">To:</span>
                    <span className="font-medium">{bookingDetails.metadata.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Departure Date:</span>
                    <span className="font-medium">{bookingDetails.metadata.departureDate}</span>
                  </div>
                  {bookingDetails.metadata.returnDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Return Date:</span>
                      <span className="font-medium">{bookingDetails.metadata.returnDate}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Group Size:</span>
                    <span className="font-medium">{bookingDetails.metadata.groupSize}</span>
                  </div>
                </div>
              </div>
              
              <div className="border-b pb-4">
                <h2 className="text-lg font-semibold text-gray-800">Customer Details</h2>
                <div className="mt-3 grid grid-cols-1 gap-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{bookingDetails.customer_details.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{bookingDetails.customer_details.email}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link href="/" className="flex-1 px-6 py-3 bg-purple-600 text-white text-center rounded-lg hover:bg-purple-700 transition-colors">
                  Return Home
                </Link>
                <button 
                  onClick={() => window.print()}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 text-center rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Receipt
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-700">No booking details found</p>
              <Link href="/" className="mt-6 inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Return Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}