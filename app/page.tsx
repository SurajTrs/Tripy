
'use client';

import { useState, useEffect } from 'react';
import VoiceAssistant from '../components/VoiceAssistant';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import ServicesSection from '../components/ServicesSection';
import TestimonialsSection from '../components/TestimonialsSection';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [isAssistantActive, setIsAssistantActive] = useState(false);

  useEffect(() => {
    console.log('Home page loaded');
    // We've removed the authStore initialization to fix the client-side error
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900">
      <Header />
      <HeroSection 
        onActivateAssistant={() => setIsAssistantActive(true)}
        isListening={isListening}
      />
      <FeaturesSection />
      <ServicesSection onActivateAssistant={() => setIsAssistantActive(true)} />
      <TestimonialsSection />
      <Footer />
      
      <VoiceAssistant 
        isActive={isAssistantActive}
        onClose={() => setIsAssistantActive(false)}
        isListening={isListening}
        setIsListening={setIsListening}
      />
    </div>
  );
}
