import api from '@/lib/api';
import { Message } from '@/services/socket.service';
import { Conversation } from '@/stores/chat.store';

export interface SendMessageData {
  receiverUsername: string;
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'video' | 'audio';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface MessageStats {
  totalMessages: number;
  unreadMessages: number; 
  readMessages: number;
}

class MessageService {
  async sendDirectMessage(data: SendMessageData): Promise<Message> {
    const response = await api.post('/messages/send', data);
    return response.data.data;
  }

  async getConversation(username: string): Promise<Message[]> {
    const response = await api.get(`/messages/conversation/${username}`);
    return response.data.data;
  }

  async getAllConversations(): Promise<Message[]> {
    const response = await api.get('/messages/conversations');
    return response.data.data;
  }

  async getUserConversations(): Promise<Conversation[]> {
    const response = await api.get('/messages/user-conversations');
    return response.data.data;
  }

  async editMessage(messageId: string, content: string): Promise<Message> {
    const response = await api.put(`/messages/${messageId}`, { content });
    return response.data.data;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await api.delete(`/messages/${messageId}`);
  }

  async markAsRead(messageId: string): Promise<Message> {
    const response = await api.put(`/messages/${messageId}/read`);
    return response.data.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await api.get('/messages/unread/count');
    return response.data.data.count;
  }

  async searchMessages(query: string): Promise<Message[]> {
    const response = await api.get(`/messages/search?query=${encodeURIComponent(query)}`);
    return response.data.data;
  }

  async getMessageStats(): Promise<MessageStats> {
    const response = await api.get('/messages/stats');
    return response.data.data;
  }
}

export const messageService = new MessageService();
