import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

export const fetchProjects = () => API.get('/projects');
export const fetchProject = (id) => API.get(`/projects/${id}`);
export const refreshProject = (id) => API.post(`/projects/refresh/${id}`);
export const discoverProjects = () => API.post('/projects/discover');
