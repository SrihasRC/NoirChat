import { io, Socket } from 'socket.io-client';
import { authService } from '@/services/auth.service';

export interface Message {
  _id: string;
  sender: {
    _id: string;
    username: string;
    name: string;
  };
  receiver?: {
    _id: string;
    username: string;
    name: string;
  };
  content: string;
  messageType: 'text' | 'image' | 'file' | 'video' | 'audio';
  room?: string;
  isRead: boolean;
  createdAt: string;
  timestamp?: string;
}

export interface TypingUser {
  userId: string;
  username: string;
  roomId?: string;
}

export interface UserEvent {
  userId: string;
  username: string;
}

export interface ReadReceipt {
  messageId: string;
  readBy: string;
  readAt: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isReconnecting: boolean;
  error?: string;
}

class SocketService {
  private socket: Socket | null = null;
  private messageHandlers: ((message: Message) => void)[] = [];
  private typingHandlers: ((data: TypingUser) => void)[] = [];
  private typingStoppedHandlers: ((data: TypingUser) => void)[] = [];
  private userJoinedHandlers: ((data: UserEvent) => void)[] = [];
  private userLeftHandlers: ((data: UserEvent) => void)[] = [];
  private readReceiptHandlers: ((data: ReadReceipt) => void)[] = [];
  private connectionStatusHandlers: ((status: ConnectionStatus) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect() {
    const token = authService.getToken();
    
    if (!token) {
      console.error('No token found for socket connection');
      this.notifyConnectionStatus({ isConnected: false, isReconnecting: false, error: 'No authentication token' });
      return;
    }

    // Use environment variable or fallback to localhost
    const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5500';

    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 20000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.reconnectAttempts = 0;
      this.notifyConnectionStatus({ isConnected: true, isReconnecting: false });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      this.notifyConnectionStatus({ 
        isConnected: false, 
        isReconnecting: reason !== 'io client disconnect',
        error: reason 
      });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.reconnectAttempts++;
      this.notifyConnectionStatus({ 
        isConnected: false, 
        isReconnecting: this.reconnectAttempts < this.maxReconnectAttempts,
        error: error.message 
      });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
      this.notifyConnectionStatus({ isConnected: true, isReconnecting: false });
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Reconnection attempt:', attemptNumber);
      this.notifyConnectionStatus({ 
        isConnected: false, 
        isReconnecting: true,
        error: `Reconnection attempt ${attemptNumber}` 
      });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect after maximum attempts');
      this.notifyConnectionStatus({ 
        isConnected: false, 
        isReconnecting: false,
        error: 'Failed to reconnect after maximum attempts' 
      });
    });

    // Listen for new messages
    this.socket.on('new_direct_message', (message: Message) => {
      this.messageHandlers.forEach(handler => handler(message));
    });

    this.socket.on('new_room_message', (message: Message) => {
      this.messageHandlers.forEach(handler => handler(message));
    });

    // Listen for typing indicators
    this.socket.on('user_typing', (data: TypingUser) => {
      this.typingHandlers.forEach(handler => handler(data));
    });

    this.socket.on('user_stopped_typing', (data: TypingUser) => {
      this.typingStoppedHandlers.forEach(handler => handler(data));
    });

    // Listen for user events
    this.socket.on('user_joined', (data: UserEvent) => {
      this.userJoinedHandlers.forEach(handler => handler(data));
    });

    this.socket.on('user_left', (data: UserEvent) => {
      this.userLeftHandlers.forEach(handler => handler(data));
    });

    this.socket.on('message_read_receipt', (data: ReadReceipt) => {
      this.readReceiptHandlers.forEach(handler => handler(data));
    });
  }

  private notifyConnectionStatus(status: ConnectionStatus) {
    this.connectionStatusHandlers.forEach(handler => handler(status));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.notifyConnectionStatus({ isConnected: false, isReconnecting: false });
    }
  }

  // Message handlers
  onNewMessage(handler: (message: Message) => void) {
    this.messageHandlers.push(handler);
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  onTyping(handler: (data: TypingUser) => void) {
    this.typingHandlers.push(handler);
    return () => {
      const index = this.typingHandlers.indexOf(handler);
      if (index > -1) {
        this.typingHandlers.splice(index, 1);
      }
    };
  }

  onTypingStopped(handler: (data: TypingUser) => void) {
    this.typingStoppedHandlers.push(handler);
    return () => {
      const index = this.typingStoppedHandlers.indexOf(handler);
      if (index > -1) {
        this.typingStoppedHandlers.splice(index, 1);
      }
    };
  }

  onUserJoined(handler: (data: UserEvent) => void) {
    this.userJoinedHandlers.push(handler);
    return () => {
      const index = this.userJoinedHandlers.indexOf(handler);
      if (index > -1) {
        this.userJoinedHandlers.splice(index, 1);
      }
    };
  }

  onUserLeft(handler: (data: UserEvent) => void) {
    this.userLeftHandlers.push(handler);
    return () => {
      const index = this.userLeftHandlers.indexOf(handler);
      if (index > -1) {
        this.userLeftHandlers.splice(index, 1);
      }
    };
  }

  onReadReceipt(handler: (data: ReadReceipt) => void) {
    this.readReceiptHandlers.push(handler);
    return () => {
      const index = this.readReceiptHandlers.indexOf(handler);
      if (index > -1) {
        this.readReceiptHandlers.splice(index, 1);
      }
    };
  }

  onConnectionStatus(handler: (status: ConnectionStatus) => void) {
    this.connectionStatusHandlers.push(handler);
    return () => {
      const index = this.connectionStatusHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionStatusHandlers.splice(index, 1);
      }
    };
  }

  // Emit events with error handling
  joinRoom(roomId: string): boolean {
    if (!this.isConnected()) {
      console.warn('Cannot join room: socket not connected');
      return false;
    }
    this.socket?.emit('join_room', roomId);
    return true;
  }

  leaveRoom(roomId: string): boolean {
    if (!this.isConnected()) {
      console.warn('Cannot leave room: socket not connected');
      return false;
    }
    this.socket?.emit('leave_room', roomId);
    return true;
  }

  sendDirectMessage(receiverId: string, content: string, messageType: string = 'text'): boolean {
    if (!this.isConnected()) {
      console.warn('Cannot send direct message: socket not connected');
      return false;
    }
    if (!content.trim()) {
      console.warn('Cannot send empty message');
      return false;
    }
    this.socket?.emit('send_direct_message', {
      receiverId,
      content: content.trim(),
      messageType
    });
    return true;
  }

  sendRoomMessage(roomId: string, content: string, messageType: string = 'text'): boolean {
    if (!this.isConnected()) {
      console.warn('Cannot send room message: socket not connected');
      return false;
    }
    if (!content.trim()) {
      console.warn('Cannot send empty message');
      return false;
    }
    this.socket?.emit('send_room_message', {
      roomId,
      content: content.trim(),
      messageType
    });
    return true;
  }

  startTyping(roomId?: string, receiverId?: string): boolean {
    if (!this.isConnected()) {
      return false;
    }
    this.socket?.emit('typing_start', { roomId, receiverId });
    return true;
  }

  stopTyping(roomId?: string, receiverId?: string): boolean {
    if (!this.isConnected()) {
      return false;
    }
    this.socket?.emit('typing_stop', { roomId, receiverId });
    return true;
  }

  markMessageAsRead(messageId: string, senderId: string): boolean {
    if (!this.isConnected()) {
      console.warn('Cannot mark message as read: socket not connected');
      return false;
    }
    this.socket?.emit('message_read', { messageId, senderId });
    return true;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionStatus(): ConnectionStatus {
    return {
      isConnected: this.isConnected(),
      isReconnecting: (this.socket?.disconnected || false) && this.reconnectAttempts > 0 && this.reconnectAttempts < this.maxReconnectAttempts,
    };
  }

  // Cleanup method to remove all handlers
  removeAllHandlers() {
    this.messageHandlers = [];
    this.typingHandlers = [];
    this.typingStoppedHandlers = [];
    this.userJoinedHandlers = [];
    this.userLeftHandlers = [];
    this.readReceiptHandlers = [];
    this.connectionStatusHandlers = [];
  }

  // Force reconnect method
  forceReconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connect();
    }
  }
}

export const socketService = new SocketService();
