import { CustomError } from "@/types/custom-error.type";
import axios, { AxiosError } from "axios";
import { getAccessToken, getRefreshToken, setTokens, clearTokens, isTokenExpired } from "./token-manager";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const options = {
  baseURL,
  timeout: 10000,
};

const API = axios.create(options);

// Request interceptor to add Authorization header
API.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && !isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (refreshToken && !isTokenExpired(refreshToken)) {
          const response = await axios.post(`${baseURL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          setTokens(accessToken, newRefreshToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return API(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearTokens();
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const { data, status } = error.response || {};

    if (status === 401) {
      clearTokens();
      window.location.href = "/";
    }

    const customError: CustomError = {
      ...error,
      errorCode: (data as any)?.errorCode || "UNKNOWN_ERROR",
    };

    return Promise.reject(customError);
  }
);

export default API;
