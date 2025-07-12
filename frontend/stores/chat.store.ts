import { create } from 'zustand';
import { User } from '@/services/auth.service';
import { Message, TypingUser, ConnectionStatus } from '@/services/socket.service';
import { Friend } from '@/services/friends.service';
import { Room } from '@/services/room.service';

// New interface for conversations
export interface Conversation {
  _id: string;
  otherUser: {
    _id: string;
    username: string;
    name: string;
  };
  lastMessage: {
    _id: string;
    content: string;
    createdAt: string;
    sender: {
      _id: string;
      username: string;
      name: string;
    };
  };
  unreadCount: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

interface ChatState {
  messages: Message[]; 
  conversations: Conversation[]; // New: actual conversations
  friends: Friend[];
  rooms: Room[];
  currentChatUser: User | null;
  currentRoom: Room | null;
  unreadCount: number;
  typingUsers: TypingUser[];
  connectionStatus: ConnectionStatus;
  
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeMessage: (messageId: string) => void;
  
  // New conversation methods
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (userId: string, updates: Partial<Conversation>) => void;
  reorderConversationsByLatest: (userId?: string) => void;
  
  setFriends: (friends: Friend[]) => void;
  addFriend: (friend: Friend) => void;
  removeFriend: (friendId: string) => void;
  
  setRooms: (rooms: Room[]) => void;
  addRoom: (room: Room) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  removeRoom: (roomId: string) => void;
  reorderRoomsByLatest: (roomId?: string) => void;
  
  setCurrentChatUser: (user: User | null) => void;
  setCurrentRoom: (room: Room | null) => void;
  setUnreadCount: (count: number) => void;
  
  addTypingUser: (user: TypingUser) => void;
  removeTypingUser: (userId: string) => void;
  
  setConnectionStatus: (status: ConnectionStatus) => void;
  
  clearChatData: () => void;
}

// Helper functions for localStorage (SSR-safe)
const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  
  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    
    set({ 
      user, 
      isAuthenticated: !!user 
    });
  },
  
  logout: () => {
    // Clear all storage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    set({ 
      user: null, 
      isAuthenticated: false 
    });
  },
}));

// Initialize auth state from localStorage when store is created (client-side only)
if (typeof window !== 'undefined') {
  const storedUser = getStoredUser();
  const storedToken = getStoredToken();
  
  if (storedUser && storedToken) {
    setTimeout(() => {
      useAuthStore.getState().setUser(storedUser);
    }, 0);
  }
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  conversations: [], // Initialize conversations array
  friends: [],
  rooms: [],
  currentChatUser: null,
  currentRoom: null,
  unreadCount: 0,
  typingUsers: [],
  connectionStatus: { isConnected: false, isReconnecting: false },
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => {
    const exists = state.messages.find(m => m._id === message._id);
    if (exists) return state;
    
    return {
      messages: [...state.messages, message].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    };
  }),
  
  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map(msg => 
      msg._id === messageId ? { ...msg, ...updates } : msg
    )
  })),
  
  removeMessage: (messageId) => set((state) => ({
    messages: state.messages.filter(msg => msg._id !== messageId)
  })),
  
  // Conversation actions
  setConversations: (conversations) => set({ conversations }),
  
  addConversation: (conversation) => set((state) => {
    const exists = state.conversations.find(c => c.otherUser._id === conversation.otherUser._id);
    if (exists) return state;
    return { conversations: [...state.conversations, conversation] };
  }),
  
  updateConversation: (userId, updates) => set((state) => ({
    conversations: state.conversations.map(conv => 
      conv.otherUser._id === userId ? { ...conv, ...updates } : conv
    )
  })),

  reorderConversationsByLatest: (userId?: string) => set((state) => {
    const currentTime = new Date().toISOString()
    const updatedConversations = state.conversations.map(conv => 
      userId && conv.otherUser._id === userId 
        ? { 
            ...conv, 
            lastMessage: { 
              ...conv.lastMessage, 
              createdAt: currentTime 
            } 
          }
        : conv
    )
    
    return {
      conversations: [...updatedConversations].sort((a, b) => {
        const aTime = new Date(a.lastMessage.createdAt).getTime()
        const bTime = new Date(b.lastMessage.createdAt).getTime()
        return bTime - aTime // Latest first
      })
    }
  }),
  
  setFriends: (friends) => set({ friends }),
  
  addFriend: (friend) => set((state) => {
    const exists = state.friends.find(f => f._id === friend._id);
    if (exists) return state;
    return { friends: [...state.friends, friend] };
  }),
  
  removeFriend: (friendId) => set((state) => ({
    friends: state.friends.filter(friend => friend._id !== friendId)
  })),
  
  // Rooms actions
  setRooms: (rooms) => set({ rooms }),
  
  addRoom: (room) => set((state) => {
    const exists = state.rooms.find(r => r._id === room._id);
    if (exists) return state;
    return { rooms: [...state.rooms, room] };
  }),
  
  updateRoom: (roomId, updates) => set((state) => ({
    rooms: state.rooms.map(room => 
      room._id === roomId ? { ...room, ...updates } : room
    )
  })),

  reorderRoomsByLatest: (roomId?: string) => set((state) => {
    const currentTime = new Date().toISOString()
    
    // Create completely new room objects to ensure React re-renders
    const updatedRooms = state.rooms.map(room => ({
      ...room,
      lastMessageTime: roomId && room._id === roomId ? currentTime : room.lastMessageTime
    }))
    
    const sortedRooms = updatedRooms.sort((a, b) => {
      // Use lastMessageTime if available, otherwise fall back to updatedAt
      const aTime = new Date(a.lastMessageTime || a.updatedAt).getTime()
      const bTime = new Date(b.lastMessageTime || b.updatedAt).getTime()
      return bTime - aTime // Latest first
    })
    
    return {
      rooms: sortedRooms
    }
  }),
  
  removeRoom: (roomId) => set((state) => ({
    rooms: state.rooms.filter(room => room._id !== roomId)
  })),
  
  setCurrentChatUser: (user) => set({ 
    currentChatUser: user,
    currentRoom: null  
  }),
  
  setCurrentRoom: (room) => set({ 
    currentRoom: room,
    currentChatUser: null  
  }),
  
  setUnreadCount: (count) => set({ unreadCount: count }),
  
  addTypingUser: (user) => set((state) => {
    const exists = state.typingUsers.find(u => u.userId === user.userId);
    if (exists) return state;
    return { typingUsers: [...state.typingUsers, user] };
  }),
  
  removeTypingUser: (userId) => set((state) => ({
    typingUsers: state.typingUsers.filter(user => user.userId !== userId)
  })),
  
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  
  clearChatData: () => set({
    messages: [],
    conversations: [], // Clear conversations as well
    friends: [],
    rooms: [],
    currentChatUser: null,
    currentRoom: null,
    unreadCount: 0,
    typingUsers: [],
  }),
}));


