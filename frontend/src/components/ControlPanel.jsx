import { Mic, MicOff, PhoneOff, X, MessageSquare, Users, Video } from 'lucide-react';
import './ControlPanel.css';

function ControlPanel({
  mode,
  isRecording,
  isMuted,
  aiStatus,
  onToggleRecording,
  onToggleMute,
  onModeChange,
  onStopAi,
  onEndCall
}) {
  const modes = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'interview', label: 'Interview', icon: Users },
    { id: 'debate', label: 'Debate', icon: Video }
  ];

  return (
    <div className="control-panel">
      <div className="mode-selector">
        <label>Mode:</label>
        <div className="mode-buttons">
          {modes.map(m => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                className={`mode-btn ${mode === m.id ? 'active' : ''}`}
                onClick={() => onModeChange(m.id)}
                disabled={aiStatus === 'speaking' || aiStatus === 'thinking'}
              >
                <Icon size={16} />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="main-controls">
        <button
          className={`control-btn record-btn ${isRecording ? 'recording' : ''}`}
          onClick={onToggleRecording}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
          <span>{isRecording ? 'Stop' : 'Talk'}</span>
        </button>

        <button
          className={`control-btn mute-btn ${isMuted ? 'muted' : ''}`}
          onClick={onToggleMute}
          disabled={!isRecording}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          <span>Mute</span>
        </button>

        {aiStatus === 'speaking' && (
          <button
            className="control-btn stop-btn"
            onClick={onStopAi}
            title="Stop AI"
          >
            <X size={24} />
            <span>Stop AI</span>
          </button>
        )}

        <button
          className="control-btn end-btn"
          onClick={onEndCall}
          title="End Call"
        >
          <PhoneOff size={24} />
          <span>End Call</span>
        </button>
      </div>
    </div>
  );
}

export default ControlPanel;
