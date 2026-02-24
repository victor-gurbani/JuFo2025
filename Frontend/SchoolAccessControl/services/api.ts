import axios from "axios";
import Constants from "expo-constants";

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

const api = axios.create({
  baseURL: getBaseURL(),
});

// Add JWT token interceptor
api.interceptors.request.use(async (config) => {
  try {
    // Try to get token from AsyncStorage or memory
    // For now, we'll check if there's a token in the config
    const token = (global as any).__authToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Error adding auth token:", error);
  }
  return config;
});

// Add response error handler for 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      (global as any).__authToken = null;
      // Navigation will be handled by the app's login flow
    }
    return Promise.reject(error);
  }
);

export default api;
export { getBaseURL };
