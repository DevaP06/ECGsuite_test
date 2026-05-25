import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = (command) =>
  new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        const execError = new Error(stderr?.trim() || error.message || 'Model inference failed');
        execError.stderr = stderr;
        return reject(execError);
      }

      return resolve({ stdout, stderr });
    });
  });

function parsePredictionOutput(stdout) {
  const output = stdout.trim();

  if (!output) {
    return { diagnosis: '' };
  }

  try {
    const parsed = JSON.parse(output);
    return parsed;
  } catch {
    return { diagnosis: output };
  }
}

export async function predictECG(imagePath, patientAge = 0, gender = 2) {
  if (!imagePath) {
    throw new Error('Image path is required');
  }

  const serviceDir = path.dirname(fileURLToPath(import.meta.url));
  const scriptPath = path.resolve(serviceDir, '../../ml/inference/ecg_analyzer.py');
  const resolvedImagePath = path.resolve(imagePath);
  const command = `python "${scriptPath}" "${resolvedImagePath}" "${patientAge}" "${gender}"`;

  const { stdout } = await execAsync(command);
  return parsePredictionOutput(stdout);
}