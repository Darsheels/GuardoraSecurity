import axios from "axios";
import db from "../db.js";

async function checkVirusTotalURL(url) {
  try {
    const urlId = Buffer.from(url).toString("base64url").replace(/=+$/, "");

    const response = await axios.get(
      `https://www.virustotal.com/api/v3/urls/${urlId}`,
      {
        headers: { "x-apikey": process.env.VirusTotal_API_KEY },
      },
    );

    const stats = response.data.data.attributes.last_analysis_stats;
    return {
      found: true,
      malicious: stats.malicious,
      suspicious: stats.suspicious,
    };
  } catch (error) {
    if (error.response?.status === 404) {
      try {
        await axios.post(
          "https://www.virustotal.com/api/v3/urls",
          new URLSearchParams({ url }),
          { headers: { "x-apikey": process.env.VirusTotal_API_KEY } },
        );
      } catch (_) {}

      return { found: false };
    }
    return { found: false };
  }
}

export async function ScanURL(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ result: "URL parameter is required" });
  }

  if (!process.env.GOOGLE_SAFE_BROWSING_KEY) {
    return res
      .status(500)
      .json({ result: "Safe Browsing API key not configured" });
  }

  if (!process.env.VirusTotal_API_KEY) {
    return res
      .status(500)
      .json({ result: "VirusTotal API key not configured" });
  }

  try {
  
    const gsbResponse = await axios.post(
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

    const matches = gsbResponse.data.matches || [];
    const sessionId = req.headers["x-session-id"];

    if (matches.length > 0) {
      const isUnwantedOnly =
        matches.every((m) => m.threatType === "UNWANTED_SOFTWARE") &&
        matches.length === 1;

      const risk_level = isUnwantedOnly ? "Medium" : "High";
      const status = isUnwantedOnly ? "Potentially Unwanted" : "Dangerous";
      const message = isUnwantedOnly
        ? "This URL is associated with unwanted software"
        : "Threats detected for this URL";

      await db.query(
        `INSERT INTO scans (scan_type, name, risk_level, status, message, session_id) VALUES ($1, $2, $3, $4, $5, $6)`,
        ["url", url, risk_level, status, message, sessionId],
      );

      return res.json({
        success: true,
        url,
        risk_level,
        status,
        message,
        source: "Google Safe Browsing + VirusTotal",
        threats: matches.map((m) => ({
          threatType: m.threatType,
          platformType: m.platformType,
          threatEntryType: m.threatEntryType,
          matchedURL: m.threat?.url || url,
        })),
      });
    }

    const vtResult = await checkVirusTotalURL(url);

    let risk_level = "Low";
    let status = "Safe";
    let message = "No threats detected";
    let source = "Google Safe Browsing + VirusTotal";

    if (vtResult.found) {
      if (vtResult.malicious > 2) {
        risk_level = "High";
        status = "Dangerous";
        message = `Flagged as malicious by ${vtResult.malicious} security vendors`;
      } else if (vtResult.malicious > 0 || vtResult.suspicious > 2) {
        risk_level = "Medium";
        status = "Potentially Unwanted";
        message = `Flagged as suspicious by ${vtResult.malicious + vtResult.suspicious} security vendors`;
      }
    }

    await db.query(
      `INSERT INTO scans (scan_type , name, risk_level, status, message, session_id) VALUES ($1, $2, $3, $4, $5, $6)`,
      ["URL", url, risk_level, status, message, sessionId],
    );

    return res.json({
      success: true,
      url,
      risk_level,
      status,
      message,
      source,
    });

  } catch (error) {
    console.error(
      "Error scanning URL:",
      error.response?.status,
      error.response?.data || error.message,
      error.stack,
    );
    res.status(500).json({ result: "Error scanning URL" });
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

  const query = `DELETE FROM scans WHERE id = $1`;

  try {
    await db.query(query, [id]);
    res.json({ result: "Scan deleted successfully" });
  } catch (err) {
    console.error("Error deleting scan:", err);
    res.status(500).json({ result: "Error deleting scan" });
  }
}