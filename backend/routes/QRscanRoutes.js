import express from "express"
import { ScanQR } from "../controllers/QRscanController.js"

const router = express.Router();

router.get("/QRscan", ScanQR)

export default router;