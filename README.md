# Intervue AI 🎤🤖

A real-time AI-powered voice & video practice platform to help users improve interview, debate, and conversational speaking skills by interacting with an AI in multiple modes.

---

Key highlights

- Real-time voice interaction using WebRTC + Web Speech API
- Live speech-to-text (STT) and text-to-speech (TTS)
- Context-aware responses powered by LLaMA (via Groq API)
- Three interaction modes: Interview, Debate, Casual Chat
- Designed for low-latency media (media stays in the browser) and backend AI reasoning

---

Table of contents

1. Project idea
2. Features
3. Tech stack
4. Repository structure
5. Architecture & flow
6. Prerequisites
7. Quick start (local)
8. Environment variables
9. Use cases & future improvements
10. Contributing
11. License & author

---

## 1) Project idea

Intervue AI simulates realistic spoken conversations with an AI-powered partner to help users practice and improve real-time communication skills — focusing on interview-style coaching, debate training, and casual conversation practice.

Problems it addresses

- Interview confidence and preparation
- Clarity in expressing ideas under pressure
- Real-time conversational skills and fluency

## 2) Features

- 🎙️ Real-time audio/video using WebRTC
- 📝 Live speech-to-text transcription (STT)
- 🔊 AI text-to-speech (TTS) replies
- 🧠 Context-aware AI responses with LLaMA via Groq
- 🔁 Multiple interaction modes: Interview, Debate, Casual Chat

## 3) Tech stack

- Frontend: React + Vite, WebRTC, Web Speech API, (Tailwind CSS optional)
- Backend: Python (FastAPI suggested by structure), Uvicorn
- AI: LLaMA via Groq API (or swap in other LLMs)

## 4) Repository structure

Top-level layout (simplified):

```
intervue-ai/
├── backend/            # FastAPI backend (AI services, session handling)
│   ├── main.py         # App entrypoint
│   ├── requirements.txt
│   └── services/
│       └── groq_service.py   # LLaMA integration
│
├── frontend/           # React + Vite frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   └── services/
│   │       └── WebSocketService.js
│   └── package.json
```

## 5) Architecture & flow

1. User opens the frontend in a browser.
2. Browser captures microphone (and camera) via getUserMedia + WebRTC.
3. Speech is transcribed locally with the Web Speech API (STT).
4. Transcribed text (or events) are sent to the backend via WebSocket/HTTP.
5. Backend calls the LLM (LLaMA via Groq) and returns AI responses.
6. Frontend converts AI text to speech (TTS) and plays it to the user.

Design note: media stays in the browser where possible for privacy and latency; the backend handles model calls and session coordination.

## 6) Prerequisites

- Node.js 16+ and npm or yarn
- Python 3.9+
- Modern browser (Chrome, Edge, Firefox) with WebRTC & Web Speech API support
- Groq API key (or other LLM provider credentials) if you enable AI functionality

## 7) Quick start (local)

Run the backend and frontend in separate terminals.

Backend (from repo root):

```bash
cd backend
python3 -m venv .venv    # optional but recommended
source .venv/bin/activate
pip install -r requirements.txt
# Run the server (example using uvicorn/FastAPI)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Frontend (from repo root):

```bash
cd frontend
npm install
npm run dev
# Vite serves at http://localhost:5173 by default
```

Open the frontend in the browser (default: http://localhost:5173). Allow camera & microphone access when prompted.

## 8) Environment variables

Create a `.env` file inside `backend/` or set environment variables in your deployment environment. Typical variables:

- GROQ_API_KEY=your_groq_api_key_here
- PORT=8000
- FLASK_ENV or FASTAPI_ENV=development

Note: Do not commit secrets. Use `.env.example` to document required keys.

## 9) Use cases & future improvements

Common use cases

- Mock interview practice
- Debate training and structured argument practice
- Conversation fluency and language learning

Planned / suggested improvements

- User profiles & progress tracking
- Automated feedback & scoring for interviews
- Multi-language STT/TTS support
- Emotion/tone analysis and adaptive prompts
- Session recording and playback


