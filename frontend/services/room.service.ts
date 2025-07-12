import api from '@/lib/api';
import { User } from '@/services/auth.service';
import { Message } from '@/services/socket.service';
import { socketService } from '@/services/socket.service';

export interface RoomMember {
  user: User | string;
  role: 'owner' | 'admin' | 'member';
  joinedAt?: string;
}

export interface Room {
  _id: string;
  name: string;
  description?: string;
  creator: User;
  members: RoomMember[];
  isPrivate?: boolean;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number; // Add unread count for rooms
  lastMessageTime?: string; // Add last message time for sorting
}

export interface CreateRoomData {
  name: string;
  members: string[];
  description?: string;
  isPrivate?: boolean;
}

export interface UpdateRoomData {
  name?: string;
  description?: string;
}

export interface SendRoomMessageData {
  roomId: string;
  content: string;
}

class RoomService {
  async createRoom(data: CreateRoomData): Promise<Room> {
    const response = await api.post('/rooms/create', data);
    return response.data.data;
  }

  async joinRoom(roomId: string): Promise<Room> {
    const response = await api.post('/rooms/join', { roomId });
    return response.data.data;
  }

  async leaveRoom(roomId: string): Promise<Room> {
    const response = await api.post('/rooms/leave', { roomId });
    return response.data.data;
  }

  async sendRoomMessage(data: SendRoomMessageData): Promise<Message> {
    // Send via API for persistence
    const response = await api.post('/rooms/message', data);
    
    // Also emit via socket for real-time delivery
    socketService.sendRoomMessage(data.roomId, data.content);
    
    return response.data.data;
  }

  async getRoomMessages(roomId: string): Promise<Message[]> {
    const response = await api.get(`/rooms/${roomId}/messages`);
    return response.data.data;
  }

  async getRooms(): Promise<Room[]> {
    const response = await api.get('/rooms/');
    return response.data.data;
  }

  async getRoomsWithUnreadCounts(): Promise<Room[]> {
    const response = await api.get('/rooms/with-unread-counts');
    return response.data.data;
  }

  async markRoomAsRead(roomId: string): Promise<void> {
    await api.put(`/rooms/${roomId}/read`);
  }

  async updateRoom(roomId: string, data: UpdateRoomData): Promise<Room> {
    const response = await api.put(`/rooms/${roomId}`, data);
    return response.data.data;
  }

  async deleteRoom(roomId: string): Promise<void> {
    await api.delete(`/rooms/${roomId}`);
  }

  async searchRooms(query: string): Promise<Room[]> {
    const response = await api.get(`/rooms/search?query=${encodeURIComponent(query)}`);
    return response.data.data;
  }
}

export const roomService = new RoomService();
