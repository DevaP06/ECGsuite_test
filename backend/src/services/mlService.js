import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function predictECG(filePath, age, gender) {
  const flaskUrl = process.env.FLASK_URL;
  if (!flaskUrl) throw new Error("FLASK_URL is not set in environment");

  const internalKey = process.env.INTERNAL_API_KEY;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));
    if (age !== undefined) form.append("age", String(age));
    if (gender !== undefined) form.append("gender", String(gender));

    try {
      const response = await axios.post(`${flaskUrl}/analyze-ecg`, form, {
        headers: {
          ...form.getHeaders(),
          ...(internalKey ? { "X-Internal-Key": internalKey } : {}),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 30000,
      });

      return response.data;
    } catch (err) {
      const isLast = attempt === MAX_RETRIES;
      const isFlaskDown =
        err.code === "ECONNREFUSED" ||
        err.code === "ECONNRESET" ||
        err.code === "ETIMEDOUT" ||
        err.response?.status >= 500;

      if (isFlaskDown && isLast) return null;
      if (isFlaskDown && !isLast) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }

      // Non-retryable error (4xx, bad request, etc.)
      throw err;
    }
  }

  return null;
}
