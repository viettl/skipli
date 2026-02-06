import { io, Socket } from 'socket.io-client';
import { Message, SOCKET_EVENTS } from '@skipli/shared';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    }
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  setUserOnline(userId: string): void {
    this.socket?.emit('user_online', userId);
  }

  joinRoom(roomId: string): void {
    this.socket?.emit(SOCKET_EVENTS.JOIN_ROOM, roomId);
  }

  leaveRoom(roomId: string): void {
    this.socket?.emit(SOCKET_EVENTS.LEAVE_ROOM, roomId);
  }

  sendMessage(data: {
    roomId: string;
    senderId: string;
    receiverId: string;
    content: string;
  }): void {
    this.socket?.emit(SOCKET_EVENTS.SEND_MESSAGE, data);
  }

  startTyping(roomId: string, userId: string): void {
    this.socket?.emit(SOCKET_EVENTS.TYPING, { roomId, userId });
  }

  stopTyping(roomId: string, userId: string): void {
    this.socket?.emit(SOCKET_EVENTS.STOP_TYPING, { roomId, userId });
  }

  onNewMessage(callback: (message: Message) => void): void {
    this.socket?.on(SOCKET_EVENTS.NEW_MESSAGE, callback);
  }

  onMessageHistory(callback: (messages: Message[]) => void): void {
    this.socket?.on('message_history', callback);
  }

  onUserTyping(callback: (userId: string) => void): void {
    this.socket?.on('user_typing', callback);
  }

  onUserStoppedTyping(callback: (userId: string) => void): void {
    this.socket?.on('user_stopped_typing', callback);
  }

  onUserOnline(callback: (userId: string) => void): void {
    this.socket?.on(SOCKET_EVENTS.USER_ONLINE, callback);
  }

  onUserOffline(callback: (userId: string) => void): void {
    this.socket?.on(SOCKET_EVENTS.USER_OFFLINE, callback);
  }

  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }
}

export const socketService = new SocketService();
