'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/services/api';
import { User, UserRole } from '@skipli/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const emailSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
});

const passwordSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

const verifySchema = z.object({
  accessCode: z.string().length(6, 'Mã xác nhận phải có 6 chữ số'),
});

type Step = 'email' | 'password' | 'verify';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();
  const [step, setStep] = useState<Step>('email');

  useEffect(() => {
    if (!isLoading && user) {
      router.push(user.role === 'instructor' ? '/instructor' : '/student');
    }
  }, [user, isLoading, router]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: '', password: '' },
  });

  const verifyForm = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
    defaultValues: { accessCode: '' },
  });

  const handleLoginSuccess = (res: { userType: string; user: unknown; token: string }) => {
    const role = (res.userType as UserRole) || 'student';
    const userData: User = (res.user as User) || {
      id: emailForm.getValues('email') || passwordForm.getValues('email'),
      email: emailForm.getValues('email') || passwordForm.getValues('email'),
      name: role === 'instructor' ? 'Giảng viên' : 'Học viên',
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (!userData.id) userData.id = userData.email;
    login(userData, res.token);
    router.push(role === 'instructor' ? '/instructor' : '/student');
  };

  async function onEmailSubmit(values: z.infer<typeof emailSchema>) {
    setError('');
    setLoading(true);
    try {
      await authApi.login(values.email);
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi mã');
    } finally {
      setLoading(false);
    }
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    setError('');
    setLoading(true);
    try {
      const res = await authApi.loginWithPassword(values.email, values.password);
      handleLoginSuccess(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đăng nhập');
    } finally {
      setLoading(false);
    }
  }

  async function onVerifySubmit(values: z.infer<typeof verifySchema>) {
    setError('');
    setLoading(true);
    try {
      const email = emailForm.getValues('email'); 
      const res = await authApi.verify(email, values.accessCode);
      handleLoginSuccess(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mã không hợp lệ');
      verifyForm.reset();
    } finally {
      setLoading(false);
    }
  }

  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const handleCodeChange = (idx: number, val: string) => {
    if (val.length > 1) return;
    const updated = [...codeDigits];
    updated[idx] = val;
    setCodeDigits(updated);
    
    verifyForm.setValue('accessCode', updated.join(''));

    if (val && idx < 5) {
      document.getElementById(`code-${idx + 1}`)?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardDescription>
            {step === 'verify' 
              ? 'Nhập mã 6 số đã gửi tới email của bạn'
              : 'Đăng nhập vào tài khoản'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 border text-destructive text-sm">
              {error}
            </div>
          )}

          {step === 'email' && (
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Địa chỉ Email</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Đang gửi...' : 'Gửi mã đăng nhập'}
                </Button>
                <div className="text-center text-sm">
                  <button 
                    type="button"
                    className="text-primary"
                    onClick={() => {
                        setStep('password');
                        const emailVal = emailForm.getValues('email');
                        if(emailVal) passwordForm.setValue('email', emailVal);
                    }}
                  >
                    Đăng nhập bằng mật khẩu
                  </button>
                </div>
              </form>
            </Form>
          )}

          {step === 'password' && (
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Địa chỉ Email</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Nhập mật khẩu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
                <div className="text-center text-sm">
                  <button 
                    type="button"
                    className="text-primary"
                    onClick={() => {
                        setStep('email');
                         const emailVal = passwordForm.getValues('email');
                         if(emailVal) emailForm.setValue('email', emailVal);
                    }}
                  >
                    Đăng nhập bằng mã xác nhận
                  </button>
                </div>
              </form>
            </Form>
          )}
            
          {step === 'verify' && (
            <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-4">
              <div className="flex justify-center gap-2">
                {codeDigits.map((digit, i) => (
                  <Input
                    key={i}
                    id={`code-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleCodeChange(i, e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && !digit && i > 0) {
                        document.getElementById(`code-${i - 1}`)?.focus();
                      }
                    }}
                    className="w-12 h-12 text-center text-lg font-semibold"
                  />
                ))}
              </div>
              {verifyForm.formState.errors.accessCode && (
                  <p className="text-sm text-destructive">{verifyForm.formState.errors.accessCode.message}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Đang xác thực...' : 'Xác nhận mã'}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep('email');
                  setCodeDigits(['', '', '', '', '', '']);
                  verifyForm.reset();
                  setError('');
                }}
              >
                Quay lại đăng nhập
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
