import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';
const API = axios.create({ baseURL: API_URL });

export const fetchProjects = () => API.get('/projects');
export const fetchProject = (id) => API.get(`/projects/${id}`);
export const refreshProject = (id) => API.post(`/projects/refresh/${id}`);
export const discoverProjects = () => API.post('/projects/discover');