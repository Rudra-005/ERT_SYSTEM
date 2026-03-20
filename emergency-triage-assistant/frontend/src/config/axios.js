import axios from 'axios';

// Create a globally configured axios instance targeted for strictly <400ms SLA
const api = axios.create({
  // Relaxed 10s timeout to allow for deep AI analysis and unique case generation
  timeout: 10000
});

// Interceptor to log all requests
api.interceptors.request.use((config) => {
  console.log(`📤 Request: ${config.method.toUpperCase()} ${config.url}`);
  config.metadata = { startTime: Date.now() };
  return config;
});

// Interceptor to handle responses and errors
api.interceptors.response.use(
  (response) => {
    const elapsed = Date.now() - response.config.metadata.startTime;
    console.log(`📥 Response (${elapsed}ms): ${response.status} from ${response.config.url}`);
    // Inject the raw latency measurement into the response data for the LatencyBadge
    if (response.config.metadata && response.config.metadata.startTime) {
       response.data._client_latency = elapsed;
    }
    return response;
  },
  (error) => {
    const elapsed = error.config?.metadata?.startTime ? Date.now() - error.config.metadata.startTime : 0;
    console.error(`❌ Error (${elapsed}ms):`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      error.message = "Response time exceeded. Please try again or use manual assessment.";
      error.isTimeout = true;
    }
    return Promise.reject(error);
  }
);

export default api;
