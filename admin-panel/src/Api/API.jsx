import axios from "axios";
import toast from "react-hot-toast";

const API = axios.create({
  baseURL: import.meta.env.VITE_BASEURL || "http://localhost:8080/api/v1",
});

API.interceptors.request.use(
  (config) => {
    try {
      const localData = localStorage.getItem("appData");
      if (localData) {
        const appData = JSON.parse(localData);
        if (appData?.token) {
          config.headers.Authorization = appData.token.startsWith("Bearer ")
            ? appData.token
            : `Bearer ${appData.token}`;
        }
      }
    } catch (error) {
      console.warn("Admin Interceptor Warning:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        const msg = error.response.data?.message || "";
        if (msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("invalid token")) {
          localStorage.removeItem("appData");
          toast.error("Admin session expired. Please log in again.");
          if (window.location.pathname !== "/") {
            setTimeout(() => {
              window.location.href = "/";
            }, 1000);
          }
        }
      }

      if (error.response.status === 429) {
        const rateLimitMsg =
          error.response.data?.message ||
          "Rate limit exceeded. Please wait a moment before trying again.";
        toast.error(rateLimitMsg);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
