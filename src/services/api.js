import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (token expired)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          const { access } = res.data;
          localStorage.setItem('access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed — clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth ──
export const authAPI = {
  login: (email, password, role = '') =>
    api.post('/auth/login/', { email, password, role }),
  verifyOTP: (email, otp) =>
    api.post('/auth/verify-otp/', { email, otp }),
  resendOTP: (email) =>
    api.post('/auth/resend-otp/', { email }),
  getProfile: () =>
    api.get('/auth/profile/'),
  getSupervisors: () =>
    api.get('/auth/supervisors/'),
  getMembers: () =>
    api.get('/auth/members/'),
  addMember: (data) =>
    api.post('/auth/members/add/', data),
  getAdditionLogs: () =>
    api.get('/auth/members/addition-logs/'),
  // Worker Management
  getWorkers: () =>
    api.get('/auth/workers/'),
  getWorkerRequests: () =>
    api.get('/auth/workers/requests/'),
  createWorkerRequest: (data) =>
    api.post('/auth/workers/requests/', data),
  approveWorkerRequest: (id, action, reason = '') =>
    api.post(`/auth/workers/requests/${id}/approve/`, { action, reason }),
  getWorkerAuditLogs: () =>
    api.get('/auth/workers/audit-logs/'),
  updateWorker: (id, data) =>
    api.patch(`/auth/workers/${id}/`, data),
  deleteWorker: (id) =>
    api.delete(`/auth/workers/${id}/`),
};

// ── User Management (Admin only) ──
export const usersAPI = {
  list: (params = {}) =>
    api.get('/auth/users/', { params }),
  create: (data) =>
    api.post('/auth/users/create/', data),
  delete: (id) =>
    api.delete(`/auth/users/${id}/delete/`),
  resetPassword: (id, newPassword) =>
    api.post(`/auth/users/${id}/reset-password/`, { password: newPassword }),
};

// ── Issues ──
export const issuesAPI = {
  list: (params = {}) =>
    api.get('/issues/', { params }),
  get: (id) =>
    api.get(`/issues/${id}/`),
  create: (data) =>
    api.post('/issues/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id, data) =>
    api.patch(`/issues/${id}/`, data),
  assign: (id, supervisorId) =>
    api.post(`/issues/${id}/assign/`, { supervisor_id: supervisorId }),
  assignMember: (id, data) =>
    api.post(`/issues/${id}/assign-member/`, data),
  analytics: () =>
    api.get('/issues/analytics/'),
};

// ── Materials ──
export const materialsAPI = {
  list: () =>
    api.get('/materials/'),
  create: (data) =>
    api.post('/materials/', data),
  action: (id, action, quantity) =>
    api.post(`/materials/${id}/action/`, { action, quantity }),
  update: (id, data) =>
    api.patch(`/materials/${id}/`, data),
  delete: (id) =>
    api.delete(`/materials/${id}/`),
  getTransactions: () =>
    api.get('/transactions/'),
};

// ── Material Usage ──
export const materialUsageAPI = {
  list: (issueId) =>
    api.get('/material-usage/', { params: { issue_id: issueId } }),
  create: (data) =>
    api.post('/material-usage/', data),
};

// ── Material Requests ──
export const materialRequestsAPI = {
  list: () =>
    api.get('/material-requests/'),
  create: (data) =>
    api.post('/material-requests/', data),
  update: (id, data) =>
    api.patch(`/material-requests/${id}/`, data),
};

// ── Notifications ──
export const notificationsAPI = {
  list: () =>
    api.get('/notifications/'),
  markRead: (id) =>
    api.patch(`/notifications/${id}/read/`),
  markAllRead: () =>
    api.post('/notifications/mark-all-read/'),
};

export default api;
