import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';

let storage;

function getStorage() {
  if (storage) return storage;

  const credentials = process.env.GCS_CREDENTIALS;
  if (credentials) {
    storage = new Storage({ credentials: JSON.parse(credentials) });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    storage = new Storage();
  } else {
    return null;
  }
  return storage;
}

function getBucket() {
  const bucketName = process.env.GCS_BUCKET_NAME;
  if (!bucketName) return null;
  const client = getStorage();
  if (!client) return null;
  return client.bucket(bucketName);
}

const GCS_FOLDER = process.env.GCS_UPLOAD_PREFIX || 'ecg-uploads';

export async function uploadToGCS(localFilePath, destinationName) {
  const bucket = getBucket();
  if (!bucket) return null;

  const destination = `${GCS_FOLDER}/${destinationName}`;
  await bucket.upload(localFilePath, {
    destination,
    metadata: {
      contentType: getContentType(destinationName),
    },
  });

  return `gs://${bucket.name}/${destination}`;
}

export async function deleteFromGCS(gcsUrl) {
  const bucket = getBucket();
  if (!bucket || !gcsUrl) return;

  const prefix = `gs://${bucket.name}/`;
  if (!gcsUrl.startsWith(prefix)) return;

  const filePath = gcsUrl.slice(prefix.length);
  try {
    await bucket.file(filePath).delete();
  } catch (err) {
    if (err.code !== 404) throw err;
  }
}

export function isGCSConfigured() {
  return !!(process.env.GCS_BUCKET_NAME && (process.env.GCS_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS));
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  return 'application/octet-stream';
}
