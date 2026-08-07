import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true, // send httpOnly refresh cookie
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(
              `${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/auth/refresh`,
              {},
              { withCredentials: true }
            )
            .then((res) => {
              const token = res.data.data.accessToken as string;
              const user = res.data.data.user;
              if (user) useAuthStore.getState().setAuth(user, token);
              else useAuthStore.getState().setAccessToken(token);
              return token;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const newToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().clearAuth();
      }
    }
    return Promise.reject(error);
  }
);
