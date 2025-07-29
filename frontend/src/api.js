import axios from 'axios';

// Configure axios base URL for different environments
const baseURL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || 'https://student-management-backend.onrender.com'
  : '';

const api = axios.create({
  baseURL,
  timeout: 30000, // Increased timeout for slower connections
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging and timing
api.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: new Date() };
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and timing
api.interceptors.response.use(
  (response) => {
    const endTime = new Date();
    const duration = endTime - response.config.metadata.startTime;
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    
    if (duration > 3000) {
      console.warn(`⚠️ Slow API response detected: ${duration}ms`);
    }
    
    return response;
  },
  (error) => {
    const endTime = new Date();
    const duration = error.config?.metadata ? endTime - error.config.metadata.startTime : 'unknown';
    console.error(`❌ API Error: ${error.response?.status} ${error.config?.url} - ${duration}ms`, error.response?.data);
    return Promise.reject(error);
  }
);

export default api;