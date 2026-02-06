export type UserRole = 'instructor' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Instructor extends User {
  role: 'instructor';
}

export interface Student extends User {
  role: 'student';
  instructorId: string;
  instructorEmail?: string;
  isAccountSetup: boolean;
}

export type LessonStatus = 'assigned' | 'in_progress' | 'completed';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  status: LessonStatus;
  studentEmail: string;
  instructorId: string;
  assignedAt: Date;
  completedAt?: Date;
}

export interface AccessCode {
  code: string;
  email?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
}

export interface VerifyRequest {
  email: string;
  accessCode: string;
}

export interface AddStudentRequest {
  name: string;
  email: string;
}

export interface AssignLessonRequest {
  studentEmail: string;
  title: string;
  description: string;
}

export interface MarkLessonDoneRequest {
  lessonId: string;
}

export interface EditProfileRequest {
  name?: string;
  email?: string;
}

export interface SocketEvents {
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  typing: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
  newMessage: (message: Message) => void;
  userTyping: (userId: string) => void;
  userStoppedTyping: (userId: string) => void;
  userOnline: (userId: string) => void;
  userOffline: (userId: string) => void;
}
