import axios from 'axios';

// Use relative paths – Netlify will proxy to backend
const API = axios.create({ baseURL: '' });

export const fetchProjects = () => API.get('/api/projects');
export const fetchProject = (id) => API.get(`/api/projects/${id}`);
export const refreshProject = (id) => API.post(`/api/projects/refresh/${id}`);
export const discoverProjects = () => API.post('/api/projects/discover');