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
    const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    console.log('Making API request to:', fullUrl);
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
    console.log('API Response received successfully');
    return response;
  },
  (error) => {
    console.error('API Response error:', error);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export default AxiosInstance;
// in applications import as api
