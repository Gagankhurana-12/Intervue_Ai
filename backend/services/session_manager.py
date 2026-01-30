"""
Session Manager - Handles conversation sessions and history
"""

import uuid
from datetime import datetime
from typing import Dict, List, Optional
import threading
import time

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, Dict] = {}
        self.lock = threading.Lock()
        
        # Start cleanup thread
        self.cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self.cleanup_thread.start()
    
    def create_session(self, mode: str = 'chat', config: Dict = None) -> str:
        """Create a new session"""
        if config is None:
            config = {}
        
        session_id = str(uuid.uuid4())
        
        session = {
            'session_id': session_id,
            'mode': mode,
            'conversation_history': [],
            'mode_specific_data': self._initialize_mode_data(mode, config),
            'created_at': datetime.now().timestamp(),
            'last_activity': datetime.now().timestamp()
        }
        
        with self.lock:
            self.sessions[session_id] = session
        
        return session_id
    
    def get_session(self, session_id: str) -> Optional[Dict]:
        """Get session by ID"""
        with self.lock:
            return self.sessions.get(session_id)
    
    def add_message(self, session_id: str, role: str, text: str):
        """Add message to conversation history"""
        with self.lock:
            session = self.sessions.get(session_id)
            if not session:
                return
            
            session['conversation_history'].append({
                'role': role,
                'text': text,
                'timestamp': datetime.now().timestamp()
            })
            
            session['last_activity'] = datetime.now().timestamp()
            
            # Keep only last 30 messages
            if len(session['conversation_history']) > 30:
                session['conversation_history'] = session['conversation_history'][-30:]
    
    def change_mode(self, session_id: str, new_mode: str, config: Dict = None):
        """Change session mode"""
        if config is None:
            config = {}
        
        with self.lock:
            session = self.sessions.get(session_id)
            if not session:
                return
            
            session['mode'] = new_mode
            session['mode_specific_data'] = self._initialize_mode_data(new_mode, config)
            session['last_activity'] = datetime.now().timestamp()
    
    def update_mode_data(self, session_id: str, mode_data: Dict):
        """Update mode-specific data"""
        with self.lock:
            session = self.sessions.get(session_id)
            if not session:
                return
            
            session['mode_specific_data'].update(mode_data)
    
    def _initialize_mode_data(self, mode: str, config: Dict) -> Dict:
        """Initialize mode-specific data"""
        if mode == 'interview':
            return {
                'role': config.get('role', 'Software Engineer'),
                'company': config.get('company', 'Tech Company'),
                'question_index': 0,
                'total_questions': config.get('totalQuestions', 5),
                'scores': [],
                'evaluations': []
            }
        elif mode == 'debate':
            return {
                'topic': config.get('topic', 'AI in society'),
                'stance': config.get('stance', 'pro'),
                'arguments_made': [],
                'counter_arguments': []
            }
        else:  # chat
            return {
                'user_preferences': config.get('preferences', {}),
                'emotional_tone': 'friendly'
            }
    
    def delete_session(self, session_id: str):
        """Delete a session"""
        with self.lock:
            if session_id in self.sessions:
                del self.sessions[session_id]
    
    def cleanup_old_sessions(self, max_age: int = 3600):
        """Clean up old inactive sessions"""
        now = datetime.now().timestamp()
        
        with self.lock:
            session_ids_to_delete = []
            
            for session_id, session in self.sessions.items():
                if now - session['last_activity'] > max_age:
                    session_ids_to_delete.append(session_id)
            
            for session_id in session_ids_to_delete:
                del self.sessions[session_id]
                print(f'Cleaned up old session: {session_id}')
    
    def _cleanup_loop(self):
        """Background thread to cleanup old sessions"""
        while True:
            time.sleep(600)  # Run every 10 minutes
            self.cleanup_old_sessions()
