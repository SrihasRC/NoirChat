import { useEffect, useRef } from 'react';
import { socketService } from '@/services/socket.service';
import { useChatStore } from '@/stores/chat.store';
import { useAuthStore } from '@/stores/chat.store';

export function useSocket() {
  const isInitialized = useRef(false);
  const { user } = useAuthStore();
  const { 
    addMessage, 
    addTypingUser, 
    removeTypingUser, 
    setConnectionStatus,
    currentRoom,
    currentChatUser 
  } = useChatStore();

  useEffect(() => {
    if (!user || isInitialized.current) return;

    socketService.connect();
    isInitialized.current = true;

    const unsubscribers = [
      // Message events
      socketService.onNewMessage((message) => {
        addMessage(message);
      }),

      // Typing events
      socketService.onTyping((data) => {
        addTypingUser(data);
      }),

      socketService.onTypingStopped((data) => {
        removeTypingUser(data.userId);
      }),

      // Connection status
      socketService.onConnectionStatus((status) => {
        setConnectionStatus(status);
      }),

      // Read receipts
      socketService.onReadReceipt((data) => {
        // Handle read receipts if needed
        console.log('Message read:', data);
      }),

      // User events
      socketService.onUserJoined((data) => {
        console.log('User joined:', data);
      }),

      socketService.onUserLeft((data) => {
        console.log('User left:', data);
      }),
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
      socketService.disconnect();
      isInitialized.current = false;
    };
  }, [user, addMessage, addTypingUser, removeTypingUser, setConnectionStatus]);

  // Join/leave rooms when current room changes
  useEffect(() => {
    if (!socketService.isConnected()) return;

    if (currentRoom) {
      socketService.joinRoom(currentRoom._id);
      return () => {
        socketService.leaveRoom(currentRoom._id);
      };
    }
  }, [currentRoom]);

  return {
    isConnected: socketService.isConnected(),
    sendMessage: (content: string, messageType: string = 'text') => {
      if (currentRoom) {
        return socketService.sendRoomMessage(currentRoom._id, content, messageType);
      } else if (currentChatUser) {
        return socketService.sendDirectMessage(currentChatUser._id, content, messageType);
      }
      return false;
    },
    startTyping: () => {
      if (currentRoom) {
        socketService.startTyping(currentRoom._id);
      } else if (currentChatUser) {
        socketService.startTyping(undefined, currentChatUser._id);
      }
    },
    stopTyping: () => {
      if (currentRoom) {
        socketService.stopTyping(currentRoom._id);
      } else if (currentChatUser) {
        socketService.stopTyping(undefined, currentChatUser._id);
      }
    },
    markAsRead: (messageId: string, senderId: string) => {
      return socketService.markMessageAsRead(messageId, senderId);
    },
  };
}
