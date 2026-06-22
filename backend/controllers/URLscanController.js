import axios from "axios";
import db from "../db.js";

export async function ScanURL(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ result: "URL parameter is required" });
  }

  if (!process.env.GOOGLE_SAFE_BROWSING_KEY) {
    return res.status(500).json({
      result: "Safe Browsing API key not configured",
    });
  }

  try {
    const response = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_BROWSING_KEY}`,
      {
        client: {
          clientId: "GuardoraSecurity",
          clientVersion: "1.0",
        },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      },
    );

    const matches = response.data.matches || [];

    const sessionId = req.headers["x-session-id"];

    if (matches.length === 0) {
      await db.query(
        `INSERT INTO scans (url, risk_level, status, message, session_id) VALUES ($1, $2, $3, $4, $5)`,
        [url, "Low", "Safe", "No threats detected",sessionId],
        (err) => {
          if (err) {
            console.error("Error adding scan result to database:", err);
          }
        },
      );

      return res.json({
        success: true,
        url,
        risk_level: "Low",
        status: "Safe",
        message: "No threats detected",
        source: "Google Safe Browsing",
      });
    }

    if (matches.length === 1) {
      if (matches.some((m) => m.threatType === "UNWANTED_SOFTWARE")) {
        await db.query(
          `INSERT INTO scans (url, risk_level, status, message, session_id) VALUES ($1, $2, $3, $4, $5)`,
          [
            url, "Medium","Potentially Unwanted","This URL is associated with unwanted software",sessionId],
          (err) => {
            if (err) {
              console.error("Error adding scan result to database:", err);
            }
          },
        );

        return res.json({
          success: true,
          url,
          risk_level: "Medium",
          status: "Potentially Unwanted",
          message: "This URL is associated with unwanted software",
          source: "Google Safe Browsing",
        });
      }
    }

    await db.query(
      `INSERT INTO scans (url, risk_level, status, message, session_id) VALUES ($1, $2, $3, $4, $5)`,
      [url, "High", "Dangerous", "Threats detected for this URL", sessionId],
      (err) => {
        if (err) {
          console.error("Error adding scan result to database:", err);
        }
      },
    );

    return res.json({
      success: true,
      url,
      risk_level: "High",
      status: "dangerous",
      message: "Threats detected for this URL",
      source: "Google Safe Browsing",
      threats: matches.map((m) => ({
        threatType: m.threatType,
        platformType: m.platformType,
        threatEntryType: m.threatEntryType,
        matchedURL: m.threat?.url || url,
      })),
    });
  } catch (error) {
    console.error("Error scanning URL:", error.response?.data || error.message);
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