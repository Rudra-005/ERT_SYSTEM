/**
 * Axios Configuration with 400ms Timeout
 * Enforces hard timeout on all API requests
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';
const FASTAPI_BASE_URL = 'http://localhost:8000';
const REQUEST_TIMEOUT = 400; // 400ms hard timeout

// Create axios instance for Node.js backend
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Create axios instance for FastAPI backend
export const ragClient = axios.create({
  baseURL: FASTAPI_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to log start time
apiClient.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: performance.now() };
    return config;
  },
  (error) => Promise.reject(error)
);

ragClient.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: performance.now() };
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to track latency
apiClient.interceptors.response.use(
  (response) => {
    const endTime = performance.now();
    const latency = endTime - response.config.metadata.startTime;
    
    // Store latency for dashboard
    if (window.latencyTracker) {
      window.latencyTracker.addEntry({
        route: response.config.url,
        latency_ms: latency,
        timestamp: Date.now()
      });
    }
    
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error(`❌ Request timeout: ${error.config.url} exceeded 400ms`);
      
      // Store timeout violation
      if (window.latencyTracker) {
        window.latencyTracker.addEntry({
          route: error.config.url,
          latency_ms: 400,
          timeout: true,
          timestamp: Date.now()
        });
      }
      
      // Return fallback response
      return Promise.reject({
        message: 'Unable to complete request within 400ms. Please try again.',
        timeout: true
      });
    }
    
    return Promise.reject(error);
  }
);

ragClient.interceptors.response.use(
  (response) => {
    const endTime = performance.now();
    const latency = endTime - response.config.metadata.startTime;
    
    if (window.latencyTracker) {
      window.latencyTracker.addEntry({
        route: response.config.url,
        latency_ms: latency,
        timestamp: Date.now()
      });
    }
    
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error(`❌ Request timeout: ${error.config.url} exceeded 400ms`);
      
      if (window.latencyTracker) {
        window.latencyTracker.addEntry({
          route: error.config.url,
          latency_ms: 400,
          timeout: true,
          timestamp: Date.now()
        });
      }
      
      return Promise.reject({
        message: 'Unable to complete request within 400ms. Please try again.',
        timeout: true
      });
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
