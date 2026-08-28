import axios from "axios";
import db from "../db.js";
import crypto from "crypto";

export async function DeleteScanShare(req, res) {
  const { id } = req.params;
  const sessionId = req.headers["x-session-id"];

  if (!sessionId) {
    return res.status(400).json({ result: "Session ID is required" });
  }
  if (!id) {
    return res.status(400).json({ result: "Scan ID is required" });
  }

  try {
    const existing = await db.all(
      `SELECT id, is_shared FROM scans WHERE id = $1 AND session_id = $2`,
      [id, sessionId],
    );

    if (!existing.length) {
      return res.status(404).json({ result: "Scan not found" });
    }

    if (!existing[0].is_shared) {
      return res.json({ result: "Scan is not currently shared" });
    }

    await db.query(
      `UPDATE scans SET is_shared = false WHERE id = $1 AND session_id = $2`,
      [id, sessionId],
    );

    res.json({ result: "Scan unshared successfully" });
  } catch (err) {
    console.error("Error unsharing scan:", err);
    res.status(500).json({ result: "Error unsharing scan" });
  }
}

export async function PatchScanShare(req, res) {
  const { id } = req.params;
  const sessionId = req.headers["x-session-id"];

  if (!sessionId) {
    return res.status(400).json({ result: "Session ID is required" });
  }
  if (!id) {
    return res.status(400).json({ result: "Scan ID is required" });
  }

  try {
    const existing = await db.all(
      `SELECT id, public_id, is_shared FROM scans WHERE id = $1 AND session_id = $2`,
      [id, sessionId],
    );

    if (!existing.length) {
      return res.status(404).json({ result: "Scan not found" });
    }

    if (existing[0].is_shared && existing[0].public_id) {
      return res.json({ publicId: existing[0].public_id });
    }

    const publicId = crypto.randomUUID();

    await db.query(
      `UPDATE scans SET public_id = $1, is_shared = true WHERE id = $2 AND session_id = $3`,
      [publicId, id, sessionId],
    );

    res.json({ publicId });
  } catch (err) {
    console.error("Error sharing scan:", err);
    res.status(500).json({ result: "Error sharing scan" });
  }
}

export async function GetPublicScan(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ result: "Public ID is required" });
  }

  const query = `
    SELECT scan_type, name, risk_level, status, message, created_at 
    FROM scans 
    WHERE public_id = $1 AND is_shared = true
  `;

  try {
    const rows = await db.all(query, [id]);

    if (!rows.length) {
      return res.status(404).json({ result: "Scan not found or not shared" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching public scan:", err);
    res.status(500).json({ result: "Error fetching public scan" });
  }
}

async function checkGoogleSafeBrowsing(url) {
  const response = await axios.post(
    `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_BROWSING_KEY}`,
    {
      client: { clientId: "GuardoraSecurity", clientVersion: "1.0" },
      threatInfo: {
        threatTypes: [
          "MALWARE",
          "SOCIAL_ENGINEERING",
          "UNWANTED_SOFTWARE",
          "POTENTIALLY_HARMFUL_APPLICATION",
        ],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url }],
      },
    },
  );
  return response.data.matches || [];
}

async function checkVirusTotalURL(url) {
  const urlId = Buffer.from(url).toString("base64url").replace(/=+$/, "");

  try {
    const response = await axios.get(
      `https://www.virustotal.com/api/v3/urls/${urlId}`,
      { headers: { "x-apikey": process.env.VirusTotal_API_KEY } },
    );
    const stats = response.data.data.attributes.last_analysis_stats;
    return {
      found: true,
      malicious: stats.malicious,
      suspicious: stats.suspicious,
    };
  } catch (error) {
    if (error.response?.status !== 404) throw error;
  }

  const submitRes = await axios.post(
    "https://www.virustotal.com/api/v3/urls",
    new URLSearchParams({ url }),
    { headers: { "x-apikey": process.env.VirusTotal_API_KEY } },
  );

  return { found: false, analysisId: submitRes.data?.data?.id };
}

function combineResults(matches, vt) {
  if (matches.length > 0) {
    const isUnwantedOnly =
      matches.every((m) => m.threatType === "UNWANTED_SOFTWARE") &&
      matches.length === 1;

    return {
      risk_level: isUnwantedOnly ? "Medium" : "High",
      status: isUnwantedOnly ? "Potentially Unwanted" : "Dangerous",
      message: isUnwantedOnly
        ? "This URL is associated with unwanted software"
        : "Threats detected for this URL",
      threats: matches.map((m) => ({
        threatType: m.threatType,
        platformType: m.platformType,
        threatEntryType: m.threatEntryType,
        matchedURL: m.threat?.url,
      })),
    };
  }

  let risk_level = "Low",
    status = "Safe",
    message = "No threats detected";
  if (vt.malicious > 2) {
    risk_level = "High";
    status = "Dangerous";
    message = `Flagged as malicious by ${vt.malicious} security vendors`;
  } else if (vt.malicious > 0 || vt.suspicious > 2) {
    risk_level = "Medium";
    status = "Potentially Unwanted";
    message = `Flagged as suspicious by ${vt.malicious + vt.suspicious} security vendors`;
  }
  return { risk_level, status, message, threats: [] };
}

export async function ScanURL(req, res) {
  const { url } = req.query;
  if (!url)
    return res.status(400).json({ result: "URL parameter is required" });
  if (!process.env.GOOGLE_SAFE_BROWSING_KEY)
    return res
      .status(500)
      .json({ result: "Safe Browsing API key not configured" });
  if (!process.env.VirusTotal_API_KEY)
    return res
      .status(500)
      .json({ result: "VirusTotal API key not configured" });

  const sessionId = req.headers["x-session-id"];

  try {
    const [matches, vtResult] = await Promise.all([
      checkGoogleSafeBrowsing(url),
      checkVirusTotalURL(url),
    ]);

    if (!vtResult.found) {
      if (!vtResult.analysisId) {
        return res.status(502).json({
          status: "error",
          message: "Unable to submit URL to VirusTotal for analysis",
        });
      }

      return res.json({
        status: "processing",
        message: "URL submitted to VirusTotal, analysis pending",
        id: vtResult.analysisId,
        url,
        gsb: matches,
        source: "Google Safe Browsing + VirusTotal",
      });
    }

    const combined = combineResults(matches, vtResult);

    const insertResult = await db.query(
      `INSERT INTO scans (scan_type, name, risk_level, status, message, session_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        "URL",
        url,
        combined.risk_level,
        combined.status,
        combined.message,
        sessionId,
      ],
    );

    return res.json({
      success: true,
      id: insertResult.rows[0].id,
      url,
      ...combined,
      source: "Google Safe Browsing + VirusTotal",
    });
  } catch (error) {
    console.error(
      "Error scanning URL:",
      error.response?.status,
      error.response?.data || error.message,
    );
    res.status(500).json({ result: "Error scanning URL" });
  }
}

export async function GetURLAnalysisResult(req, res) {
  const { id } = req.params;
  const { url, gsb } = req.query;
  if (!id)
    return res
      .status(400)
      .json({ status: "error", message: "Analysis id is required" });

  let matches = [];
  try {
    matches = gsb ? JSON.parse(gsb) : [];
  } catch (parseError) {
    console.warn("Failed to parse GSB payload:", parseError.message);
  }

  try {
    const response = await axios.get(
      `https://www.virustotal.com/api/v3/analyses/${id}`,
      { headers: { "x-apikey": process.env.VirusTotal_API_KEY } },
    );
    const attributes = response.data.data.attributes;

    if (attributes.status !== "completed") {
      return res.json({
        status: "processing",
        message: "Analysis still in progress, please check back shortly",
      });
    }

    const stats = attributes.stats;
    const combined = combineResults(matches, {
      malicious: stats.malicious,
      suspicious: stats.suspicious,
    });
    const sessionId = req.headers["x-session-id"];

    const insertResult = await db.query(
      `INSERT INTO scans (scan_type, name, risk_level, status, message, session_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        "URL",
        url,
        combined.risk_level,
        combined.status,
        combined.message,
        sessionId,
      ],
    );

    return res.json({
      success: true,
      id: insertResult.rows[0].id,
      url,
      ...combined,
      source: "Google Safe Browsing + VirusTotal",
    });
  } catch (err) {
    console.error(
      "Error fetching URL analysis result:",
      err.response?.data || err.message,
    );
    res.status(500).json({
      status: "error",
      message: "Error fetching analysis result",
      source: "VirusTotal",
    });
  }
}

export async function GetScanResults(req, res) {
  const sessionId = req.headers["x-session-id"];

  if (!sessionId) {
    return res.status(400).json({ result: "Session ID is required" });
  }

  const query = `SELECT * FROM scans WHERE session_id = $1 ORDER BY created_at DESC LIMIT 50`;

  try {
    const rows = await db.all(query, [sessionId]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching scan results:", err);
    res.status(500).json({ result: "Error fetching scan results" });
  }
}

export async function clearScanResults(req, res) {
  const sessionId = req.headers["x-session-id"];

  if (!sessionId) {
    return res.status(400).json({ result: "Session ID is required" });
  }

  const query = `DELETE FROM scans WHERE session_id = $1`;

  try {
    await db.query(query, [sessionId]);
    res.json({ result: "Scan results cleared successfully" });
  } catch (err) {
    console.error("Error clearing scan results:", err);
    res.status(500).json({ result: "Error clearing scan results" });
  }
}

export async function deleteScan(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const query = `DELETE FROM scans WHERE id = $1 AND session_id = $2`;

  try {
    await db.query(query, [id, req.headers["x-session-id"]]);
    res.json({ result: "Scan deleted successfully" });
  } catch (err) {
    console.error("Error deleting scan:", err);
    res.status(500).json({ result: "Error deleting scan" });
  }
}