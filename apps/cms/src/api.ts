import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on the login page
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const login = (credentials: { username: string; password?: string; totp_code?: string; totp_secret_setup?: string }) => 
  axios.post(`${API_URL}/token/`, credentials);

export const verifyToken = (token: string) => 
  axios.post(`${API_URL}/token/verify/`, { token });

export const getProjects = () => api.get('/projects/?page_size=100');
export const createProject = (data: any) => api.post('/projects/', data);
export const deleteProject = (id: number) => api.delete(`/projects/${id}/`);
export const getBlogs = () => api.get('/blogs/?page_size=100');
export const createBlog = (data: any) => api.post('/blogs/', data);
export const deleteBlog = (id: number) => api.delete(`/blogs/${id}/`);
export const getProfile = () => api.get('/profile/');
export const updateProfile = (data: any) => api.patch('/profile/', data);

export default api;
