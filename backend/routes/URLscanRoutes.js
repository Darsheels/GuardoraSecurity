import express from "express";
import { ScanURL } from "../controllers/URLscanController.js";

const router = express.Router();

router.get("/URLscan", ScanURL)

export default router;