import axios from "axios";
import { useAuthStore } from "@/store/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (data: any) => api.post("/auth/login", data),
  signup: (data: any) => api.post("/auth/signup", data),
  getMe: () => api.get("/auth/me"),
  updateOrg: (data: { org_name: string }) => api.patch("/auth/update-org", data),
  requestAccess: () => api.patch("/auth/request-access"),
};

export const orgApi = {
  get: () => api.get("/org"),
  update: (data: { name: string }) => api.patch("/org", data),
  getStats: () => api.get("/org/stats"),
  getRecentLogs: () => api.get("/org/logs/recent"),
  getUsers: () => api.get("/org/users"),
  approveUser: (userId: string) => api.patch(`/org/users/${userId}/approve`),
  declineUser: (userId: string) => api.patch(`/org/users/${userId}/decline`),
  removeUser: (userId: string) => api.delete(`/org/users/${userId}`),
};

export const apiKeyApi = {
  getKeys: () => api.get("/api-key"),
  createKey: () => api.post("/api-key"),
  revokeKey: (id: string) => api.delete(`/api-key/${id}`),
};

export const verifyApi = {
  verifyEmail: (email: string) => api.get(`/v1/email/verify?email=${encodeURIComponent(email)}`),
};

export default api;
