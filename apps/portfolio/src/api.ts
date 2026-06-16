import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

export const getProjects = () => api.get('/projects/');
export const getBlogs = () => api.get('/blogs/');
export const getProfile = () => api.get('/profile/');
export const getProjectDetail = (id: number) => api.get(`/projects/${id}/`);
export const getBlogDetail = (id: number) => api.get(`/blogs/${id}/`);

export default api;
