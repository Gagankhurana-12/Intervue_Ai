import { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, Video as VideoIcon } from 'lucide-react';
import './UserVideoPanel.css';

function UserVideoPanel({ isRecording, isMuted }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const startVideo = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false // Audio handled separately
        });

        if (mounted && videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        setError('Could not access camera');
      }
    };

    startVideo();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="user-video-panel">
      <div className="panel-header">
        <VideoIcon size={20} />
        <span>You</span>
      </div>
      
      <div className="video-container">
        {error ? (
          <div className="error-message">
            <VideoIcon size={48} />
            <p>{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="video-element"
          />
        )}
        
        <div className="video-indicators">
          {isRecording && (
            <div className="recording-indicator">
              <div className="recording-dot" />
              <span>Recording</span>
            </div>
          )}
          
          <div className={`mic-indicator ${isMuted ? 'muted' : ''}`}>
            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserVideoPanel;
