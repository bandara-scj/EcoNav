import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface UseLiveAPIProps {
  onItineraryReady: (origin: string, destination: string, startDate: string, endDate: string, interests: string, modeOfTravel: string, accommodationPreference: string, pastTravelChoices: string) => void;
}

export function useLiveAPI({ onItineraryReady }: UseLiveAPIProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<Float32Array[]>([]);

  const initAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000, // Gemini output sample rate
      });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const playAudioChunk = (base64Audio: string) => {
    if (!audioContextRef.current) return;
    
    // Decode base64 to array buffer
    const binaryString = window.atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Convert PCM16 to Float32
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
    }
    
    const ctx = audioContextRef.current;
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    const currentTime = ctx.currentTime;
    if (nextPlayTimeRef.current < currentTime) {
      nextPlayTimeRef.current = currentTime;
    }
    
    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += buffer.duration;
    
    setIsSpeaking(true);
    source.onended = () => {
      if (ctx.currentTime >= nextPlayTimeRef.current - 0.1) {
        setIsSpeaking(false);
      }
    };
  };

  const startAudioProcessor = (stream: MediaStream, sessionPromise: Promise<any>) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
        }
        
        // Convert to base64
        const buffer = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < buffer.byteLength; i++) {
          binary += String.fromCharCode(buffer[i]);
        }
        const base64Data = window.btoa(binary);
        
        sessionPromise.then(session => {
          session.sendRealtimeInput({
            media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        });
      };
      
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0;
      
      source.connect(processor);
      processor.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      workletNodeRef.current = processor as any; // Store to prevent GC
    } catch (err) {
      console.error("Error starting audio processor:", err);
    }
  };

  const connect = async () => {
    setIsConnecting(true);
    setTranscript('');
    await initAudioContext();
    
    try {
      // Request microphone permission BEFORE connecting to prevent timeout
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        } 
      });
      mediaStreamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            startAudioProcessor(stream, sessionPromise);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              playAudioChunk(base64Audio);
            }
            
            // Handle interruption
            if (message.serverContent?.interrupted) {
              nextPlayTimeRef.current = 0;
              setIsSpeaking(false);
            }
            
            // Handle tool calls
            const toolCalls = message.toolCall?.functionCalls;
            if (toolCalls && toolCalls.length > 0) {
              for (const call of toolCalls) {
                if (call.name === 'generateItinerary') {
                  const args = call.args as any;
                  if (args) {
                    onItineraryReady(args.origin, args.destination, args.startDate, args.endDate, args.interests, args.modeOfTravel, args.accommodationPreference || 'Any Sustainable Accommodation', args.pastTravelChoices || '');
                    disconnect(); // Stop conversation once we have the info
                  }
                }
              }
            }
          },
          onclose: () => {
            setIsConnected(false);
            setIsConnecting(false);
            cleanupAudio();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setIsConnected(false);
            setIsConnecting(false);
            cleanupAudio();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are EcoNavigator, a friendly sustainable travel agent. Your goal is to gather 7 pieces of information from the user: 1) Where they are traveling from (origin), 2) Where they are traveling to (destination), 3) The start date of their trip, 4) The end date of their trip, 5) What their interests are, 6) Their mode of travel (e.g., Airbus A320, train, car), and 7) Their accommodation preference (e.g., Eco-Lodge, Carbon-Neutral Hotel, Sustainable Resort). Ask conversational questions to get this info. Once you have all 7 pieces of information, you MUST call the `generateItinerary` function with the gathered details. Format dates as YYYY-MM-DD if possible.",
          tools: [
            {
              functionDeclarations: [
                {
                  name: "generateItinerary",
                  description: "Call this function when you have gathered the user's origin, destination, start date, end date, interests, mode of travel, and accommodation preference.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      origin: { type: Type.STRING, description: "The city/country the user is traveling from" },
                      destination: { type: Type.STRING, description: "The city/country the user is traveling to" },
                      startDate: { type: Type.STRING, description: "The start date of the trip (YYYY-MM-DD)" },
                      endDate: { type: Type.STRING, description: "The end date of the trip (YYYY-MM-DD)" },
                      interests: { type: Type.STRING, description: "The user's interests or preferences for the trip" },
                      modeOfTravel: { type: Type.STRING, description: "The user's mode of travel (e.g., Airbus A320, train, car)" },
                      accommodationPreference: { type: Type.STRING, description: "The user's accommodation preference (e.g., Eco-Lodge, Carbon-Neutral Hotel)" },
                    },
                    required: ["origin", "destination", "startDate", "endDate", "interests", "modeOfTravel", "accommodationPreference"],
                  }
                }
              ]
            }
          ]
        },
      });
      
      sessionRef.current = sessionPromise;
    } catch (err) {
      console.error("Failed to connect to Live API:", err);
      setIsConnecting(false);
    }
  };

  const cleanupAudio = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    nextPlayTimeRef.current = 0;
  };

  const disconnect = () => {
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => session.close());
      sessionRef.current = null;
    }
    cleanupAudio();
    setIsConnected(false);
  };

  return {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    isSpeaking,
    transcript
  };
}
