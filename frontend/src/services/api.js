import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
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
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data)
};

export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => {
    return api.post('/tasks', data);
  },
  update: (id, data) => {
    return api.put(`/tasks/${id}`, data);
  },
  assign: (id, data) => api.post(`/tasks/${id}/assign`, data),
  accept: (id) => api.post(`/tasks/${id}/accept`),
  start: (id) => api.post(`/tasks/${id}/start`),
  addNote: (id, data) => api.post(`/tasks/${id}/notes`, data),
  complete: (id, data) => {
    return api.post(`/tasks/${id}/complete`, data);
  },
  approve: (id) => api.post(`/tasks/${id}/approve`),
  reopen: (id) => api.post(`/tasks/${id}/reopen`),
  delete: (id) => api.delete(`/tasks/${id}`),
  resetAll: () => api.post('/tasks/reset-all'),
  clarify: (id, data) => api.post(`/tasks/${id}/clarify`, data),
  respond: (id, data) => api.post(`/tasks/${id}/respond`, data)
};

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
  getActivity: () => api.get('/dashboard/activity')
};

export default api;
