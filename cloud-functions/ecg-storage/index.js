const { Storage } = require('@google-cloud/storage');
const Busboy = require('busboy');

const storage = new Storage();
const BUCKET = process.env.GCS_BUCKET_NAME;
const UPLOAD_PREFIX = process.env.GCS_UPLOAD_PREFIX || 'ecg-uploads';
const INTERNAL_KEY = process.env.INTERNAL_API_KEY;

exports.ecgStorage = (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-Internal-Key');

  if (req.method === 'OPTIONS') return res.status(204).send('');

  if (INTERNAL_KEY && req.headers['x-internal-key'] !== INTERNAL_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (!BUCKET) {
    return res.status(500).json({ error: 'GCS_BUCKET_NAME not configured' });
  }

  if (req.method === 'DELETE') {
    return handleDelete(req, res);
  }

  if (req.method === 'POST') {
    return handleUpload(req, res);
  }

  res.status(405).json({ error: 'Method not allowed' });
};

function handleUpload(req, res) {
  const bb = Busboy({ headers: req.headers });
  let fileName = '';
  let uploadPromise = null;

  bb.on('field', (name, val) => {
    if (name === 'fileName') fileName = val;
  });

  bb.on('file', (fieldname, fileStream, info) => {
    if (!fileName) fileName = info.filename;
    const destination = `${UPLOAD_PREFIX}/${fileName}`;
    const blob = storage.bucket(BUCKET).file(destination);

    const writeStream = blob.createWriteStream({
      metadata: { contentType: info.mimeType },
      resumable: false,
    });

    uploadPromise = new Promise((resolve, reject) => {
      fileStream.pipe(writeStream)
        .on('error', reject)
        .on('finish', () => resolve(`gs://${BUCKET}/${destination}`));
    });
  });

  bb.on('finish', async () => {
    try {
      if (!uploadPromise) {
        return res.status(400).json({ error: 'No file received' });
      }
      const gcsUrl = await uploadPromise;
      res.status(200).json({ success: true, storageUrl: gcsUrl });
    } catch (err) {
      console.error('Upload failed:', err);
      res.status(500).json({ error: 'Upload to GCS failed' });
    }
  });

  bb.on('error', (err) => {
    console.error('Busboy error:', err);
    res.status(500).json({ error: 'File parsing failed' });
  });

  req.pipe(bb);
}

async function handleDelete(req, res) {
  try {
    const { filePath } = req.body || {};
    if (!filePath) {
      return res.status(400).json({ error: 'filePath is required' });
    }

    const prefix = `gs://${BUCKET}/`;
    const objectPath = filePath.startsWith(prefix)
      ? filePath.slice(prefix.length)
      : filePath;

    await storage.bucket(BUCKET).file(objectPath).delete({ ignoreNotFound: true });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Delete failed:', err);
    res.status(500).json({ error: 'Delete from GCS failed' });
  }
}
