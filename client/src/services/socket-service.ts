// socketService.ts - Fixed version

import { io, Socket } from 'socket.io-client';
import { getToken } from './api-backend';
import { 
  ChatMessage, 
  RoomParticipant, 
  Poll, 
  RevisionRoom 
} from '../types/index3';

// Socket.io server URL - replace with environment variable in production
const SOCKET_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3000';
console.log('Socket URL:', SOCKET_URL);

let socket: Socket | null = null;
let isInitializing = false;

// Event handler storage
type EventHandler<T> = (data: T) => void;
const eventHandlers: Record<string, EventHandler<any>[]> = {};

/**
 * Socket service for handling real-time communication
 */
const socketService = {
  /**
   * Initialize socket connection
   */
  init: (): Promise<boolean> => {
    // If already connected, return immediately
    if (socket && socket.connected) {
      console.log('Socket already connected with ID:', socket.id);
      return Promise.resolve(true);
    }
    
    // If already initializing, return a promise that resolves when the socket connects
    if (isInitializing) {
      console.log('Socket connection already initializing...');
      return new Promise((resolve) => {
        if (socket) {
          socket.once('connect', () => resolve(true));
          socket.once('connect_error', (err) => {
            console.error('Socket connection error during initialization:', err);
            resolve(false);
          });
        } else {
          resolve(false);
        }
      });
    }
    
    isInitializing = true;
    console.log('Initializing socket connection...');
    
    return new Promise((resolve) => {
      // Close existing socket if any
      if (socket) {
        console.log('Closing existing socket connection');
        socket.close();
        socket = null;
      }

      // Get auth token
      const token = getToken();
      if (!token) {
        console.error('No auth token found for socket connection');
        isInitializing = false;
        resolve(false);
        return;
      }
      
      console.log('Attempting to connect with token');

      // Create new socket connection with auth token
      socket = io(SOCKET_URL, {
        auth: {
          token
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });

      // Connection event handlers
      socket.on('connect', () => {
        console.log('Socket connected successfully with ID:', socket?.id);
        isInitializing = false;
        resolve(true);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        // Print the error in a more detailed way
        if (error.data) {
          console.error('Additional error data:', error.data);
        }
        isInitializing = false;
        resolve(false);
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      // Add explicit error event handler
      socket.on('error', (error) => {
        console.error('Socket error event:', error);
      });

      // Setup default event listeners
      socketService.setupDefaultListeners();
    });
  },

  /**
   * Close socket connection
   */
  close: (): void => {
    if (socket) {
      console.log('Closing socket connection');
      socket.close();
      socket = null;
    }
    
    isInitializing = false;
  },

  /**
   * Join room
   */
  joinRoom: (roomId: string): void => {
    console.log('Attempting to join room:', roomId);
    if (socket && socket.connected) {
      // Match the exact parameter structure expected by the server
      socket.emit('join_room', { roomId }, (response: any) => {
        if (response && response.success) {
          console.log('Successfully joined room:', roomId);
        } else {
          console.error('Failed to join room:', response?.error || 'Unknown error');
        }
      });
    } else {
      console.error('Socket not connected, cannot join room');
      // Attempt to reconnect
      socketService.init().then(success => {
        if (success && socket) {
          socket.emit('join_room', { roomId });
        }
      });
    }
  },

  /**
   * Leave room
   */
  leaveRoom: (roomId: string): void => {
    if (socket && socket.connected) {
      socket.emit('leave_room', { roomId }, (response: any) => {
        if (response && response.success) {
          console.log('Successfully left room:', roomId);
        } else {
          console.error('Failed to leave room:', response?.error || 'Unknown error');
        }
      });
    } else {
      console.log('Socket not connected, cannot leave room');
    }
  },

  /**
   * Send chat message
   */
  sendChatMessage: (roomId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): void => {
    if (socket && socket.connected) {
      // Fixed message structure to match what the server expects
      socket.emit('send_message', {
        roomId,
        content: message.content,
        type: message.type || 'text'
      }, (response: any) => {
        if (response && response.success) {
          console.log('Message sent successfully:', response.messageId);
        } else {
          console.error('Failed to send message:', response?.error || 'Unknown error');
        }
      });
    } else {
      console.error('Socket not connected, cannot send message');
    }
  },

  /**
   * Update user status in room
   */
  updateStatus: (roomId: string, status: 'studying' | 'idle' | 'away'): void => {
    if (socket && socket.connected) {
      // Map client status to server status if needed
      const serverStatus = status === 'studying' ? 'active' : status;
      
      socket.emit('change_status', { roomId, status: serverStatus }, (response: any) => {
        if (response && response.success) {
          console.log('Status updated successfully');
        } else {
          console.error('Failed to update status:', response?.error || 'Unknown error');
        }
      });
    } else {
      console.error('Socket not connected, cannot update status');
    }
  },

  /**
   * Vote in poll
   */
  votePoll: (roomId: string, pollId: string, optionId: string): void => {
    if (socket && socket.connected) {
      socket.emit('vote_poll', { 
        pollId, 
        optionIndex: parseInt(optionId, 10) || 0 
      }, (response: any) => {
        if (response && response.success) {
          console.log('Vote submitted successfully');
        } else {
          console.error('Failed to submit vote:', response?.error || 'Unknown error');
        }
      });
    } else {
      console.error('Socket not connected, cannot vote in poll');
    }
  },

  /**
   * Setup default event listeners
   */
  setupDefaultListeners: (): void => {
    if (!socket) return;

    // Map server event names to client event names
    const eventMappings = {
      'new_message': 'new_message',
      'user_joined': 'participant_joined',
      'user_left': 'participant_left',
      'status_changed': 'status_updated',
      'poll_updated': 'poll_updated',
      'room_updated': 'room_updated',
      'user_typing': 'user_typing'
    };

    // Handle new messages with better logging
    socket.on('new_message', (data: any) => {
      console.log('Received new message:', data);
      // Make sure the message has all required fields
      const message: ChatMessage = {
        id: data.id || `auto_${Date.now()}`,
        userId: data.userId,
        userName: data.userName || 'Unknown User',
        content: data.content || '',
        timestamp: data.timestamp || new Date().toISOString(),
        type: data.type || 'text'
      };
      socketService.triggerEvent('new_message', message);
    });

    // Handle user joined
    socket.on('user_joined', (data: any) => {
      console.log('User joined:', data);
      // Transform data to expected format
      const transformedData = {
        roomId: data.roomId,
        participant: {
          userId: data.userId,
          name: data.userName || 'Unknown User'
        }
      };
      socketService.triggerEvent('participant_joined', transformedData);
    });

    // Handle user left
    socket.on('user_left', (data: any) => {
      console.log('User left:', data);
      socketService.triggerEvent('participant_left', {
        roomId: data.roomId,
        userId: data.userId,
        timestamp: data.timestamp || new Date().toISOString()
      });
    });

    // Status changed
    socket.on('status_changed', (data: any) => {
      console.log('Status changed:', data);
      socketService.triggerEvent('status_updated', {
        roomId: data.roomId,
        userId: data.userId,
        status: data.status
      });
    });

    // Handle poll updated
    socket.on('poll_updated', (data: any) => {
      console.log('Poll updated:', data);
      socketService.triggerEvent('poll_updated', data);
    });

    // Handle room updated
    socket.on('room_updated', (data: any) => {
      console.log('Room updated:', data);
      socketService.triggerEvent('room_updated', data);
    });

    // Handle room events
    socket.on('room_joined', (data: any) => {
      console.log('Room joined:', data);
      socketService.triggerEvent('room_joined', data);
    });

    socket.on('room_left', (data: any) => {
      console.log('Room left:', data);
      socketService.triggerEvent('room_left', data);
    });

    // Handle message liked/unliked events
    socket.on('message_liked', (data: any) => {
      console.log('Message liked:', data);
      socketService.triggerEvent('message_liked', data);
    });

    // Error handler
    socket.on('error', (error: any) => {
      console.error('Socket error event received:', error);
      socketService.triggerEvent('socket_error', error);
    });
  },

  /**
   * Register event handler
   */
  on: <T>(event: string, handler: EventHandler<T>): void => {
    if (!eventHandlers[event]) {
      eventHandlers[event] = [];
    }
    // Only add the handler if it's not already registered
    if (eventHandlers[event].indexOf(handler) === -1) {
      eventHandlers[event].push(handler);
      console.log(`Registered handler for event: ${event}, total handlers: ${eventHandlers[event].length}`);
    } else {
      console.log(`Handler already registered for event: ${event}`);
    }
  },

  /**
   * Remove event handler
   */
  off: <T>(event: string, handler: EventHandler<T>): void => {
    if (!eventHandlers[event]) return;
    
    const index = eventHandlers[event].indexOf(handler);
    if (index !== -1) {
      eventHandlers[event].splice(index, 1);
      console.log(`Removed handler for event: ${event}, remaining handlers: ${eventHandlers[event].length}`);
    }
  },

  /**
   * Trigger event
   */
  triggerEvent: <T>(event: string, data: T): void => {
    if (!eventHandlers[event] || eventHandlers[event].length === 0) {
      console.log(`No handlers registered for event: ${event}`);
      return;
    }
    
    console.log(`Triggering event: ${event}, handlers: ${eventHandlers[event].length}`);
    eventHandlers[event].forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in ${event} handler:`, error);
      }
    });
  },

  /**
   * Check if socket is connected
   */
  isConnected: (): boolean => {
    return !!socket?.connected;
  },

  /**
   * Get socket instance (for debugging)
   */
  getSocket: (): Socket | null => {
    return socket;
  }
};

export default socketService;