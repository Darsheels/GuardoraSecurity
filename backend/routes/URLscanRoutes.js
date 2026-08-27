import express from "express";
import { ScanURL, GetURLAnalysisResult, GetScanResults, clearScanResults, deleteScan, GetPublicScan, PatchScanShare } from "../controllers/URLscanController.js";

const router = express.Router();

router.get("/URLscan/result/:id", GetURLAnalysisResult);
router.get("/URLscan", ScanURL);
router.patch("/scans/:id/share", PatchScanShare);
router.get("/scan/public/:id", GetPublicScan);
router.get("/scans", GetScanResults);
router.delete("/scans", clearScanResults);
router.delete("/scans/:id", deleteScan);

export default router;