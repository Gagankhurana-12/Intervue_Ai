import { useEffect, useRef } from 'react';
import { User, Bot } from 'lucide-react';
import './TranscriptDisplay.css';

function TranscriptDisplay({ transcript, aiStatus }) {
  const transcriptEndRef = useRef(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="transcript-display">
      <div className="transcript-header">
        <h3>Conversation Transcript</h3>
        {aiStatus !== 'idle' && (
          <div className="live-indicator">
            <div className="live-dot" />
            <span>Live</span>
          </div>
        )}
      </div>

      <div className="transcript-messages">
        {transcript.length === 0 ? (
          <div className="empty-state">
            <Bot size={48} />
            <p>Start talking to begin the conversation...</p>
          </div>
        ) : (
          transcript.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-icon">
                {message.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-sender">
                    {message.role === 'user' ? 'You' : 'AI Partner'}
                  </span>
                  <span className="message-time">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <div className="message-text">{message.text}</div>
              </div>
            </div>
          ))
        )}
        <div ref={transcriptEndRef} />
      </div>
    </div>
  );
}

export default TranscriptDisplay;
