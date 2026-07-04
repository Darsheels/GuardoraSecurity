import express from "express";
import { ScanURL, GetURLAnalysisResult, GetScanResults, clearScanResults, deleteScan } from "../controllers/URLscanController.js";

const router = express.Router();

console.log("URL SCAN ROUTE LOADED");

router.get("/URLscan/result/:id", GetURLAnalysisResult);
router.get("/URLscan", ScanURL);
router.get("/scans", GetScanResults);
router.delete("/scans", clearScanResults);
router.delete("/scans/:id", deleteScan);

export default router;