// AxiosInstance.ts
import axios from 'axios';

let baseURL: string;
const isDevelopment = import.meta.env.MODE === "development"

if(isDevelopment){
  baseURL = import.meta.env.VITE_API_BASE_URL_LOCAL
}
else{
  baseURL =  import.meta.env.VITE_API_BASE_URL_DEPLOY
}

console.log('Environment mode:', import.meta.env.MODE);
console.log('Is development:', isDevelopment);
console.log('Base URL being used:', baseURL);

const AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    accept: "application/json"
  },
});

// Add request interceptor for debugging
AxiosInstance.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.baseURL + config.url);
    console.log('Request config:', config);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
AxiosInstance.interceptors.response.use(
  (response) => {
    console.log('Response received:', response);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    console.error('Response error data:', error.response?.data);
    console.error('Response error status:', error.response?.status);
    return Promise.reject(error);
  }
);

export default AxiosInstance;
// in applications import as api
