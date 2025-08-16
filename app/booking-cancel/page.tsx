'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function BookingCancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const reason = searchParams.get('reason') || 'The payment was canceled or failed to process.';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
          <h1 className="text-2xl font-bold">Booking Canceled</h1>
          <p className="opacity-90 mt-1">Your payment was not completed</p>
        </div>

        <div className="p-6 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-red-100 rounded-full p-3">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6">{reason}</p>
          
          <div className="space-y-4">
            <Link href="/" className="block w-full px-6 py-3 bg-purple-600 text-white text-center rounded-lg hover:bg-purple-700 transition-colors">
              Return Home
            </Link>
            <button 
              onClick={() => router.back()}
              className="block w-full px-6 py-3 bg-gray-200 text-gray-800 text-center rounded-lg hover:bg-gray-300 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingCancelPage() {
  return (
    <Suspense>
      <BookingCancelContent />
    </Suspense>
  );
}