import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_BASEURL || "http://localhost:8080",
});

API.interceptors.request.use(
  (config) => {
    try {
      // Yahan se 'appData' nikal rahe hain jo login ke waqt save hota hai
      const localData = localStorage.getItem("appData");
      if (localData) {
        const appData = JSON.parse(localData);
        if (appData?.token) {
          config.headers.Authorization = appData.token;
        }
      }
    } catch (error) {
      console.log("Interceptor Error:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;