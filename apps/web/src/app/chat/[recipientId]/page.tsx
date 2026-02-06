'use client';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { socketService } from '@/services/socket';
import { instructorApi } from '@/services/api';
import { Message, formatMessageTime, Student } from '@skipli/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Send, 
  MessageCircle, 
  Search, 
  User as UserIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
export default function ChatPage() {
  const params = useParams();
  const recipientId = decodeURIComponent(params.recipientId as string);
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: () => instructorApi.getStudents(),
    enabled: user?.role === 'instructor',
  });
  const students = (studentsData?.students || []) as Student[];
  
  const contacts = user?.role === 'student' 
    ? (user as any).instructorEmail ? [{ 
        name: 'Giảng viên', 
        email: (user as any).instructorEmail 
      }] : []
    : students.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
  const myId = user?.email || '';
  const roomId = [myId, recipientId].sort().join('-');
  
  // socket connection 
  useEffect(() => {
    socketService.connect();
    if (myId) {
      socketService.setUserOnline(myId);
      socketService.joinRoom(roomId);
      socketService.onMessageHistory((history) => {
        setMessages(history);
      });
      socketService.onNewMessage((message) => {
        setMessages((prev) => [...prev, message]);
      });
      socketService.onUserTyping(() => {
        setIsTyping(true);
      });
      socketService.onUserStoppedTyping(() => {
        setIsTyping(false);
      });
    }
    return () => {
      socketService.leaveRoom(roomId);
      socketService.removeAllListeners();
    };
  }, [roomId, myId]);
  
  // auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  const handleTyping = () => {
    if (myId) {
      socketService.startTyping(roomId, myId);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // stop typing after 2s of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(roomId, myId);
      }, 2000);
    }
  };
  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !myId || !recipientId) return;
    
    socketService.sendMessage({
      roomId,
      senderId: myId,
      receiverId: recipientId,
      content: newMessage.trim(),
    });
    
    setNewMessage('');
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketService.stopTyping(roomId, myId);
  };
  
  const recipientName = students.find(s => s.email === recipientId)?.name || (user?.role === 'student' ? 'Giảng viên' : 'Học viên');
  
  return (
    <div className="flex h-screen">
      <div className="w-80 border-r flex flex-col">
        <header className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Tất cả tin nhắn</h2>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
            <Input 
              placeholder="Tìm kiếm..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-2">
          {contacts.map((contact) => (
            <button
              key={contact.email}
              onClick={() => router.push(`/chat/${encodeURIComponent(contact.email)}`)}
              className={cn(
                "w-full text-left p-3 mb-2",
                recipientId === contact.email 
                  ? "bg-background border" 
                  : "hover:bg-muted"
              )}
            >
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{contact.name}</p>
                  <p className="text-sm">{contact.email}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <header className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">{recipientName}</h2>
              <p className="text-xs text-green-600">Online</p>
            </div>
          </div>
         
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold">Không có tin nhắn</h3>
              <p>Bắt đầu trò chuyện với {recipientName}</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2 mb-4",
                  message.senderId === myId ? "justify-end" : "justify-start"
                )}
              >
                {message.senderId !== myId && (
                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[70%] px-4 py-2 rounded-lg",
                    message.senderId === myId
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p>{message.content}</p>
                  <span className="text-xs block mt-1">
                    {formatMessageTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex gap-2 mb-4">
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="bg-muted px-4 py-2 rounded-lg">
                đang nhập...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <footer className="p-4 border-t">
          <form 
            onSubmit={handleSend}
            className="flex gap-2"
          >
            <div className="flex-1 border p-2">
              <textarea
                placeholder="Nhập tin nhắn"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e as any);
                  }
                }}
                className="w-full border-0 resize-none p-2 min-h-[60px]"
              />
            </div>
            <Button 
              type="submit" 
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </footer>
      </div>
    </div>
  );
}
