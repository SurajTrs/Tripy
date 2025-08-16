// src/components/VoiceAssistant.tsx
'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { TripPlanData, TripContext, FlightData, HotelData, TrainData, BusData } from '../types';
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
    case 'returnTrip': return 'e.g., yes or no';
    case 'returnDate': return 'e.g., next week, 30th December';
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
  const [isBooking, setIsBooking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [rightPanelData, setRightPanelData] = useState<Partial<TripPlanData> | null>(null);
  const [returnTripData, setReturnTripData] = useState<Partial<TripPlanData> | null>(null);

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

  const handleOptionSelect = (optionType: 'flight' | 'train' | 'bus' | 'hotel', selection: FlightData | TrainData | BusData | HotelData) => {
    let selectionName = '';
    
    if ('airline' in selection) {
      selectionName = selection.airline; // Flight
    } else if ('trainName' in selection) {
      selectionName = selection.trainName; // Train
    } else if ('operator' in selection) {
      selectionName = selection.operator; // Bus
    } else {
      selectionName = selection.name; // Hotel
    }
    
    addMessage({
      type: 'user',
      content: `I've selected the ${optionType}: ${selectionName}.`,
      timestamp: new Date(),
    });

    // Check if this is a return trip selection
    const isReturnSelection = tripContext.returnTrip && 
      ((tripContext.flight && !tripContext.returnFlight && optionType === 'flight') ||
       (tripContext.train && !tripContext.returnTrain && optionType === 'train') ||
       (tripContext.bus && !tripContext.returnBus && optionType === 'bus'));
    
    const updatedContext: TripContext = {
      ...tripContext,
    };
    
    if (isReturnSelection) {
      // This is a return selection
      const key = `return${optionType.charAt(0).toUpperCase() + optionType.slice(1)}` as 'returnFlight' | 'returnTrain' | 'returnBus';
      updatedContext[key] = selection as any;
    } else {
      // This is a regular selection
      const key = optionType as 'flight' | 'train' | 'bus' | 'hotel';
      updatedContext[key] = selection as any;
    }
    
    setTripContext(updatedContext);
    sendCommand(`User selected ${isReturnSelection ? 'return ' : ''}${optionType}`, updatedContext);
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
        // If this was a booking request and it was successful, update booking status
        if (result.context.bookingReference) {
          addMessage({ 
            type: 'assistant', 
            content: `✅ Booking confirmed! Reference: ${result.context.bookingReference}`, 
            timestamp: new Date() 
          });
        }
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

  const fetchRealTimePricing = async () => {
    if (!rightPanelData || !tripContext.origin || !tripContext.destination || !tripContext.departureDate) {
      return null;
    }
    
    setIsBooking(true);
    addMessage({
      type: 'assistant',
      content: '🔄 Fetching real-time pricing for your trip...',
      timestamp: new Date()
    });
    
    try {
      const pricingRequest = {
        transportType: tripContext.transportType || 'flight',
        origin: tripContext.origin,
        destination: tripContext.destination,
        departureDate: tripContext.departureDate,
        returnDate: tripContext.returnDate || undefined,
        adults: tripContext.groupSize || 1,
        hotelNeeded: !!tripContext.hotelNeeded,
        cabToStationNeeded: !!tripContext.cabToStationNeeded,
        cabToHotelNeeded: !!tripContext.cabToHotelNeeded
      };
      
      const response = await fetch('/api/real-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricingRequest)
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Update the right panel data with real-time pricing
        const updatedPlanData = {
          ...rightPanelData,
          transport: result.data.transport,
          returnTransport: result.data.returnTransport,
          hotel: result.data.hotel,
          cabToStation: result.data.cabToStation,
          cabToHotel: result.data.cabToHotel,
          total: result.data.total
        };
        
        setRightPanelData(updatedPlanData);
        
        addMessage({
          type: 'assistant',
          content: `✅ Real-time pricing updated!\n\nTotal Amount: ₹${result.data.total.toLocaleString()}`,
          timestamp: new Date()
        });
        
        return updatedPlanData;
      } else {
        addMessage({
          type: 'assistant',
          content: `⚠️ Couldn't fetch real-time pricing: ${result.message || 'Unknown error'}. Using estimated pricing instead.`,
          timestamp: new Date()
        });
        return rightPanelData;
      }
    } catch (error: any) {
      addMessage({
        type: 'assistant',
        content: `⚠️ Error fetching real-time pricing: ${error.message || 'Unknown error'}. Using estimated pricing instead.`,
        timestamp: new Date()
      });
      return rightPanelData;
    } finally {
      setIsBooking(false);
    }
  };

  const handleBooking = async () => {
    if (!rightPanelData || !isFinalPlan) return;
    
    setIsBooking(true);
    try {
      // First get real-time pricing
      const updatedPlanData = await fetchRealTimePricing() || rightPanelData;
      
      // For demo purposes, we'll use mock user details
      // In a real app, you'd collect this from a form
      const bookingRequest = {
        tripPlan: updatedPlanData,
        userDetails: {
          name: "Demo User",
          email: "demo@example.com",
          phone: "+91-9876543210",
          passengers: [{
            firstName: "Demo",
            lastName: "User",
            dateOfBirth: "1990-01-01",
            passportNumber: "A12345678"
          }]
        },
        context: tripContext // Pass the full trip context for reference
      };

      // Use the Stripe checkout API instead of direct booking
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingRequest)
      });

      const result = await response.json();

      if (result.success && result.checkoutUrl) {
        // Update trip context with session ID
        setTripContext(prev => ({
          ...prev,
          stripeSessionId: result.sessionId
        }));
        
        addMessage({
          type: 'assistant',
          content: `🛒 Your trip is ready for checkout! You'll be redirected to our secure payment page to complete your booking.\n\nTotal Amount: ₹${updatedPlanData.total?.toLocaleString() || 'Calculating...'}`,
          timestamp: new Date()
        });
        
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance("You'll be redirected to our secure payment page to complete your booking.");
          window.speechSynthesis.speak(utterance);
        }
        
        // Redirect to Stripe checkout
        window.location.href = result.checkoutUrl;
      } else {
        addMessage({
          type: 'assistant',
          content: `❌ Checkout failed: ${result.message || 'Unable to create checkout session'}`,
          timestamp: new Date()
        });
      }
    } catch (error: any) {
      addMessage({
        type: 'assistant',
        content: `❌ Checkout error: ${error.message || 'Something went wrong during checkout.'}`,
        timestamp: new Date()
      });
    } finally {
      setIsBooking(false);
    }
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
                    {/* Origin and Destination */}
                    {rightPanelData.transport && 'departureAirportIata' in rightPanelData.transport && <p><strong>From:</strong> {rightPanelData.transport.departureAirportIata}</p>}
                    {rightPanelData.transport && 'arrivalAirportIata' in rightPanelData.transport && <p><strong>To:</strong> {rightPanelData.transport.arrivalAirportIata}</p>}
                    {rightPanelData.transport && 'departureCity' in rightPanelData.transport && <p><strong>From:</strong> {rightPanelData.transport.departureCity}</p>}
                    {rightPanelData.transport && 'arrivalCity' in rightPanelData.transport && <p><strong>To:</strong> {rightPanelData.transport.arrivalCity}</p>}
                    <hr/>
                    
                    {/* Transport Details */}
                    {rightPanelData.transportType === 'flight' && rightPanelData.transport && 'airline' in rightPanelData.transport && (
                      <p><strong>Flight:</strong> {rightPanelData.transport.airline} - ₹{rightPanelData.transport.price.toLocaleString()}</p>
                    )}
                    {rightPanelData.transportType === 'train' && rightPanelData.transport && 'trainName' in rightPanelData.transport && (
                      <p><strong>Train:</strong> {rightPanelData.transport.trainName} ({rightPanelData.transport.trainNumber}) - ₹{rightPanelData.transport.price.toLocaleString()}</p>
                    )}
                    {rightPanelData.transportType === 'bus' && rightPanelData.transport && 'operator' in rightPanelData.transport && (
                      <p><strong>Bus:</strong> {rightPanelData.transport.operator} - ₹{rightPanelData.transport.price.toLocaleString()}</p>
                    )}
                    
                    {/* Return Transport Details */}
                    {rightPanelData.returnTrip && rightPanelData.returnTransport && 'airline' in rightPanelData.returnTransport && (
                      <p><strong>Return Flight:</strong> {rightPanelData.returnTransport.airline} - ₹{rightPanelData.returnTransport.price.toLocaleString()}</p>
                    )}
                    {rightPanelData.returnTrip && rightPanelData.returnTransport && 'trainName' in rightPanelData.returnTransport && (
                      <p><strong>Return Train:</strong> {rightPanelData.returnTransport.trainName} ({rightPanelData.returnTransport.trainNumber}) - ₹{rightPanelData.returnTransport.price.toLocaleString()}</p>
                    )}
                    {rightPanelData.returnTrip && rightPanelData.returnTransport && 'operator' in rightPanelData.returnTransport && (
                      <p><strong>Return Bus:</strong> {rightPanelData.returnTransport.operator} - ₹{rightPanelData.returnTransport.price.toLocaleString()}</p>
                    )}
                    
                    {/* Hotel Details */}
                    {rightPanelData.hotel && <p><strong>Hotel:</strong> {rightPanelData.hotel.name} - ₹{rightPanelData.hotel.price.toLocaleString()}/night</p>}
                    <hr/>
                    
                    {/* Transportation Details */}
                    {rightPanelData.cabToStation && <p><strong>Cab to {rightPanelData.transportType === 'flight' ? 'Airport' : rightPanelData.transportType === 'train' ? 'Train Station' : 'Bus Station'}:</strong> ₹{rightPanelData.cabToStation.price.toLocaleString()}</p>}
                    {rightPanelData.cabToHotel && <p><strong>Cab to Hotel:</strong> ₹{rightPanelData.cabToHotel.price.toLocaleString()}</p>}
                    <hr/>
                    
                    {/* Total Cost */}
                    {rightPanelData.total != null && <p className="text-base font-bold mt-2">Total Est. Cost: ₹{rightPanelData.total.toLocaleString()}</p>}
                    
                    {/* Booking Button */}
                    <button 
                      onClick={handleBooking}
                      disabled={isBooking}
                      className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      {isBooking ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Booking...
                        </>
                      ) : (
                        <>
                          <i className="ri-check-line"></i>
                          Book This Trip
                        </>
                      )}
                    </button>
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
    <h4 className="font-semibold text-gray-700 mb-2">Choose a {tripContext.returnTrip && tripContext.flight ? 'Return ' : ''}Flight</h4>
    {rightPanelData.availableFlights.map((flight) => (
      <FlightCard
        key={flight.id}
        flight={flight}
        onSelect={() => handleOptionSelect('flight', flight)}
      />
    ))}
  </div>
)}

{rightPanelData.availableTrains && (
  <div>
    <h4 className="font-semibold text-gray-700 mb-2">Choose a {tripContext.returnTrip && tripContext.train ? 'Return ' : ''}Train</h4>
    {rightPanelData.availableTrains.map((train) => (
      <div key={train.id} className="bg-white p-3 rounded-lg border border-gray-200 mb-3 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-bold">{train.trainName} ({train.trainNumber})</p>
            <p className="text-sm text-gray-600">{train.trainType} - {train.trainClass}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm">{train.departureTime}</span>
              <span className="text-xs text-gray-500">→</span>
              <span className="text-sm">{train.arrivalTime}</span>
              <span className="text-xs text-gray-500 ml-2">{train.duration}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-violet-700">₹{train.price.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{train.availableSeats} seats left</p>
            <button 
              onClick={() => handleOptionSelect('train', train)}
              className="mt-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold py-1 px-3 rounded transition-colors"
            >
              Select
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
)}

{rightPanelData.availableBuses && (
  <div>
    <h4 className="font-semibold text-gray-700 mb-2">Choose a {tripContext.returnTrip && tripContext.bus ? 'Return ' : ''}Bus</h4>
    {rightPanelData.availableBuses.map((bus) => (
      <div key={bus.id} className="bg-white p-3 rounded-lg border border-gray-200 mb-3 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-bold">{bus.operator}</p>
            <p className="text-sm text-gray-600">{bus.busType}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm">{bus.departureTime}</span>
              <span className="text-xs text-gray-500">→</span>
              <span className="text-sm">{bus.arrivalTime}</span>
              <span className="text-xs text-gray-500 ml-2">{bus.duration}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-violet-700">₹{bus.price.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{bus.availableSeats} seats left</p>
            <button 
              onClick={() => handleOptionSelect('bus', bus)}
              className="mt-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold py-1 px-3 rounded transition-colors"
            >
              Select
            </button>
          </div>
        </div>
      </div>
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
