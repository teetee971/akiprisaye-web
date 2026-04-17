import axios from 'axios';
const apiClient = axios.create({
  baseURL: 'https://api.akiprisaye.workers.dev',
  headers: { 'Content-Type': 'application/json' },
});
export default apiClient;
