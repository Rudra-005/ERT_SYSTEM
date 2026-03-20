import api from '../config/axios';
const API_BASE = 'http://localhost:5000/api';

class ApiError extends Error {
  constructor(message, statusCode, data) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
  }
}

const handleApiCall = async (callPromise) => {
  try {
    const response = await callPromise;
    // Dispatch a global event for the LatencyBadge fixed UI to catch
    if (response.data && response.data._client_latency) {
       const event = new CustomEvent('api-latency-update', { detail: { latency: response.data._client_latency } });
       window.dispatchEvent(event);
    }
    return response.data;
  } catch (error) {
    if (error.isTimeout) {
      throw new ApiError(error.message, 408, null);
    }
    throw new ApiError(
      error.response?.data?.error || 'Request failed',
      error.response?.status || 500,
      error.response?.data || null
    );
  }
};

export async function processTriage(patientHistory, emergencyDescription) {
  return handleApiCall(api.post(`${API_BASE}/triage`, { patientHistory, emergencyDescription }));
}

export async function processDetailedTriage(patientHistory, emergencyDescription) {
  return handleApiCall(api.post(`${API_BASE}/triage/detailed`, { patientHistory, emergencyDescription }));
}

export async function compareApproaches(patientHistory, emergencyDescription) {
  return handleApiCall(api.post(`${API_BASE}/compare`, { patientHistory, emergencyDescription }));
}

export async function getLogs(limit = 10) {
  return handleApiCall(api.get(`${API_BASE}/logs`, { params: { limit } }));
}

export async function getHistory(limit = 20) {
  return handleApiCall(api.get(`${API_BASE}/history`, { params: { limit } }));
}

export async function saveCaseHistory(caseData) {
  return handleApiCall(api.post(`${API_BASE}/history`, caseData));
}

export async function checkHealth() {
  return handleApiCall(api.get('http://localhost:5000/health'));
}

export { ApiError };
