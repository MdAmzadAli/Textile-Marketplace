import { api } from "./api";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace("/api", "");

export async function uploadImages(files: File[]) {
  const formData = new FormData();
  files.forEach((f) => formData.append("images", f));
  const res = await api.post<{ data: { urls: string[] } }>("/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data.urls.map((url) => `${API_ORIGIN}${url}`);
}
