import express from "express";
import { uploadFile, FileScan, GetAnalysisResult, GetHashResult } from "../controllers/FilescanController.js";
import { fileLimiter, scanLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/filescan", fileLimiter, uploadFile, FileScan);
router.get("/filescan/result/:id", scanLimiter, GetAnalysisResult);
router.get("/filescan/hash/:hash", scanLimiter, GetHashResult);

export default router;