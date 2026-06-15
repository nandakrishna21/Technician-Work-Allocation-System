import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me')
};

export const usersAPI = {
  getTechnicians: () => api.get('/users/technicians'),
  create: (data) => api.post('/users', data)
};

export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => {
    return api.post('/tasks', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data) => {
    return api.put(`/tasks/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  assign: (id, data) => api.post(`/tasks/${id}/assign`, data),
  accept: (id) => api.post(`/tasks/${id}/accept`),
  start: (id) => api.post(`/tasks/${id}/start`),
  addNote: (id, data) => api.post(`/tasks/${id}/notes`, data),
  complete: (id, data) => {
    return api.post(`/tasks/${id}/complete`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  approve: (id) => api.post(`/tasks/${id}/approve`),
  reopen: (id) => api.post(`/tasks/${id}/reopen`)
};

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
  getActivity: () => api.get('/dashboard/activity')
};

export { BASE_URL };
export default api;
