import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.akiprisaye.workers.dev',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour le debug
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
