// src/components/VoiceAssistant.tsx
'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { TripPlanData, TripContext, FlightData, HotelData } from '../types';
import { HotelCard } from './tripResults/HotelCard';
import { FlightCard } from './tripResults/FlightCard';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
    SpeechRecognitionEvent: any;
  }
}

interface VoiceAssistantProps {
  isActive: boolean;
  onClose: () => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
}

interface TripResponse {
  assistantFollowUp?: boolean;
  ask?: keyof TripContext;
  context?: TripContext;
  success?: boolean;
  message?: string;
  data?: Partial<TripPlanData>;
  error?: string;
}

type Message = {
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

function getPlaceholderForAsk(askKey: keyof TripContext): string {
  switch (askKey) {
    case 'from':      return 'e.g., Delhi';
    case 'to':        return 'e.g., Mumbai';
    case 'date':      return 'e.g., tomorrow';
    case 'budget':    return 'e.g., luxury or budget';
    case 'groupSize': return 'e.g., 2 people';
    case 'mode':      return 'e.g., flight or train';
    default:          return 'your answer';
  }
}

export default function VoiceAssistant({
  isActive,
  onClose,
  isListening,
  setIsListening,
}: VoiceAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [tripContext, setTripContext] = useState<TripContext>({});
  const [fallbackInput, setFallbackInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [rightPanelData, setRightPanelData] = useState<Partial<TripPlanData> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const handleOptionSelect = (optionType: 'flight' | 'hotel', selection: FlightData | HotelData) => {
    const selectionName = 'airline' in selection ? selection.airline : selection.name;
    addMessage({
      type: 'user',
      content: `I've selected the ${optionType}: ${selectionName}.`,
      timestamp: new Date(),
    });

    const updatedContext: TripContext = {
      ...tripContext,
      [optionType]: selection,
    };
    setTripContext(updatedContext);
    sendCommand(`User selected ${optionType}`, updatedContext);
  };

  const sendCommand = async (command: string, customContext?: TripContext) => {
    if (!command.trim() || isProcessing) return;

    if (!customContext) {
      addMessage({ type: 'user', content: command, timestamp: new Date() });
      setRightPanelData(null);
    }
    setFallbackInput('');
    setIsProcessing(true);

    try {
      const requestBody = {
        message: command,
        context: customContext || tripContext,
        lat: 0, lng: 0,
      };

      const res = await fetch('/api/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const result: TripResponse = await res.json();
      if (!res.ok) throw new Error(result.error || 'Server error.');

      if (result.message) {
        addMessage({ type: 'assistant', content: result.message, timestamp: new Date() });
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(result.message);
            utterance.rate = 0.95;
            window.speechSynthesis.speak(utterance);
        }
      }
      
      if (result.context) {
        setTripContext(result.context);
      }
      
      if (result.data) {
        setRightPanelData(result.data);
      } else if (result.success === false) {
        setRightPanelData(null);
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Something went wrong.';
      addMessage({ type: 'assistant', content: errorMessage, timestamp: new Date() });
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(errorMessage);
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setIsProcessing(false);
      setIsListening(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;
    const recog = new SpeechRecognition();
    recog.lang = 'en-IN';
    recog.interimResults = false;
    recog.onresult = (e: SpeechRecognitionEvent) => sendCommand(e.results[0][0].transcript);
    recog.onerror = () => setIsListening(false);
    recog.onend = () => setIsListening(false);
    recog.start();
    setIsListening(true);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendCommand(fallbackInput);
  };

  if (!isActive) return null;
  
  const isFinalPlan = rightPanelData?.transport && rightPanelData?.hotel && rightPanelData?.total != null;
  const currentAsk = tripContext.ask;

  return (
    <aside role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="flex h-[90vh] max-h-[700px] w-full max-w-5xl flex-row overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-col w-full lg:w-3/5 overflow-hidden">
            <header className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-purple-600 p-5 text-white shadow-md">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30"><i className="ri-robot-2-line text-2xl" /></div>
                    <div><h2 className="text-lg font-bold">Tripy AI Assistant</h2><p className="text-sm text-violet-200">Your intelligent travel buddy</p></div>
                </div>
                <button onClick={onClose} aria-label="Close assistant" className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/20"><i className="ri-close-line text-2xl" /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 bg-gray-50">
                {!messages.length && <div className="flex h-full flex-col items-center justify-center text-gray-500"><div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100"><i className="ri-mic-line text-4xl text-violet-600" /></div><p className="text-lg font-medium">Ready to assist you!</p><p className="text-sm">Tap the mic or type below to start planning.</p></div>}
                {messages.map((msg, idx) => (<div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}><div role="log" aria-live="polite" className={`max-w-md whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.type === 'user' ? 'bg-violet-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`} dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-violet-300 hover:underline">$1</a>').replace(/\n/g, '<br/>') }} /></div>))}
                {isProcessing && <div className="flex justify-start"><div className="flex items-center gap-2 rounded-2xl rounded-bl-none bg-white px-4 py-3 text-gray-800 shadow-sm"><span className="h-2 w-2 animate-bounce rounded-full bg-violet-600" /><span className="h-2 w-2 animate-bounce rounded-full bg-violet-600 delay-150" /><span className="h-2 w-2 animate-bounce rounded-full bg-violet-600 delay-300" /><span className="ml-2 text-sm">Tripy is thinking...</span></div></div>}
                <div ref={bottomRef} />
            </div>
            <footer className="flex-shrink-0 border-t border-gray-200 p-4 bg-white">
                <div className="flex items-center gap-4">
                    <button onClick={startListening} disabled={isListening || isProcessing} aria-label={isListening ? 'Stop listening' : 'Start listening'} className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${isListening ? 'animate-pulse bg-red-500' : 'bg-violet-600 hover:bg-violet-700'} text-white ${isProcessing ? 'cursor-not-allowed bg-gray-400' : ''}`}><i className={`text-2xl ${isListening ? 'ri-mic-off-fill' : 'ri-mic-fill'}`} /></button>
                    <input type="text" value={fallbackInput} onChange={(e) => setFallbackInput(e.target.value)} onKeyDown={handleKeyDown} disabled={isProcessing} 
                           placeholder={currentAsk ? getPlaceholderForAsk(currentAsk) : "Type your command..."}
                           aria-label="Type your command" className="flex-1 rounded-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    <button onClick={() => sendCommand(fallbackInput)} disabled={!fallbackInput.trim() || isProcessing} className="rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50">Send</button>
                </div>
            </footer>
        </div>

        {/* --- REVISED & SAFER Right Panel Rendering Logic --- */}
        <div className="hidden lg:flex flex-col w-2/5 border-l border-gray-200 bg-gray-100 overflow-y-auto p-4">
          {rightPanelData ? (
            <>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {isFinalPlan ? 'Your Trip Summary' : 'Trip Options'}
              </h3>
              <div className="flex-1 space-y-4">
                {isFinalPlan ? (
                  // Display Final Trip Plan (with safety checks)
                  <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 text-sm space-y-2">
                    {rightPanelData.transport && 'departureAirportIata' in rightPanelData.transport && <p><strong>From:</strong> {rightPanelData.transport.departureAirportIata}</p>}
                    {rightPanelData.transport && 'arrivalAirportIata' in rightPanelData.transport && <p><strong>To:</strong> {rightPanelData.transport.arrivalAirportIata}</p>}
                    <hr/>
                    {rightPanelData.transport && 'airline' in rightPanelData.transport && <p><strong>Flight:</strong> {rightPanelData.transport.airline} - ₹{rightPanelData.transport.price.toLocaleString()}</p>}
                    {rightPanelData.hotel && <p><strong>Hotel:</strong> {rightPanelData.hotel.name} - ₹{rightPanelData.hotel.price.toLocaleString()}/night</p>}
                    <hr/>
                    {rightPanelData.cabToStation && <p><strong>Cab to Airport:</strong> ₹{rightPanelData.cabToStation.price.toLocaleString()}</p>}
                    {rightPanelData.cabToHotel && <p><strong>Cab to Hotel:</strong> ₹{rightPanelData.cabToHotel.price.toLocaleString()}</p>}
                    <hr/>
                    {rightPanelData.total != null && <p className="text-base font-bold mt-2">Total Est. Cost: ₹{rightPanelData.total.toLocaleString()}</p>}
                  </div>
                ) : (
                  // Display Intermediate Options
                  <>
                    {rightPanelData.transport && 'airline' in rightPanelData.transport && (
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Selected Flight</h4>
                            <div className="bg-violet-50 p-3 rounded-lg border border-violet-200 text-sm">
                                <p className="font-bold">{rightPanelData.transport.airline}</p>
                                <p>Price: ₹{rightPanelData.transport.price.toLocaleString()}</p>
                            </div>
                        </div>
                    )}
                   {rightPanelData.availableFlights && (
  <div>
    <h4 className="font-semibold text-gray-700 mb-2">Choose a Flight</h4>
    {rightPanelData.availableFlights.map((flight) => (
      <FlightCard
        key={flight.id}
        flight={flight}
        onSelect={() => handleOptionSelect('flight', flight)}
      />
    ))}
  </div>
)}
                    {rightPanelData.availableHotels && (
  <div>
    <h4 className="font-semibold text-gray-700 mb-2">Choose a Hotel</h4>
    {rightPanelData.availableHotels.map((hotel) => (
      <HotelCard
        key={hotel.id}
        hotel={hotel}
        onSelect={() => handleOptionSelect('hotel', hotel)}
      />
    ))}
  </div>
)}

                  </>
                )}
              </div>
            </>
          ) : (
             <div className="flex h-full flex-col items-center justify-center text-center text-gray-500">
                <i className="ri-search-line text-4xl mb-2"></i>
                <p>Your trip details will appear here as you plan!</p>
             </div>
          )}
        </div>
      </div>
    </aside>
  );
}
