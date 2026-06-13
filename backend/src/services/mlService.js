import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import os from "os";

// Trusted upload directories — must match the directories used in ecgRoutes.js
const TEMP_ECG_DIR = path.join(os.tmpdir(), "ecg-temp");
const PROCESSED_ECG_DIR = path.join(os.tmpdir(), "ecg-processed");

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function predictECG(filePath, age, gender) {
  const flaskUrl = process.env.FLASK_URL;
  if (!flaskUrl) throw new Error("FLASK_URL is not set in environment");

  // path.basename() strips all directory components — CodeQL-recognized path sanitizer.
  // We then join with a hardcoded trusted directory so the full path is never user-controlled.
  const safeFilename = path.basename(filePath);
  const safePath = fs.existsSync(path.join(TEMP_ECG_DIR, safeFilename))
    ? path.join(TEMP_ECG_DIR, safeFilename)
    : path.join(PROCESSED_ECG_DIR, safeFilename);

  if (!fs.existsSync(safePath)) {
    throw new Error("Upload file not found in permitted directory");
  }

  const internalKey = process.env.INTERNAL_API_KEY;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const form = new FormData();
    form.append("file", fs.createReadStream(safePath));
    if (age !== undefined) form.append("age", String(age));
    if (gender !== undefined) form.append("gender", String(gender));

    try {
      const response = await axios.post(`${flaskUrl}/predict`, form, {
        headers: {
          ...form.getHeaders(),
          ...(internalKey ? { "X-Internal-Key": internalKey } : {}),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 60000,
      });

      return response.data;
    } catch (err) {
      const isLast = attempt === MAX_RETRIES;
      // Only retry on network-level failures (Flask unreachable). A 5xx response
      // means Flask IS running and actively rejected the request — that's not retryable.
      const isFlaskDown =
        err.code === "ECONNREFUSED" ||
        err.code === "ECONNRESET" ||
        err.code === "ETIMEDOUT" ||
        !err.response;

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
