import express from "express";
import { uploadFile,FileScan,GetAnalysisResult } from "../controllers/FilescanController.js";

console.log("FILE SCAN ROUTE LOADED");

const router = express.Router();

router.post("/filescan", uploadFile, FileScan);
router.get("/filescan/result/:id", GetAnalysisResult);

export default router;