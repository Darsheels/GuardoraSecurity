import express from "express";
import { uploadFile,FileScan } from "../controllers/FilescanController.js";

console.log("FILE SCAN ROUTE LOADED");

const router = express.Router();

router.post("/filescan", uploadFile, FileScan);

export default router;