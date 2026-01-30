"""
AI Video Call Backend - Python FastAPI + WebSocket
Unified backend handling AI conversation and TTS
"""

import os
import sys
import base64
import uuid
import logging
from datetime import datetime
from typing import Dict, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import asyncio
import json

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import custom services
from services.session_manager import SessionManager
from services.groq_service import GroqService

# Initialize FastAPI app
app = FastAPI(title="AI Video Call Backend", version="1.0.0")

# CORS configuration
CORS_ORIGINS = os.getenv('FRONTEND_URL', 'http://localhost:5173').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
session_manager = SessionManager()
groq_service = GroqService()


# ============== REST API Endpoints ==============

@app.get('/health')
async def health_check():
    """Health check endpoint"""
    return {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'groq': groq_service.is_initialized()
        }
    }

@app.post('/api/session/start')
async def start_session(request: Request):
    """Create a new session"""
    data = await request.json()
    mode = data.get('mode', 'chat')
    config = data.get('config', {})
    
    session_id = session_manager.create_session(mode, config)
    
    return {
        'success': True,
        'sessionId': session_id,
        'mode': mode,
        'message': 'Session created successfully'
    }

@app.post('/api/session/{session_id}/mode')
async def change_session_mode(session_id: str, request: Request):
    """Change session mode"""
    data = await request.json()
    mode = data.get('mode')
    config = data.get('config', {})
    
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail='Session not found')
    
    session_manager.change_mode(session_id, mode, config)
    
    return {
        'success': True,
        'sessionId': session_id,
        'mode': mode,
        'message': f'Mode changed to {mode}'
    }

@app.get('/api/session/{session_id}/history')
async def get_session_history(session_id: str):
    """Get conversation history"""
    session = session_manager.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail='Session not found')
    
    return {
        'success': True,
        'history': session['conversation_history'],
        'mode': session['mode']
    }



# ============== WebSocket Event Handlers ==============

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.connection_sessions: Dict[str, str] = {}
    
    async def connect(self, websocket: WebSocket, connection_id: str):
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        logger.info(f'Client connected: {connection_id}')
    
    async def disconnect(self, connection_id: str):
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        
        if connection_id in self.connection_sessions:
            session_id = self.connection_sessions[connection_id]
            del self.connection_sessions[connection_id]
            logger.info(f'Cleaning up session: {session_id}')
        
        logger.info(f'Client disconnected: {connection_id}')
    
    async def send_json(self, connection_id: str, data: dict):
        if connection_id in self.active_connections:
            await self.active_connections[connection_id].send_json(data)

manager = ConnectionManager()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time communication"""
    await manager.connect(websocket, client_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get('type')
            
            if event_type == 'init-session':
                await handle_init_session(client_id, data)
            elif event_type == 'change-mode':
                await handle_change_mode(client_id, data)
            elif event_type == 'text-message':
                await handle_text_message(client_id, data)
            elif event_type == 'stop-ai':
                await handle_stop_ai(client_id)
            
    except WebSocketDisconnect:
        await manager.disconnect(client_id)
    except Exception as e:
        logger.error(f'WebSocket error: {e}')
        await manager.disconnect(client_id)

async def handle_init_session(client_id: str, data: dict):
    """Initialize a new session"""
    try:
        session_id = data.get('sessionId')
        mode = data.get('mode', 'chat')
        config = data.get('config', {})
        
        # Create or retrieve session
        if session_id and session_manager.get_session(session_id):
            pass  # Session already exists
        else:
            session_id = session_manager.create_session(mode, config)
        
        # Store session mapping
        manager.connection_sessions[client_id] = session_id
        
        logger.info(f'Session initialized: {session_id}, Mode: {mode}')
        
        # Generate greeting
        greeting = groq_service.generate_greeting(mode, config)
        audio_data = groq_service.text_to_speech(greeting['text'])
        
        # Add to history
        session_manager.add_message(session_id, 'ai', greeting['text'])
        
        # Send session ready
        await manager.send_json(client_id, {
            'type': 'session-ready',
            'sessionId': session_id,
            'mode': mode,
            'greeting': greeting['text']
        })
        
        # Send AI response
        await manager.send_json(client_id, {
            'type': 'ai-response',
            'text': greeting['text'],
            'audio': audio_data,
            'timestamp': int(datetime.now().timestamp() * 1000)
        })
        
    except Exception as e:
        logger.error(f'Error initializing session: {e}')
        await manager.send_json(client_id, {
            'type': 'error',
            'message': str(e)
        })

async def handle_change_mode(client_id: str, data: dict):
    """Change conversation mode"""
    try:
        if client_id not in manager.connection_sessions:
            await manager.send_json(client_id, {
                'type': 'error',
                'message': 'No active session'
            })
            return
        
        session_id = manager.connection_sessions[client_id]
        mode = data.get('mode')
        config = data.get('config', {})
        
        # Change mode
        session_manager.change_mode(session_id, mode, config)
        logger.info(f'Mode changed to: {mode}')
        
        # Generate transition message
        transition = groq_service.generate_mode_transition(mode, config)
        audio_data = groq_service.text_to_speech(transition['text'])
        
        # Add to history
        session_manager.add_message(session_id, 'ai', transition['text'])
        
        # Send mode changed
        await manager.send_json(client_id, {
            'type': 'mode-changed',
            'mode': mode,
            'message': transition['text']
        })
        
        # Send AI response
        await manager.send_json(client_id, {
            'type': 'ai-response',
            'text': transition['text'],
            'audio': audio_data,
            'timestamp': int(datetime.now().timestamp() * 1000)
        })
        
    except Exception as e:
        logger.error(f'Error changing mode: {e}')
        await manager.send_json(client_id, {
            'type': 'error',
            'message': str(e)
        })

async def handle_text_message(client_id: str, data: dict):
    """Handle text message from Web Speech API"""
    try:
        if client_id not in manager.connection_sessions:
            return
        
        session_id = manager.connection_sessions[client_id]
        text = data.get('text', '').strip()
        
        if not text:
            return
        
        logger.info(f'User said: {text}')
        
        # Add user message to history
        session_manager.add_message(session_id, 'user', text)
        
        # Get session context
        session = session_manager.get_session(session_id)
        
        # Send thinking status
        await manager.send_json(client_id, {
            'type': 'ai-thinking',
            'status': 'generating'
        })
        
        # Generate AI response
        ai_response = groq_service.generate_response(
            text,
            session['conversation_history'],
            session['mode'],
            session['mode_specific_data']
        )
        
        logger.info(f'AI response: {ai_response["text"]}')
        
        # Update mode-specific data if returned
        if ai_response.get('mode_data'):
            session_manager.update_mode_data(session_id, ai_response['mode_data'])
        
        # Convert to speech
        audio_data = groq_service.text_to_speech(ai_response['text'])
        
        # Add AI message to history
        session_manager.add_message(session_id, 'ai', ai_response['text'])
        
        # Send response
        await manager.send_json(client_id, {
            'type': 'ai-response',
            'text': ai_response['text'],
            'audio': audio_data,
            'modeData': ai_response.get('mode_data'),
            'timestamp': int(datetime.now().timestamp() * 1000)
        })
        
    except Exception as e:
        logger.error(f'Error processing text message: {e}')
        await manager.send_json(client_id, {
            'type': 'error',
            'message': 'Error processing your message',
            'error': str(e)
        })

async def handle_stop_ai(client_id: str):
    """Handle user interruption"""
    logger.info('User interrupted AI')
    await manager.send_json(client_id, {
        'type': 'ai-stopped'
    })

# ============== Startup ==============

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3001))
    
    
    logger.info('=' * 60)
    logger.info('🚀 AI Video Call Backend - Python Edition')
    logger.info('=' * 60)
    logger.info(f'📡 Server running on port {port}')
    logger.info(f'🌐 Frontend URL: {os.getenv("FRONTEND_URL", "http://localhost:5173")}')
    logger.info(f'🤖 Groq AI: {"✓ Enabled" if groq_service.is_initialized() else "✗ Disabled"}')
    logger.info('=' * 60)
    
    # Run FastAPI server
    import uvicorn
    uvicorn.run(
        app,
        host='0.0.0.0',
        port=port,
        log_level='info' if not os.getenv('DEBUG', 'False').lower() == 'true' else 'debug'
    )

