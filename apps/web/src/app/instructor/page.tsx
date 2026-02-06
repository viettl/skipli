'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { instructorApi } from '@/services/api';
import { Student } from '@skipli/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, BookOpen, MessageSquare, Trash2, Plus, LogOut } from 'lucide-react';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// validation schemas
const addStudentSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
});

const assignLessonSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc'),
  description: z.string().optional(),
});

export default function InstructorDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAssignLesson, setShowAssignLesson] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [error, setError] = useState('');

  const addStudentForm = useForm<z.infer<typeof addStudentSchema>>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: { name: '', email: '' },
  });

  const assignLessonForm = useForm<z.infer<typeof assignLessonSchema>>({
    resolver: zodResolver(assignLessonSchema),
    defaultValues: { title: '', description: '' },
  });

  // fetch students list
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => instructorApi.getStudents(),
  });
  const students = (studentsData?.students || []) as Student[];

  const addStudentMutation = useMutation({
    mutationFn: instructorApi.addStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowAddStudent(false);
      addStudentForm.reset();
      setError('');
    },
    onError: (err) => {
      const errorMsg = err instanceof Error ? err.message : 'Không thể thêm học viên';
      setError(errorMsg);
    },
  });

  const assignLessonMutation = useMutation({
    mutationFn: instructorApi.assignLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowAssignLesson(false);
      setSelectedStudent(null);
      assignLessonForm.reset();
      setError('');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Không thể giao bài học'),
  });

  const deleteStudentMutation = useMutation({
    mutationFn: (email: string) => instructorApi.deleteStudent(email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });

  const onAddStudentSubmit = (values: z.infer<typeof addStudentSchema>) => {
    setError('');
    addStudentMutation.mutate(values);
  };

  const onAssignLessonSubmit = (values: z.infer<typeof assignLessonSchema>) => {
    if (!selectedStudent) return;
    
    setError('');
    assignLessonMutation.mutate({
      studentEmail: selectedStudent.email,
      title: values.title,
      description: values.description || '',
    });
  };

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold">Lớp học</a>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="font-medium">{user?.name}</div>
              <div className="text-sm">Giảng viên</div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <Users className="h-8 w-8" />
              <div>
                <div className="text-3xl font-bold">{students.length}</div>
                <div className="text-sm">Tổng số học viên</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <BookOpen className="h-8 w-8" />
              <div>
                <div className="text-3xl font-bold">
                  {students.filter((s: Student) => s.isAccountSetup).length}
                </div>
                <div className="text-sm">Học viên hoạt động</div>
              </div>
            </CardContent>
          </Card>
        </div>


        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Học viên</CardTitle>
            <Button onClick={() => setShowAddStudent(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm học viên
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin h-8 w-8 border-b-2"></div>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Chưa có học viên</h3>
                <p>Thêm học viên đầu tiên để bắt đầu</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Đang học</TableHead>
                    <TableHead>Hoàn thành</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: Student & { lessonCount?: number; inProgressCount?: number; completedCount?: number }) => (
                    <TableRow key={student.email}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        <Badge variant={student.isAccountSetup ? 'success' : 'warning'}>
                          {student.isAccountSetup ? 'Hoạt động' : 'Chờ kích hoạt'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{student.inProgressCount || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">{student.completedCount || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowAssignLesson(true);
                            }}
                          >
                            <BookOpen className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/chat/${encodeURIComponent(student.email)}`)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              // confirm before delete
                              if (confirm('Bạn có chắc chắn muốn xóa học viên này?')) {
                                deleteStudentMutation.mutate(student.email);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>


      <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm học viên mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin chi tiết học viên bên dưới. Một email mời sẽ được gửi.
            </DialogDescription>
          </DialogHeader>
          <Form {...addStudentForm}>
            <form onSubmit={addStudentForm.handleSubmit(onAddStudentSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                  {error}
                </div>
              )}
              <FormField
                control={addStudentForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addStudentForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="student@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddStudent(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={addStudentMutation.isPending}>
                  {addStudentMutation.isPending ? 'Đang thêm...' : 'Thêm học viên'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>


      <Dialog open={showAssignLesson} onOpenChange={setShowAssignLesson}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Giao bài học cho {selectedStudent?.name}</DialogTitle>
            <DialogDescription>
              Tạo bài tập mới cho học viên này.
            </DialogDescription>
          </DialogHeader>
          <Form {...assignLessonForm}>
            <form onSubmit={assignLessonForm.handleSubmit(onAssignLessonSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                  {error}
                </div>
              )}
              <FormField
                control={assignLessonForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiêu đề bài học</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assignLessonForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAssignLesson(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={assignLessonMutation.isPending}>
                  {assignLessonMutation.isPending ? 'Đang giao...' : 'Giao bài học'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
