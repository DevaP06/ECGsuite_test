import { exec } from 'child_process';
import path from 'path';

export const diagnoseECG = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No ECG image uploaded' });
  }

  const imagePath = path.resolve(req.file.path);
  exec(`python ./ml-models/ecg_analyzer.py "${imagePath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('Inference error:', stderr);
      return res.status(500).json({ error: 'Model inference failed' });
    }
    res.json({ diagnosis: stdout.trim() });
  });
};
