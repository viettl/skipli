import { getToken } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, { headers, ...options });
  const data = await res.json();
  
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('classroom_user');
      localStorage.removeItem('classroom_token');
      window.location.href = '/login';
    }
    throw new Error(data.error || 'An error occurred');
  }
  
  return data;
}

// auth endpoints
export const authApi = {
  login: (email: string) =>
    request('/login', { method: 'POST', body: JSON.stringify({ email }) }),

  loginWithPassword: (email: string, password: string) =>
    request<{ userType: string; user: unknown; token: string }>('/loginWithPassword', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),

  verify: (email: string, accessCode: string) =>
    request<{ userType: string; user: unknown; token: string }>('/verify', {
      method: 'POST', body: JSON.stringify({ email, accessCode }),
    }),

  setupAccount: (id: string, password: string) =>
    request<{ success: boolean; message: string }>('/setupAccount', {
      method: 'POST', body: JSON.stringify({ id, password }),
    }),
};


// instructor endpoints
export const instructorApi = {
  getStudents: () => request<{ students: unknown[] }>('/instructor/students'),

  getStudent: (email: string) =>
    request<{ student: unknown; lessons: unknown[] }>(`/instructor/student/${encodeURIComponent(email)}`),

  addStudent: (data: { name: string; email: string }) =>
    request<{ student: unknown }>('/instructor/addStudent', { method: 'POST', body: JSON.stringify(data) }),

  editStudent: (paramEmail: string, data: { name?: string; email?: string }) =>
    request(`/instructor/editStudent/${encodeURIComponent(paramEmail)}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteStudent: (email: string) =>
    request(`/instructor/student/${encodeURIComponent(email)}`, { method: 'DELETE' }),

  assignLesson: (data: { studentEmail: string; title: string; description: string }) =>
    request<{ lesson: unknown }>('/instructor/assignLesson', { method: 'POST', body: JSON.stringify(data) }),
};

// student endpoints
export const studentApi = {
  getMyLessons: () => request<{ lessons: unknown[] }>('/student/myLessons'),

  markLessonDone: (lessonId: string) =>
    request('/student/markLessonDone', { method: 'POST', body: JSON.stringify({ lessonId }) }),

  editProfile: (data: { name?: string; email?: string }) =>
    request<{ user: unknown }>('/student/editProfile', { method: 'PUT', body: JSON.stringify(data) }),
};
