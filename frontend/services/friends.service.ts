import api from '../lib/api';
import { User } from './auth.service';

export type Friend = User;

export interface FriendshipData {
  _id: string;
  requester: User;
  recipient: User;
  status: 'accepted';
  createdAt: string;
  updatedAt: string;
}

class FriendsService {
  async addFriend(username: string): Promise<FriendshipData> {
    const response = await api.post('/friends/add', { username });
    return response.data.data;
  }

  async getFriends(): Promise<Friend[]> {
    const response = await api.get('/friends/');
    return response.data.data;
  }

  async removeFriend(username: string): Promise<void> {
    await api.delete('/friends/remove', { data: { username } });
  }
}

export const friendsService = new FriendsService();
