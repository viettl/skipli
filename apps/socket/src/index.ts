import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import { SOCKET_EVENTS, generateId, Message } from '@skipli/shared';
import { saveMessage, getMessages } from './services/firebase';
const PORT = parseInt(process.env.SOCKET_PORT || '3002');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// track online users
const onlineUsers = new Map<string, string>();
io.on(SOCKET_EVENTS.CONNECTION, (socket: Socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('user_online', (userId: string) => {
    onlineUsers.set(socket.id, userId);
    socket.broadcast.emit(SOCKET_EVENTS.USER_ONLINE, userId);
  });
  
  socket.on(SOCKET_EVENTS.JOIN_ROOM, async (roomId: string) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
    
    // send message history to newly joined user
    try {
      const messages = await getMessages(roomId);
      socket.emit('message_history', messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  });
  socket.on(SOCKET_EVENTS.LEAVE_ROOM, (roomId: string) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room: ${roomId}`);
  });
  
  socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (data: {
    roomId: string;
    senderId: string;
    receiverId: string;
    content: string;
  }) => {
    const message: Message = {
      id: generateId(),
      senderId: data.senderId,
      receiverId: data.receiverId,
      content: data.content,
      timestamp: new Date(),
      read: false,
    };
    
    // broadcast to room
    io.to(data.roomId).emit(SOCKET_EVENTS.NEW_MESSAGE, message);
    
    // save to database
    try {
      await saveMessage(data.roomId, message);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });
  
  socket.on(SOCKET_EVENTS.TYPING, (data: { roomId: string; userId: string }) => {
    socket.to(data.roomId).emit('user_typing', data.userId);
  });
  
  socket.on(SOCKET_EVENTS.STOP_TYPING, (data: { roomId: string; userId: string }) => {
    socket.to(data.roomId).emit('user_stopped_typing', data.userId);
  });
  
  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    const userId = onlineUsers.get(socket.id);
    if (userId) {
      onlineUsers.delete(socket.id);
      socket.broadcast.emit(SOCKET_EVENTS.USER_OFFLINE, userId);
    }
    console.log(`Client disconnected: ${socket.id}`);
  });
});
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running at http://localhost:${PORT}`);
});
