import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API helper functions
export const api = {
  // Authentication
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return response.data;
  },

  // Students (for parent viewing their children)
  getMyChildren: async () => {
    const response = await apiClient.get('/students/my-children');
    return response.data;
  },

  getStudent: async (id: string) => {
    const response = await apiClient.get(`/students/${id}`);
    return response.data;
  },

  // Attendance
  getStudentAttendance: async (studentId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    params.append('studentId', studentId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(`/attendance/students?${params.toString()}`);
    return response.data;
  },

  getStudentAttendanceReport: async (studentId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    params.append('studentId', studentId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(`/attendance/students/report?${params.toString()}`);
    return response.data;
  },

  // Fees & Payments
  getStudentInvoices: async (studentId: string) => {
    const response = await apiClient.get(`/fees/invoices?studentId=${studentId}`);
    return response.data;
  },

  getInvoice: async (id: string) => {
    const response = await apiClient.get(`/fees/invoices/${id}`);
    return response.data;
  },

  getStudentPayments: async (studentId: string) => {
    const response = await apiClient.get(`/fees/payments?studentId=${studentId}`);
    return response.data;
  },

  initiateSTKPush: async (data: {
    invoiceId: string;
    phoneNumber: string;
    amount: number;
  }) => {
    const response = await apiClient.post('/mpesa/stk-push', data);
    return response.data;
  },

  // Examinations & Grades
  getStudentGrades: async (studentId: string, termId?: string) => {
    const params = new URLSearchParams();
    params.append('studentId', studentId);
    if (termId) params.append('termId', termId);
    
    const response = await apiClient.get(`/examinations/grades/query?${params.toString()}`);
    return response.data;
  },

  getStudentReportCards: async (studentId: string) => {
    const response = await apiClient.get(`/examinations/report-cards?studentId=${studentId}`);
    return response.data;
  },

  getReportCard: async (id: string) => {
    const response = await apiClient.get(`/examinations/report-cards/${id}`);
    return response.data;
  },

  // Terms
  getCurrentTerm: async () => {
    const response = await apiClient.get('/terms/current');
    return response.data;
  },
};

export default apiClient;
