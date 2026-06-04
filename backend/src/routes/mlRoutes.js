import express from "express";

import { predict } from "../controllers/mlController.js";

import upload from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/predict",
  upload.single("file"),
  predict
);

export default router;