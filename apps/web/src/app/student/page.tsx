'use client';

import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { studentApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { formatDate, Lesson } from '@skipli/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@radix-ui/react-dialog';
import { Label } from '@radix-ui/react-label';
import { User, LogOut, BookOpen, CheckCircle, Clock, MessageSquare, Badge } from 'lucide-react';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [formData, setFormData] = useState({ name: user?.name || '', email: user?.email || '' });
  const [error, setError] = useState('');

  const { data: lessonsData, isLoading } = useQuery({
    queryKey: ['myLessons', user?.email],
    queryFn: () => studentApi.getMyLessons(),
    enabled: !!user?.email,
  });

  const lessons = (lessonsData?.lessons || []) as Lesson[];

  const markDoneMutation = useMutation({
    mutationFn: (lessonId: string) => studentApi.markLessonDone(lessonId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myLessons'] }),
  });

  const editProfileMutation = useMutation({
    mutationFn: (data: { name?: string; email?: string }) => 
      studentApi.editProfile(data),
    onSuccess: () => {
      setShowEditProfile(false);
      setError('');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Không thể cập nhật hồ sơ'),
  });

  const handleEditProfile = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    editProfileMutation.mutate({
      name: formData.name,
      email: formData.email,
    });
  };

  const completedLessons = lessons.filter((l) => l.status === 'completed');
  const pendingLessons = lessons.filter((l) => l.status !== 'completed');

  return (
    <div className="min-h-screen bg-background">

      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold">Lớp học</a>
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="font-medium">{user?.name}</div>
              <div className="text-sm">Học viên</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowEditProfile(true)}>
              <User className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <BookOpen className="h-8 w-8" />
              <div>
                <div className="text-3xl font-bold">{lessons.length}</div>
                <div className="text-sm">Tổng số bài học</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <CheckCircle className="h-8 w-8" />
              <div>
                <div className="text-3xl font-bold">{completedLessons.length}</div>
                <div className="text-sm">Đã hoàn thành</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <Clock className="h-8 w-8" />
              <div>
                <div className="text-3xl font-bold">{pendingLessons.length}</div>
                <div className="text-sm">Mới</div>
              </div>
            </CardContent>
          </Card>
        </div>


        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat với giảng viên
            </CardTitle>
            <Button
              onClick={() => {
                const instructorEmail = (user as any)?.instructorEmail;
                const instructorId = (user as any)?.instructorId;
                if (instructorEmail) {
                  router.push(`/chat/${encodeURIComponent(instructorEmail)}`);
                } else if (instructorId) {
                  router.push(`/chat/${encodeURIComponent(instructorId)}`);
                }
              }}
            >
              Mở đoạn chat
            </Button>
          </CardHeader>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle>Bài học của tôi</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin h-8 w-8 border-b-2"></div>
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Chưa có bài học</h3>
                <p>Giảng viên chưa giao bài học nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lessons.map((lesson: Lesson) => (
                  <Card key={lesson.id} className="border">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{lesson.title}</h3>
                      <p className="text-sm mb-4">
                        {lesson.description || 'Không có mô tả'}
                      </p>
                      <div className="flex items-center justify-between">
                          {lesson.status === 'completed' ? 'Hoàn thành' : 'Mới'}
                        {lesson.status !== 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => markDoneMutation.mutate(lesson.id)}
                            disabled={markDoneMutation.isPending}
                          >
                            {markDoneMutation.isPending ? 'Đang thực hiện...' : 'Đánh dấu xong'}
                          </Button>
                        )}
                      </div>
                      <p className="text-xs mt-3">
                        Ngày giao: {formatDate(lesson.assignedAt)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>


      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa hồ sơ</DialogTitle>
            <DialogDescription>Cập nhật thông tin hồ sơ của bạn.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditProfile} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Tên</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditProfile(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={editProfileMutation.isPending}>
                {editProfileMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
