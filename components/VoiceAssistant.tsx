'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface VoiceAssistantProps {
  isActive: boolean;
  onClose: () => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
}

// Remembered trip‐booking context
type TripContext = {
  from?: string;
  to?: string;
  date?: string;
  budget?: string;
  groupSize?: string;
  mode?: string;
};

type Message = {
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

// The shape of your /api/book-trip response
interface TripResponse {
  assistantFollowUp?: boolean;
  ask?: keyof TripContext;
  context?: TripContext;
  success?: boolean;
  message?: string;
  from?: string;
  to?: string;
  data?: {
    cabToStation: { price: number };
    transport: { mode: string; price: number; name?: string };
    cabToHotel: { price: number };
    hotel: { name: string; price: number };
    food?: string[];
    total: number;
  };
  error?: string;
}

export default function VoiceAssistant({
  isActive,
  onClose,
  isListening,
  setIsListening,
}: VoiceAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [context, setContext] = useState<TripContext>({});
  const [fallbackInput, setFallbackInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const sendCommand = async (command: string) => {
    if (!command.trim() || isProcessing) return;

    // Append user message
    addMessage({ type: 'user', content: command, timestamp: new Date() });
    setFallbackInput('');
    setIsProcessing(true);

    try {
      const res = await fetch('/api/book-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: command, context }),
      });
      const result: TripResponse = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Server error');
      }

      // If assistant is asking a follow‐up question
      if (result.assistantFollowUp && result.context && result.ask) {
        // Save updated context
        setContext(result.context);

        // Show the follow-up prompt
        addMessage({
          type: 'assistant',
          content: result.message || '',
          timestamp: new Date(),
        });
      }
      // Final trip plan
      else if (result.success && result.data) {
        const { from, to, message, data } = result;

        // Build a friendly summary if API didn't send `message`
        const summary =
          message ||
          `Here’s your trip plan from ${from} to ${to}:\n` +
            `• Cab to station: ₹${data.cabToStation.price}\n` +
            `• ${data.transport.mode}: ₹${data.transport.price}\n` +
            `• Cab to hotel: ₹${data.cabToHotel.price}\n` +
            `• Hotel (${data.hotel.name}): ₹${data.hotel.price}/night\n` +
            `${data.food ? `• Restaurants: ${data.food.join(', ')}\n` : ''}` +
            `Total: ₹${data.total}\n\nShall I proceed with booking?`;

        addMessage({ type: 'assistant', content: summary, timestamp: new Date() });

        // Reset context for a fresh session
        setContext({});
      } else {
        // Unexpected: neither followUp nor success
        throw new Error('Unexpected response from server');
      }

      // Speak out the assistant’s reply
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
          (result.message as string) ?? ''
        );
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      addMessage({
        type: 'assistant',
        content: err.message || 'Something went wrong. Please try again.',
        timestamp: new Date(),
      });
    } finally {
      setIsProcessing(false);
      setIsListening(false);
    }
  };

  // Kick off Web Speech API
  const startListening = () => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice commands require Chrome or Edge.');
      return;
    }

    const recog: SpeechRecognition = new SpeechRecognition();
    recognitionRef.current = recog;
    recog.lang = 'en-US';
    recog.interimResults = false;
    recog.maxAlternatives = 1;

    setIsListening(true);
    recog.start();

    recog.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      sendCommand(transcript);
    };

    recog.onerror = () => {
      setIsListening(false);
    };

    recog.onend = () => {
      setIsListening(false);
    };
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendCommand(fallbackInput);
    }
  };

  if (!isActive) return null;

  return (
    <aside
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="flex h-[90vh] max-h-[700px] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-purple-600 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30">
              <i className="ri-robot-2-line text-2xl" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Tripy AI Assistant</h2>
              <p className="text-sm text-violet-200">Your travel buddy</p>
            </div>
          </div>
          <button
            onClick={() => {
              recognitionRef.current?.stop();
              onClose();
            }}
            aria-label="Close assistant"
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/20"
          >
            <i className="ri-close-line text-2xl" aria-hidden="true" />
          </button>
        </header>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {!messages.length && (
            <div className="flex h-full flex-col items-center justify-center text-gray-500">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100">
                <i className="ri-mic-line text-4xl text-violet-600" aria-hidden="true" />
              </div>
              <p className="text-lg font-medium">Ready to assist you!</p>
              <p className="text-sm">Tap the mic or type below to start.</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                role="log"
                aria-live="polite"
                className={`max-w-md whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.type === 'user'
                    ? 'bg-violet-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-none bg-gray-100 px-4 py-3 text-gray-800">
                <span className="h-2 w-2 animate-bounce rounded-full bg-violet-600" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-violet-600 delay-150" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-violet-600 delay-300" />
                <span className="ml-2 text-sm">Tripy is thinking...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Controls */}
        <footer className="flex-shrink-0 border-t border-gray-200 p-4">
          <div className="flex items-center gap-4">
            {/* Mic Button */}
            <button
              onClick={startListening}
              disabled={isListening || isProcessing}
              aria-label={isListening ? 'Stop listening' : 'Start listening'}
              className={`flex h-16 w-16 items-center justify-center rounded-full transition transform duration-300 hover:scale-110 ${
                isListening
                  ? 'animate-pulse bg-red-500 text-white'
                  : 'bg-violet-600 text-white hover:bg-violet-700'
              } ${isProcessing ? 'cursor-not-allowed bg-gray-400 opacity-50' : ''}`}
            >
              <i
                className={`text-3xl ${isListening ? 'ri-mic-off-fill' : 'ri-mic-fill'}`}
                aria-hidden="true"
              />
            </button>

            {/* Text Fallback */}
            <div className="flex flex-1 items-center gap-3">
              <input
                type="text"
                value={fallbackInput}
                onChange={(e) => setFallbackInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isProcessing}
                placeholder='Type "Book a trip to Manali"'
                aria-label="Type your command"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
              <button
                onClick={() => sendCommand(fallbackInput)}
                disabled={!fallbackInput.trim() || isProcessing}
                className="rounded-full bg-violet-600 px-4 py-2 text-white transition hover:bg-violet-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </footer>
      </div>
    </aside>
  );
}
