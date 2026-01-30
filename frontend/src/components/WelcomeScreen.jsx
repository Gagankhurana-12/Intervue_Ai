import { useState } from 'react';
import { Video, MessageSquare, Users } from 'lucide-react';
import './WelcomeScreen.css';

function WelcomeScreen({ onStartCall }) {
  const [selectedMode, setSelectedMode] = useState('chat');
  const [config, setConfig] = useState({
    role: 'Software Engineer',
    company: 'Tech Company',
    totalQuestions: 5,
    topic: 'AI in society',
    stance: 'pro'
  });

  const modes = [
    {
      id: 'chat',
      title: 'Casual Chat',
      icon: MessageSquare,
      description: 'Natural, friendly conversation',
      color: '#4CAF50'
    },
    {
      id: 'interview',
      title: 'Interview Mode',
      icon: Users,
      description: 'Professional interview practice',
      color: '#2196F3'
    },
    {
      id: 'debate',
      title: 'Debate Mode',
      icon: Video,
      description: 'Intellectual debate on any topic',
      color: '#FF9800'
    }
  ];

  const handleStart = () => {
    onStartCall(selectedMode, config);
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-container">
        <h1 className="welcome-title">
          <Video className="title-icon" />
          AI Video Call Partner
        </h1>
        <p className="welcome-subtitle">
          Talk, interview, and debate with AI in real-time
        </p>

        <div className="mode-selection">
          <h2>Choose a Mode</h2>
          <div className="mode-grid">
            {modes.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  className={`mode-card ${selectedMode === mode.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMode(mode.id)}
                  style={{ '--mode-color': mode.color }}
                >
                  <Icon className="mode-icon" size={32} />
                  <h3>{mode.title}</h3>
                  <p>{mode.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {selectedMode === 'interview' && (
          <div className="config-panel">
            <h3>Interview Configuration</h3>
            <div className="config-grid">
              <div className="config-field">
                <label>Role</label>
                <input
                  type="text"
                  value={config.role}
                  onChange={(e) => setConfig({ ...config, role: e.target.value })}
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div className="config-field">
                <label>Company</label>
                <input
                  type="text"
                  value={config.company}
                  onChange={(e) => setConfig({ ...config, company: e.target.value })}
                  placeholder="e.g., Tech Company"
                />
              </div>
              <div className="config-field">
                <label>Number of Questions</label>
                <input
                  type="number"
                  value={config.totalQuestions}
                  onChange={(e) => setConfig({ ...config, totalQuestions: parseInt(e.target.value) })}
                  min="3"
                  max="10"
                />
              </div>
            </div>
          </div>
        )}

        {selectedMode === 'debate' && (
          <div className="config-panel">
            <h3>Debate Configuration</h3>
            <div className="config-grid">
              <div className="config-field">
                <label>Debate Topic</label>
                <input
                  type="text"
                  value={config.topic}
                  onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                  placeholder="e.g., AI in society"
                />
              </div>
              <div className="config-field">
                <label>AI's Stance</label>
                <select
                  value={config.stance}
                  onChange={(e) => setConfig({ ...config, stance: e.target.value })}
                >
                  <option value="pro">PRO (For)</option>
                  <option value="con">CON (Against)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <button className="start-button" onClick={handleStart}>
          <Video size={20} />
          Start Video Call
        </button>

        <div className="features-list">
          <div className="feature">✓ Real-time voice conversation</div>
          <div className="feature">✓ Live transcription</div>
          <div className="feature">✓ Human-like AI responses</div>
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;
