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

const AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    accept: "application/json"
  },
});

export default AxiosInstance;
// in applications import as api
