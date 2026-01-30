import { useState, useEffect, useRef } from 'react';
import WebSocketService from '../services/WebSocketService';
import UserVideoPanel from './UserVideoPanel';
import AIAvatarPanel from './AIAvatarPanel';
import ControlPanel from './ControlPanel';
import TranscriptDisplay from './TranscriptDisplay';
import './VideoCallInterface.css';

const WS_URL = 'ws://localhost:3001';

function VideoCallInterface({ initialMode, initialConfig, onEndCall }) {
  const [ws, setWs] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [mode, setMode] = useState(initialMode);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [aiStatus, setAiStatus] = useState('idle'); // idle, listening, thinking, speaking
  const [currentAiAudio, setCurrentAiAudio] = useState(null);
  const [currentVideoData, setCurrentVideoData] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const recognitionRef = useRef(null);

  // Initialize Web Speech API for STT
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        console.log('Speech recognition started');
        setAiStatus('listening');
      };
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognized:', transcript);
        
        // Add to transcript
        setTranscript(prev => [...prev, {
          role: 'user',
          text: transcript,
          timestamp: Date.now()
        }]);
        
        setAiStatus('thinking');
        
        // Send to backend for AI response
        if (ws && ws.isConnected) {
          ws.sendMessage(transcript);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setAiStatus('idle');
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      console.warn('Web Speech API not supported in this browser');
      alert('Speech recognition not supported. Please use Chrome or Edge.');
    }
  }, [ws]);


  // Initialize WebSocket connection
  useEffect(() => {
    // Use singleton WebSocket service
    const wsService = WebSocketService.getInstance(WS_URL);

    // Clear any previously registered listeners to prevent duplicates
    wsService.offAll('session-ready');
    wsService.offAll('ai-response');
    wsService.offAll('ai-thinking');
    wsService.offAll('mode-changed');
    wsService.offAll('ai-stopped');
    wsService.offAll('error');
    wsService.offAll('connect');
    wsService.offAll('disconnect');

    // Only connect if not already connected
    if (!wsService.isConnected) {
      wsService.connect().then(() => {
        console.log('WebSocket service connected');
        setWs(wsService);
        setIsConnected(true);

        // Initialize session
        wsService.initSession(initialMode, initialConfig);
      }).catch(error => {
        console.error('Failed to connect WebSocket:', error);
        setIsConnected(false);
      });
    } else {
      // Already connected, just set the service
      setWs(wsService);
      setIsConnected(true);
      // Reinitialize session for this component instance
      wsService.initSession(initialMode, initialConfig);
    }

    // Register handlers (fresh, no duplicates)
    wsService.on('session-ready', (data) => {
      console.log('Session ready:', data);
      setSessionId(data.sessionId);
      setMode(data.mode);
    });

    wsService.on('ai-response', (data) => {
      console.log('AI response:', data.text);
      setAiStatus('speaking');

      // Add to transcript
      setTranscript(prev => [...prev, {
        role: 'ai',
        text: data.text,
        timestamp: data.timestamp
      }]);

      // Play audio using Web Speech API
      playAiResponse(data.text);
    });

    wsService.on('ai-thinking', (data) => {
      console.log('AI thinking...');
      setAiStatus('thinking');
    });

    wsService.on('mode-changed', (data) => {
      console.log('Mode changed to:', data.mode);
      setMode(data.mode);
      
      // Add transition message to transcript
      setTranscript(prev => [...prev, {
        role: 'system',
        text: `Mode changed to ${data.mode}`,
        timestamp: Date.now()
      }]);
    });

    wsService.on('ai-stopped', (data) => {
      console.log('AI stopped');
      setAiStatus('idle');
    });

    wsService.on('error', (data) => {
      console.error('WebSocket error:', data);
      alert(`Error: ${data.message}`);
    });

    wsService.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    wsService.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    // Cleanup: Remove listeners on unmount
    return () => {
      wsService.offAll('session-ready');
      wsService.offAll('ai-response');
      wsService.offAll('ai-thinking');
      wsService.offAll('mode-changed');
      wsService.offAll('ai-stopped');
      wsService.offAll('error');
      wsService.offAll('connect');
      wsService.offAll('disconnect');
    };
  }, []); // Empty dependency array - only run once on mount

  // Play AI response using Web Speech API
  const playAiResponse = (text) => {
    // Stop any current speech
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.90; // Slower, more natural human speech rate (default is 1.0)
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use a natural voice
    const voices = synthRef.current.getVoices();
    const naturalVoice = voices.find(voice => 
      voice.name.includes('Natural') || 
      voice.name.includes('Premium') ||
      voice.lang.startsWith('en')
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onend = () => {
      setAiStatus('idle');
      setCurrentAiAudio(null);
      // Clear video after speaking
      setTimeout(() => setCurrentVideoData(null), 500);
    };

    synthRef.current.speak(utterance);
    setCurrentAiAudio(utterance);
  };

  // Start/stop recording using Web Speech API
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not available. Please use Chrome or Edge.');
      return;
    }

    if (!isRecording) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        alert('Could not start speech recognition. Please check microphone permissions.');
      }
    } else {
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Change mode
  const handleModeChange = (newMode) => {
    if (ws && ws.isConnected) {
      const config = {};
      
      if (newMode === 'interview') {
        config.role = 'Software Engineer';
        config.company = 'Tech Company';
        config.total_questions = 5;
      } else if (newMode === 'debate') {
        config.topic = 'AI in society';
        config.stance = 'pro';
      }
      
      ws.changeMode(newMode, config);
    }
  };

  // Stop AI speaking
  const stopAiSpeaking = () => {
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }
    if (ws && ws.isConnected) {
      ws.stopAI();
    }
    setAiStatus('idle');
  };

  // End call
  const handleEndCall = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }
    if (ws) {
      ws.disconnect();
    }
    onEndCall();
  };

  return (
    <div className="video-call-interface">
      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
        <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
      </div>

      <div className="video-panels">
        <UserVideoPanel 
          isRecording={isRecording}
          isMuted={isMuted}
        />
        <AIAvatarPanel 
          status={aiStatus}
          mode={mode}
          videoData={currentVideoData}
        />
      </div>

      <TranscriptDisplay 
        transcript={transcript}
        aiStatus={aiStatus}
      />

      <ControlPanel
        mode={mode}
        isRecording={isRecording}
        isMuted={isMuted}
        aiStatus={aiStatus}
        onToggleRecording={toggleRecording}
        onToggleMute={toggleMute}
        onModeChange={handleModeChange}
        onStopAi={stopAiSpeaking}
        onEndCall={handleEndCall}
      />
    </div>
  );
}

export default VideoCallInterface;
