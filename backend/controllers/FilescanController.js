import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import os from "os";

async function checkVirusTotal(hash) {
  try {
    const response = await axios.get(
      `https://www.virustotal.com/api/v3/files/${hash}`,
      {
        headers: {
          "x-apikey": process.env.VirusTotal_API_KEY,
        },
      },
    );

    const stats = response.data.data.attributes.last_analysis_stats;

    const total =
      stats.malicious + stats.suspicious + stats.harmless + stats.undetected;

    return {
      detections: `${stats.malicious}/${total}`,
      found: true,
      malicious: stats.malicious,
      suspicious: stats.suspicious,
      harmless: stats.harmless,
      undetected: stats.undetected,
    };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return { found: false };
    }
    throw error;
  }
}

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 32 * 1024 * 1024 },
}); 
export const uploadFile = upload.single("file");

export async function FileScan(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ result: "No file uploaded" });
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    let hash;

    hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    const virusTotalResult = await checkVirusTotal(hash);

    let risk = "Low";

    if (virusTotalResult.found) {
      fs.unlinkSync(req.file.path);

      if (virusTotalResult.malicious > 0) {
        risk = "Critical";
      } else if (virusTotalResult.suspicious > 0) {
        risk = "High";
      } else {
        risk = "Low";
      }

      return res.json({
        filename: req.file.originalname,
        hash: hash,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        status:
          risk === "Critical"
            ? "Dangerous"
            : risk === "High"
              ? "Potentially Unwanted"
              : "Safe",
        risk,
        detections: virusTotalResult.detections,
        message: virusTotalResult.found
          ? "File scanned successfully"
          : "File not found",
      });
    }
    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path));

    const uploadRes = await axios.post(
      "https://www.virustotal.com/api/v3/files",
      formData,
      {
        headers: {
          "x-apikey": process.env.VirusTotal_API_KEY,
          ...formData.getHeaders?.(),
        },
      },
    );

    fs.unlinkSync(req.file.path);

    return res.json({
      status: "processing",
      message: "File uploaded to VirusTotal, analysis pending",
      id: uploadRes.data.data.id,
      filename: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      hash: hash,
    });
  } catch (err) {
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_) {}
    }

    if (err.response?.status === 409 && hash) {
      try {
        const retry = await checkVirusTotal(hash);

        if (!retry.found) {
          return res.status(503).json({
            status: "error",
            risk: "Unknown",
            message:
              "File already queued for analysis — please try again shortly",
          });
        }

        let risk = "Low";
        if (retry.malicious > 0) risk = "Critical";
        else if (retry.suspicious > 0) risk = "High";

        return res.json({
          filename: req.file?.originalname ?? null,
          hash,
          fileSize: req.file?.size ?? null,
          fileType: req.file?.mimetype ?? null,
          status:
            risk === "Critical"
              ? "Dangerous"
              : risk === "High"
                ? "Potentially Unwanted"
                : "Safe",
          risk,
          detections: retry.detections,
          message: "File scanned successfully",
        });
      } catch (retryErr) {
        console.error("Error on 409 retry:", retryErr.message);
        return res.status(500).json({
          status: "error",
          risk: "Unknown",
          message: "Failed to retrieve existing analysis",
          hash,
          filename: req.file?.originalname ?? null,
          fileSize: req.file?.size ?? null,
          fileType: req.file?.mimetype ?? null,
        });
      }
    }

    console.error("FileScan error:", err.response?.data ?? err.message);
    return res.status(500).json({
      status: "error",
      risk: "Unknown",
      message: "Error scanning file",
      hash: hash ?? null,
      filename: req.file?.originalname ?? null,
      fileSize: req.file?.size ?? null,
      fileType: req.file?.mimetype ?? null,
    });
  }
}

export async function GetAnalysisResult(req, res) {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ status: "error", message: "Analysis id is required" });
  }

  try {
    const response = await axios.get(
      `https://www.virustotal.com/api/v3/analyses/${id}`,
      {
        headers: {
          "x-apikey": process.env.VirusTotal_API_KEY,
        },
      },
    );

    const attributes = response.data.data.attributes;
    const vtStatus = attributes.status;

    if (vtStatus !== "completed") {
      return res.json({
        status: "processing",
        message: "Analysis still in progress, please check back shortly",
      });
    }

    const total =
      attributes.stats.malicious +
      attributes.stats.suspicious +
      attributes.stats.harmless +
      attributes.stats.undetected;
    const stats = attributes.stats;
    let risk = "Low";

    if (stats.malicious > 0) {
      risk = "Critical";
    } else if (stats.suspicious > 0) {
      risk = "High";
    }

    return res.json({
      status:
        risk === "Critical"
          ? "Dangerous"
          : risk === "High"
            ? "Potentially Unwanted"
            : "Safe",
      risk,
      message: "File scanned successfully",
      detections: `${stats.malicious}/${total}`,

      stats: {
        detections: `${stats.malicious}/${total}`,
        malicious: stats.malicious,
        suspicious: stats.suspicious,
        harmless: stats.harmless,
        undetected: stats.undetected,
      },
    });
  } catch (err) {
    console.error(
      "Error fetching analysis result:",
      err.response?.data || err.message,
    );
    res.status(500).json({
      status: "error",
      message: "Error fetching analysis result",
    });
  }
}