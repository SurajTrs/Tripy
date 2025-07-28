'use client';

import { useState } from 'react';

interface HeroSectionProps {
  onActivateAssistant: () => void;
  isListening: boolean;
}

export default function HeroSection({ onActivateAssistant, isListening }: HeroSectionProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section
      className="relative min-h-screen flex items-center justify-center text-white overflow-hidden"
      aria-label="Hero Section"
    >
      {/* Background Image */}
      <div
        className=" absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/assets/bg.png')`,
          
           backgroundPosition: 'center -45%',
           backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b]/80 via-[#3b0764]/70 to-[#312e81]/90" />

      {/* Content Wrapper */}
      <div className="relative z-10 w-full max-w-7xl px-6 lg:px-10 py-20">
        <div className="grid lg:grid-cols-2 items-center gap-16">
          {/* Left Side */}
          <div className="space-y-8 text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              Discover. Plan. Travel.
            </h1>
            <p className="text-lg lg:text-xl text-violet-200 font-medium">
              Your AI-Powered Travel Companion
            </p>
            <p className="text-base lg:text-lg text-violet-100 max-w-xl mx-auto lg:mx-0">
              Say “Hey Tripy” and watch your travel experience transform. From personalized itineraries to full bookings, Tripy handles it all.
            </p>

            {/* CTA Button */}
            <div className="relative inline-block group">
              <button
                onClick={onActivateAssistant}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`relative z-10 px-8 py-4 text-lg font-semibold rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-2xl transition duration-300 ${
                  isListening ? 'animate-pulse scale-105' : 'hover:scale-105'
                }`}
              >
                <div className="flex items-center gap-3 justify-center">
                  <i className="ri-mic-line text-xl"></i>
                  {isListening ? 'Listening...' : 'Activate Tripy AI'}
                </div>
              </button>
              {(isListening || isHovered) && (
                <div className="absolute inset-0 z-0 rounded-full bg-white/10 blur-xl animate-ping" />
              )}
            <p className="mt-4 text-sm text-violet-200 italic">
  Try: &quot;Hey Tripy, book my trip from Delhi to Manali&quot;
</p>

            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-10 text-center">
              {[
                ['50K+', 'Trips Planned'],
                ['25', 'Languages Supported'],
                ['24/7', 'AI Assistance'],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 shadow-inner"
                >
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-sm text-violet-200">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Assistant Visual */}
          <div className="flex justify-center items-center">
            <div className="relative">
              {/* Main Orb */}
              <div
                className={`w-80 h-80 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 shadow-[0_0_60px_rgba(124,58,237,0.3)] flex items-center justify-center relative ${
                  isListening ? 'animate-pulse' : ''
                }`}
              >
                <div className="w-64 h-64 rounded-full bg-gradient-to-br from-violet-300 to-purple-500 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <i className="ri-robot-line text-4xl text-white"></i>
                  </div>
                </div>

                {/* Orbit Effects */}
                <div className="absolute inset-0 animate-spin-slow">
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/60 rounded-full" />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/40 rounded-full" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-white/50 rounded-full" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-white/70 rounded-full" />
                </div>
              </div>

              {/* Floating Icons */}
              {[
                { icon: 'ri-flight-takeoff-line', position: '-top-4 -right-4' },
                { icon: 'ri-hotel-line', position: '-bottom-4 -left-4', delay: 'delay-200' },
                { icon: 'ri-map-pin-line', position: 'top-1/2 -left-8', delay: 'delay-500' },
                { icon: 'ri-restaurant-line', position: 'top-1/2 -right-8', delay: 'delay-700' },
              ].map(({ icon, position, delay }) => (
                <div
                  key={icon}
                  className={`absolute ${position} w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center animate-float ${delay}`}
                >
                  <i className={`${icon} text-white text-xl`}></i>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Down Icon */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="w-8 h-8 animate-bounce flex items-center justify-center">
          <i className="ri-arrow-down-line text-white text-2xl"></i>
        </div>
      </div>
    </section>
  );
}
