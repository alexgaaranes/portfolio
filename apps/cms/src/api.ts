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

export const login = (credentials: any) => axios.post(`${API_URL}/token/`, credentials);
export const getProjects = () => api.get('/projects/');
export const createProject = (data: any) => api.post('/projects/', data);
export const deleteProject = (id: number) => api.delete(`/projects/${id}/`);
export const getBlogs = () => api.get('/blogs/');
export const createBlog = (data: any) => api.post('/blogs/', data);
export const deleteBlog = (id: number) => api.delete(`/blogs/${id}/`);
export const getProfile = () => api.get('/profile/');
export const updateProfile = (data: any) => api.patch('/profile/', data);

export default api;
