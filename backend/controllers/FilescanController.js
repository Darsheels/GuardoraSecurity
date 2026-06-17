import multer from "multer";
import crypto from "crypto";
import fs from "fs";

const upload = multer({ dest:  "./uploads/" });
export const uploadFile = upload.single("file");

export async function FileScan(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ result: "No file uploaded" });
      }

      const fileBuffer = fs.readFileSync(req.file.path);

      const hash = crypto
        .createHash("sha256")
        .update(fileBuffer)
        .digest("hex");
    
      fs.unlinkSync(req.file.path);

      const dangerousExtensions = [".exe", ".bat", ".js", ".scr", ".cmd"];

      const originalName = req.file.originalname.toLowerCase();
      const isDangerous = dangerousExtensions.some(ext =>
        originalName.endsWith(ext)
      );

      let risk = "Low";

      if (isDangerous) risk = "High";

      return res.json({
        status: "scanned",
        risk,
        hash,
        filename: req.file.originalname
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        risk: "Unknown",
        hash: null,
        filename: null
     });
    }
  }
