'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { authApi } from '@/services/api';

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

const setupSchema = z.object({
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ["confirmPassword"],
});

function SetupAccountForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentId = searchParams.get('id');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof setupSchema>>({
    resolver: zodResolver(setupSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  // check if student ID exists in URL
  if (!studentId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <CardTitle>Đường dẫn không hợp lệ</CardTitle>
            <CardDescription className="text-destructive">
              Đường dẫn tạo không hợp lệ. Vui lòng kiểm tra email của bạn để lấy đường dẫn đúng.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push('/login')}>
              Đến trang đăng nhập
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = async (values: z.infer<typeof setupSchema>) => {
    setError('');
    setLoading(true);

    try {
      await authApi.setupAccount(studentId, values.password);
      setSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tạo tài khoản';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  // show success screen after account setup
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
            <CardTitle>Tài khoản đã được tạo!</CardTitle>
            <CardDescription>
              Tài khoản của bạn đã được tạo thành công. Bạn có thể đăng nhập bằng email của mình.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push('/login')}>
              Đến trang đăng nhập
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl"> Lớp học</CardTitle>
          <CardDescription> lập tài khoản để bắt đầu</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tạo mật khẩu</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Nhập mật khẩu " {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Ít nhất 6 ký tự</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Xác nhận mật khẩu</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Nhập lại mật khẩu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SetupAccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2"></div>
      </div>
    }>
      <SetupAccountForm />
    </Suspense>
  );
}
