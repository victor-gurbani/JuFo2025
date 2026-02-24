import axios from "axios";
import Constants from "expo-constants";
import { setToken, getToken, deleteToken } from './storage';

const getBaseURL = () => {
  // Try to get from app config, fallback to localhost:3000 for development
  const configURL = Constants.expoConfig?.extra?.apiBaseUrl;
  if (configURL) return configURL;
  
  // Development fallback
  if (__DEV__) {
    return "http://localhost:3000";
  }
  
  return "http://localhost:3000"; // fallback
};

// Helper to decode JWT (basic implementation for standard JWT structure)
const decodeToken = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    return decoded;
  } catch (error) {
    return null;
  }
};

// Store for user info from token
const authState = {
  token: null as string | null,
  user: null as any,
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Add JWT token interceptor
api.interceptors.request.use(async (config) => {
  try {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Decode and store user info if not already decoded
      if (!authState.user && !authState.token) {
        const decoded = decodeToken(token);
        if (decoded) {
          authState.user = decoded;
          authState.token = token;
        }
      }
    }
  } catch (error) {
    console.error("Error adding auth token:", error);
  }
  return config;
});

// Add response error handler for 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      await deleteToken();
      authState.token = null;
      authState.user = null;
      // Navigation will be handled by the app's login flow
    }
    return Promise.reject(error);
  }
);

// Helper to get current user ID from token
const getUserId = async () => {
  const token = await getToken();
  if (token && !authState.user) {
    const decoded = decodeToken(token);
    if (decoded) {
      authState.user = decoded;
    }
  }
  return authState.user?.id || null;
};

export default api;
export { getBaseURL, getUserId, authState };
