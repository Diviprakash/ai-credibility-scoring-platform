import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically inject Bearer token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle HTTP 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Dispatch custom event so AuthContext can sync state if needed
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// Centralized Auth API Methods matching exact backend endpoints
export const loginApi = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
};

export const registerApi = async (userData) => {
  const response = await api.post('/api/auth/register', userData);
  return response.data;
};

export const getMeApi = async () => {
  const response = await api.get('/api/auth/me');
  return response.data;
};

// Conductor Event Management API Methods
export const getConductorEventsApi = async () => {
  const response = await api.get('/api/conductor/events');
  return response.data;
};

export const getConductorEventDetailApi = async (eventId) => {
  const response = await api.get(`/api/conductor/events/${eventId}`);
  return response.data;
};

export const createConductorEventApi = async (eventData) => {
  const response = await api.post('/api/conductor/events', eventData);
  return response.data;
};

export const updateConductorEventApi = async (eventId, eventData) => {
  const response = await api.patch(`/api/conductor/events/${eventId}`, eventData);
  return response.data;
};

export const updateConductorEventStatusApi = async (eventId, status) => {
  const response = await api.patch(`/api/conductor/events/${eventId}/status`, { status });
  return response.data;
};

// Candidate Event Browsing & Voting API Methods
export const getCandidateEventsApi = async () => {
  const response = await api.get('/api/candidate/events');
  return response.data;
};

export const getCandidateEventDetailApi = async (eventId) => {
  const response = await api.get(`/api/candidate/events/${eventId}`);
  return response.data;
};

export const joinCandidateEventApi = async (eventId) => {
  const response = await api.post(`/api/candidate/events/${eventId}/join`);
  return response.data;
};

export const submitCandidateVoteApi = async (eventId, votePayload) => {
  const response = await api.post(`/api/candidate/events/${eventId}/vote`, votePayload);
  return response.data;
};

export const getMyVoteApi = async (eventId) => {
  const response = await api.get(`/api/candidate/events/${eventId}/my-vote`);
  return response.data;
};

// Election Results API Method (Consumes GET /api/events/{event_id}/results)
export const getEventResultsApi = async (eventId) => {
  const response = await api.get(`/api/events/${eventId}/results`);
  return response.data;
};

export default api;
