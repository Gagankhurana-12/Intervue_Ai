# AI Video Call - Python Backend

Modern Python backend with FastAPI + WebSocket + Groq AI + Optional MuseTalk integration.

## 🚀 Quick Start

### 1. Setup Environment

```bash
cd backend

# Run setup script (creates venv, installs dependencies)
chmod +x setup.sh
./setup.sh

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows
```

### 2. Configure Environment Variables

Edit `.env` file:

```env
# Required: Your Groq API key (free from https://console.groq.com/)
GROQ_API_KEY=your_groq_api_key_here

# Server config
PORT=3001
FRONTEND_URL=http://localhost:5173

# Optional: Enable MuseTalk for lip-sync video (requires GPU + setup)
ENABLE_MUSETALK=false
```

### 3. Start the Server

```bash
python app.py
```

Server will start on `http://localhost:3001`

## 📁 Project Structure

```
backend/
├── app.py                      # Main Flask + Socket.IO server
├── services/
│   ├── session_manager.py      # Conversation session management
│   ├── groq_service.py         # Groq AI integration (LLM)
│   └── musetalk_service.py     # MuseTalk lip-sync (optional)
├── requirements.txt            # Python dependencies
├── .env                        # Environment configuration
└── setup.sh                    # Automated setup script
```

## 🔌 API Endpoints

### REST API

- `GET /health` - Health check
- `POST /api/session/start` - Create new session
- `POST /api/session/:id/mode` - Change conversation mode
- `GET /api/session/:id/history` - Get conversation history

### WebSocket Events

**Client → Server:**
- `init-session` - Initialize conversation session
- `change-mode` - Switch mode (chat/interview/debate)
- `text-message` - Send user message (from Web Speech API)
- `stop-ai` - Stop AI speech

**Server → Client:**
- `session-ready` - Session initialized with greeting
- `ai-response` - AI response with text + audio (+ video if MuseTalk enabled)
- `ai-thinking` - AI is generating response
- `mode-changed` - Mode switched successfully
- `error` - Error occurred

## 🤖 Features

### Core Features (Always Available)
- ✅ Real-time WebSocket communication with Socket.IO
- ✅ Groq AI for fast LLM responses (Llama 3.3 70B)
- ✅ Three conversation modes: Chat, Interview, Debate
- ✅ Session management with conversation history
- ✅ Web Speech API integration for STT (browser-based)
- ✅ Web Speech Synthesis for TTS (browser-based)

### Optional: MuseTalk (Lip-Sync Video)
- 🎬 Real-time lip-synced avatar video generation
- 🚀 30fps+ on GPU (10-15fps on CPU)
- 📦 Requires ~3GB model files + GPU recommended

## 🛠️ Development

### Installing New Dependencies

```bash
source venv/bin/activate
pip install package-name
pip freeze > requirements.txt
```

### Running in Debug Mode

```bash
# Set DEBUG=True in .env, then:
python app.py
```

### Testing WebSocket Connection

```javascript
// In browser console
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('Connected!'));
```

## 🎬 Enabling MuseTalk (Optional)

MuseTalk provides realistic lip-synced video but requires additional setup:

### Requirements
- NVIDIA GPU with 4GB+ VRAM (or CPU with patience)
- ~3GB of model files
- Additional Python packages

### Setup Steps

1. **Set environment variable:**
   ```bash
   # In .env
   ENABLE_MUSETALK=true
   ```

2. **Install MuseTalk dependencies:**
   ```bash
   # Uncomment MuseTalk section in requirements.txt
   pip install torch torchvision torchaudio transformers opencv-python
   ```

3. **Download models:**
   ```bash
   # Follow instructions in MUSETALK_SETUP.md
   cd ../musetalk_service
   ./setup.sh
   ```

4. **Restart server:**
   ```bash
   python app.py
   ```

See `MUSETALK_SETUP.md` for detailed instructions.

## 🔧 Troubleshooting

### Port 3001 already in use
```bash
# Find and kill process
lsof -i :3001
kill -9 <PID>

# Or use different port
PORT=3002 python app.py
```

### Groq API errors
- Check API key in `.env`
- Verify key at https://console.groq.com/keys
- Check rate limits (free tier is generous but has limits)

### Socket.IO connection fails
- Verify CORS settings in `.env`
- Check frontend is connecting to correct URL
- Ensure both frontend and backend are running

### MuseTalk not working
- Check `ENABLE_MUSETALK=true` in `.env`
- Verify models downloaded to `./models/`
- Check GPU availability with `nvidia-smi`
- Review logs for specific errors

## 📊 Performance

### Without MuseTalk (Default)
- **Latency**: ~100-300ms (Groq AI is extremely fast)
- **CPU Usage**: Low (~5-10%)
- **Memory**: ~100-200MB
- **Concurrent Users**: 100+ (depending on server)

### With MuseTalk (Optional)
- **Latency**: +200-500ms (video generation)
- **GPU Usage**: High during generation
- **Memory**: ~2-3GB (models loaded)
- **Concurrent Users**: Limited by GPU

## 🚀 Production Deployment

### Using Gunicorn

```bash
pip install gunicorn

# Run with Gunicorn
gunicorn --worker-class eventlet -w 1 app:app --bind 0.0.0.0:3001
```

### Using Docker

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "app.py"]
```

### Environment Variables for Production

```env
DEBUG=False
SECRET_KEY=<generate-strong-secret>
GROQ_API_KEY=<your-key>
FRONTEND_URL=https://your-domain.com
```

## 📝 Migration from Node.js

This Python backend is a **drop-in replacement** for the Node.js backend:

✅ **Same Socket.IO events** - Frontend works without changes
✅ **Same REST API** - Compatible with existing clients  
✅ **Same functionality** - All features preserved
✅ **Better MuseTalk integration** - Python native

### Switching Backends

**Stop Node.js backend:**
```bash
# In old backend directory
killall -9 node
```

**Start Python backend:**
```bash
cd backend
source venv/bin/activate
python app.py
```

Frontend connects automatically (no code changes needed).

## 📚 Additional Resources

- [Groq AI Documentation](https://console.groq.com/docs)
- [Flask-SocketIO Guide](https://flask-socketio.readthedocs.io/)
- [MuseTalk GitHub](https://github.com/TMElyralab/MuseTalk)

## 🤝 Support

For issues or questions:
1. Check logs: `python app.py` shows detailed logs
2. Review this README
3. Check `MUSETALK_SETUP.md` for video-specific issues
