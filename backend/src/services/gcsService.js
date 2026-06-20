import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

const GCS_PROXY_URL = process.env.GCS_PROXY_URL;
const INTERNAL_KEY = process.env.INTERNAL_API_KEY;

export async function uploadToGCS(localFilePath, destinationName) {
  if (!GCS_PROXY_URL) return null;

  const form = new FormData();
  form.append('file', fs.createReadStream(localFilePath));
  form.append('fileName', destinationName);

  const response = await axios.post(GCS_PROXY_URL, form, {
    headers: {
      ...form.getHeaders(),
      ...(INTERNAL_KEY ? { 'X-Internal-Key': INTERNAL_KEY } : {}),
    },
    maxBodyLength: 25 * 1024 * 1024,
    timeout: 30000,
  });

  return response.data?.storageUrl ?? null;
}

export async function deleteFromGCS(gcsUrl) {
  if (!GCS_PROXY_URL || !gcsUrl) return;

  await axios.delete(GCS_PROXY_URL, {
    data: { filePath: gcsUrl },
    headers: {
      'Content-Type': 'application/json',
      ...(INTERNAL_KEY ? { 'X-Internal-Key': INTERNAL_KEY } : {}),
    },
    timeout: 10000,
  }).catch(() => {});
}

export function isGCSConfigured() {
  return !!GCS_PROXY_URL;
}
