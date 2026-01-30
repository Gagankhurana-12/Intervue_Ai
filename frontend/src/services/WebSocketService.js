/**
 * WebSocket Service for FastAPI Backend Communication
 * Singleton pattern to ensure only one connection instance
 */

let instance = null;

class WebSocketService {
  constructor(url = 'ws://localhost:3001') {
    // Return existing instance if already created
    if (instance) {
      return instance;
    }

    this.url = url;
    this.ws = null;
    this.clientId = this.generateUUID();
    this.messageHandlers = {};
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    
    // Mark this as the singleton instance
    instance = this;
    return this;
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.url}/ws/${this.clientId}`;
        console.log('Connecting to:', wsUrl);
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✓ WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connect');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse message:', error, event.data);
          }
        };

        this.ws.onerror = (error) => {
          console.error('✗ WebSocket error:', error);
          this.emit('error', { message: 'WebSocket connection error' });
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('✗ WebSocket disconnected');
          this.isConnected = false;
          this.emit('disconnect');
          this.attemptReconnect();
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect after disconnect
   */
  attemptReconnect() {
    // Don't reconnect if we're in the middle of connecting
    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      return;
    }

    // Don't reconnect if already connected
    if (this.isConnected) {
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );
      
      // Keep the same clientId for reconnection
      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('reconnection-failed');
    }
  }

  /**
   * Handle incoming message from server
   */
  handleMessage(message) {
    const { type } = message;
    
    // Log for debugging
    console.log(`📨 Received: ${type}`, message);
    
    // Emit type-specific event (this will call the handlers)
    this.emit(type, message);
  }

  /**
   * Send message to server
   */
  send(data) {
    if (!this.isConnected) {
      console.error('WebSocket not connected');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(data));
      console.log(`📤 Sent: ${data.type}`, data);
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  // ============ Convenience Methods ============

  /**
   * Initialize a new session
   */
  initSession(mode = 'chat', config = {}, sessionId = null) {
    return this.send({
      type: 'init-session',
      sessionId,
      mode,
      config
    });
  }

  /**
   * Send text message
   */
  sendMessage(text) {
    return this.send({
      type: 'text-message',
      text
    });
  }

  /**
   * Change conversation mode
   */
  changeMode(mode, config = {}) {
    return this.send({
      type: 'change-mode',
      mode,
      config
    });
  }

  /**
   * Stop AI response
   */
  stopAI() {
    return this.send({
      type: 'stop-ai'
    });
  }

  // ============ Event Handling ============

  /**
   * Register handler for specific message type
   */
  on(type, callback) {
    if (!this.messageHandlers[type]) {
      this.messageHandlers[type] = [];
    }
    
    if (Array.isArray(this.messageHandlers[type])) {
      this.messageHandlers[type].push(callback);
    } else {
      // If it's a single handler, convert to array
      const existing = this.messageHandlers[type];
      this.messageHandlers[type] = [existing, callback];
    }
  }

  /**
   * Emit event internally
   */
  emit(event, data) {
    // Create custom event
    const customEvent = new CustomEvent(event, {
      detail: data
    });
    
    // Dispatch on window for global access
    window.dispatchEvent(customEvent);

    // Also call direct handlers if registered
    if (this.messageHandlers[event]) {
      const handlers = Array.isArray(this.messageHandlers[event])
        ? this.messageHandlers[event]
        : [this.messageHandlers[event]];
      
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Remove event listener by type and callback
   */
  off(event, callback) {
    if (!this.messageHandlers[event]) return;

    if (Array.isArray(this.messageHandlers[event])) {
      this.messageHandlers[event] = this.messageHandlers[event].filter(
        (handler) => handler !== callback
      );
      // If array is now empty, delete the event
      if (this.messageHandlers[event].length === 0) {
        delete this.messageHandlers[event];
      }
    } else if (this.messageHandlers[event] === callback) {
      delete this.messageHandlers[event];
    }
  }

  /**
   * Remove all listeners for an event type
   */
  offAll(event) {
    if (this.messageHandlers[event]) {
      delete this.messageHandlers[event];
    }
  }

  /**
   * Listen for global window events
   */
  addEventListener(type, callback) {
    window.addEventListener(type, (event) => {
      if (event.detail) {
        callback(event.detail);
      }
    });
  }

  // ============ Utility Methods ============

  /**
   * Generate UUID v4
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      clientId: this.clientId,
      url: `${this.url}/ws/${this.clientId}`
    };
  }

  /**
   * Get or create singleton instance
   */
  static getInstance(url = 'ws://localhost:3001') {
    if (!instance) {
      instance = new WebSocketService(url);
    }
    return instance;
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    // Prevent reconnection attempts
    this.reconnectAttempts = this.maxReconnectAttempts;
    
    if (this.ws) {
      this.ws.onclose = null; // Remove onclose handler to prevent reconnect
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.emit('disconnected');
  }
}

export default WebSocketService;
