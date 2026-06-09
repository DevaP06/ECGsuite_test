import express from "express";

import { diagnoseECG } from "../controllers/diagnoseControllers.js";

import upload from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/predict",
  upload.single("file"),
  diagnoseECG
);

export default router;