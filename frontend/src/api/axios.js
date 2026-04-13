import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

/**
 * Get the current user's token from localStorage
 * This ensures each request uses the most up-to-date token
 */
const getAuthToken = () => {
  const storedUser = localStorage.getItem('user') || localStorage.getItem('dtms_user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return user.token || null;
    } catch {
      return null;
    }
  }
  return null;
};

// Request interceptor: Attach JWT token to every request
API.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};
    const token = getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 errors gracefully
// Only clear session if token is truly invalid/expired
let isHandling401 = false;

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // Only logout if it's truly a 401 (Unauthorized/Token Invalid)
    // and we have a token stored (not already logged out)
    if (status === 401) {
      const token = getAuthToken();
      if (token && !isHandling401) {
        isHandling401 = true;
        // Clear session only if user was authenticated
        localStorage.removeItem('user');
        localStorage.removeItem('dtms_user');
        // Redirect to login after a short delay to allow state updates
        setTimeout(() => {
          window.location.href = '/login';
          isHandling401 = false;
        }, 100);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
