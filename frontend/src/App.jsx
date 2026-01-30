import { useState } from 'react';
import VideoCallInterface from './components/VideoCallInterface';
import WelcomeScreen from './components/WelcomeScreen';
import './App.css';

function App() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [initialMode, setInitialMode] = useState('chat');
  const [initialConfig, setInitialConfig] = useState({});

  const handleStartCall = (mode, config) => {
    setInitialMode(mode);
    setInitialConfig(config);
    setIsCallActive(true);
  };

  const handleEndCall = () => {
    setIsCallActive(false);
  };

  return (
    <div className="app">
      {!isCallActive ? (
        <WelcomeScreen onStartCall={handleStartCall} />
      ) : (
        <VideoCallInterface 
          initialMode={initialMode}
          initialConfig={initialConfig}
          onEndCall={handleEndCall}
        />
      )}
    </div>
  );
}

export default App;
