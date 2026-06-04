import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const ML_API_URL = "http://127.0.0.1:8001/predict";

export async function predictECG(filePath) {
  const form = new FormData();

  form.append("file", fs.createReadStream(filePath));

  const response = await axios.post(ML_API_URL, form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  return response.data;
}