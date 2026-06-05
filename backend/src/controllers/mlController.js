import fs from "fs";
import { predictECG } from "../services/mlService.js";

export async function predict(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No ECG image uploaded" });
    }

    const age = req.body.age !== undefined ? Number(req.body.age) : undefined;
    const gender = req.body.gender !== undefined ? Number(req.body.gender) : undefined;
    const result = await predictECG(req.file.path, age, gender);

    fs.unlinkSync(req.file.path);

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Prediction failed",
      error: error.message,
    });
  }
}