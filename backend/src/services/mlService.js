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
  // Trailing slashes would produce '//predict' (→ 404 on FastAPI), so normalize.
  const flaskUrl = (process.env.FLASK_URL || "").replace(/\/+$/, "");
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
        // Full pipeline (digitize + model + ontology) runs ~60-90s on CPU.
        // Allow up to 4 min; Vercel Fluid functions cap at 5 min, so axios fails
        // gracefully before the function itself is killed.
        timeout: 240000,
      });

      return response.data;
    } catch (err) {
      const isLast = attempt === MAX_RETRIES;

      // A timeout means ml-api is UP but the inference is taking too long.
      // Retrying just re-runs the heavy ~75s job (and burns the function budget),
      // so give up gracefully → caller saves the analysis as "pending".
      const isTimeout =
        err.code === "ECONNABORTED" || /timeout/i.test(err.message || "");
      if (isTimeout) return null;

      // Connection refused/reset = ml-api truly unreachable or mid-restart →
      // a brief retry is worthwhile (e.g. digitizer restarting).
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

      // Non-retryable error (4xx/5xx from ml-api) — surface it.
      throw err;
    }
  }

  return null;
}

// Re-run only the ontology stage against already-computed model probabilities
// plus patient clinical context. No image/digitizer/model inference — used when
// the clinical-context questionnaire is submitted to refine an existing
// diagnosis. Returns the ml-api response ({ ontology }) or null if ml-api is
// unreachable (same convention as predictECG).
export async function refineOntology(labelProbabilities, patient, patientEvidence) {
  // Trailing slashes would produce '//predict' (→ 404 on FastAPI), so normalize.
  const flaskUrl = (process.env.FLASK_URL || "").replace(/\/+$/, "");
  if (!flaskUrl) throw new Error("FLASK_URL is not set in environment");

  const internalKey = process.env.INTERNAL_API_KEY;
  const payload = {
    label_probabilities: labelProbabilities,
    patient,
    patient_evidence: patientEvidence,
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(`${flaskUrl}/refine`, payload, {
        headers: {
          "Content-Type": "application/json",
          ...(internalKey ? { "X-Internal-Key": internalKey } : {}),
        },
        timeout: 60000,
      });
      return response.data;
    } catch (err) {
      const isLast = attempt === MAX_RETRIES;
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
      throw err;
    }
  }

  return null;
}
