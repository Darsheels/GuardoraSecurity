import express from "express";
import { ScanURL,GetScanResults } from "../controllers/URLscanController.js";

const router = express.Router();

router.get("/URLscan", ScanURL);
router.get("/scans", GetScanResults);

export default router;