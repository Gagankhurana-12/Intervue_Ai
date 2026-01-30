import { Bot, Loader } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import './AIAvatarPanel.css';

function AIAvatarPanel({ status, mode, videoData }) {
  useEffect(() => {
    if (videoData) {
      console.log('Video data received, length:', videoData.length);
    }
  }, [videoData]);

  const getModeColor = () => {
    switch (mode) {
      case 'chat': return '#4CAF50';
      case 'interview': return '#2196F3';
      case 'debate': return '#FF9800';
      default: return '#667eea';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'listening': return 'Listening...';
      case 'thinking': return 'Thinking...';
      case 'speaking': return 'Speaking...';
      default: return 'Ready';
    }
  };

  return (
    <div className="ai-avatar-panel">
      <div className="panel-header">
        <Bot size={20} />
        <span>AI Partner</span>
        <div className="mode-badge" style={{ background: getModeColor() }}>
          {mode}
        </div>
      </div>
      
      <div className="avatar-container">
        {videoData ? (
          <video
            key={videoData}
            src={`data:video/mp4;base64,${videoData}`}
            autoPlay
            muted={false}
            playsInline
            className="avatar-video"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onLoadedData={(e) => {
              console.log('Video loaded, duration:', e.target.duration);
              e.target.play();
            }}
            onError={(e) => console.error('Video error:', e)}
          />
        ) : (
          <div className={`avatar ${status}`} style={{ '--mode-color': getModeColor() }}>
            <Bot size={80} className="avatar-icon" />
          
          {status === 'thinking' && (
            <div className="thinking-indicator">
              <Loader className="spinner" size={24} />
            </div>
          )}
          
          {status === 'speaking' && (
            <div className="sound-waves">
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="wave"></div>
            </div>
          )}
          
          {status === 'listening' && (
            <div className="listening-pulse"></div>
          )}
          </div>
        )}
        
        <div className="status-text">
          {getStatusText()}
        </div>
      </div>
    </div>
  );
}

export default AIAvatarPanel;
