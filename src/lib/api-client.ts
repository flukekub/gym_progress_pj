import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err?.response?.data?.error ?? err?.message ?? "Unknown error";
    return Promise.reject(new Error(message));
  }
);
