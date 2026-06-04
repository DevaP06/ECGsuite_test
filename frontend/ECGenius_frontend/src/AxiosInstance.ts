import axios from "axios";

const AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor to automatically inject Authorization header
AxiosInstance.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem("ecg:session");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.token) {
          config.headers = config.headers || {};
          if (!config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${parsed.token}`;
          }
        }
      }
    } catch (error) {
      console.error("Error reading or parsing ecg:session from localStorage:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default AxiosInstance;