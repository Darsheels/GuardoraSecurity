import { useEffect, useRef, useState } from "react";
import validator from "validator";
import SafeShield from "./SafeShield";
import UnsafeShield from "./UnsafeShield";
import WarningShield from "./WarningShield";
import ProcessingLoader from "./ProcessingLoader";
import api from "../api";
import { useScanStats } from "../contexts/ScanStatsContext";

const poll_interval_ms = 15000;
const max_polling_attempts = 20;

export default function URLScanner() {
  const [url, setUrl] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState(null);
  const { incrementScans } = useScanStats();

  const pollTimeoutRef = useRef(null);
  const pollingAttemptsRef = useRef(0);

  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  const pollForResult = async (id, meta) => {
    if (pollingAttemptsRef.current >= max_polling_attempts) {
      setScanResult((prev) => ({
        ...prev,
        status: "Error",
        message:
          "Analysis is taking longer than expected. Please try again later.",
      }));
      setStatus("Error");
      return;
    }

    pollingAttemptsRef.current += 1;

    try {
      const response = await api.get(`/API/URLscan/result/${id}`, {
        params: {
          url: meta.url,
          gsb: JSON.stringify(meta.gsb || []),
        },
      });
      const data = response.data;

      if (data?.status === "processing") {
        pollTimeoutRef.current = setTimeout(
          () => pollForResult(id, meta),
          poll_interval_ms,
        );
        return;
      }

      const threats = Array.isArray(data?.threats) ? data.threats : [];

      setScanResult({
        risk: data?.risk_level || "unknown",
        status: data?.status || "unknown",
        message: data?.message || "",
        threats,
        source: data?.source || "unknown",
      });

      setStatus(data?.status || "unknown");
      incrementScans({ scanType: "url", threatsDetected: threats.length });
    } catch (error) {
      console.error("Error polling for URL result:", error);
      setScanResult((prev) => ({
        ...prev,
        status: "Error",
        message: "Error polling for result",
      }));
      setStatus("Error");
    }
  };

  const handleScan = async () => {
    if (!validator.isURL(url)) {
      setScanResult({
        risk: "unknown",
        status: "invalid",
        message: "Please enter a valid URL",
        threats: [],
      });
      setStatus(null);
      return;
    }

    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }
    pollingAttemptsRef.current = 0;

    try {
      setScanResult({
        risk: "unknown",
        status: "scanning",
        message: "Scanning URL...",
        threats: [],
      });
      setStatus("scanning");

      const response = await api.get(
        `/API/URLscan?url=${encodeURIComponent(url)}`,
      );

      const data = response.data;

      if (data?.status === "processing") {
        setScanResult({
          risk: "unknown",
          status: "processing",
          message: "URL submitted to VirusTotal, analysis pending...",
          threats: [],
          source: data?.source || "unknown",
        });
        setStatus("processing");

        pollTimeoutRef.current = setTimeout(
          () =>
            pollForResult(data?.id, {
              url: data?.url || url,
              gsb: data?.gsb || [],
            }),
          poll_interval_ms,
        );
        return;
      }

      const threats = Array.isArray(data?.threats) ? data.threats : [];

      setScanResult({
        risk: data?.risk_level || "unknown",
        status: data?.status || "unknown",
        message: data?.message || "",
        threats,
        source: data?.source || "unknown",
      });

      setStatus(data?.status || "unknown");
      incrementScans({ scanType: "url", threatsDetected: threats.length });
    } catch (error) {
      const isRateLimited = error.response?.status === 429;

      console.error("Error scanning URL:", error);
      setScanResult({
        risk: "unknown",
        status: "error",
        message: isRateLimited
          ? "Too many URL scans from this IP, please try again later."
          : "Error scanning URL. Please try again.",
        threats: [],
      });
      setStatus("error");
    }
  };

  return (
    <div id="URLScanner" className="URLScanner">
      <h1 className="URLScanner-Title">URL Scanner:</h1>
      <input
        className="URLInput"
        placeholder="Enter URL to scan..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button className="ScanButton" onClick={handleScan}>
        Scan URL
      </button>
      <div className="URLScanResult">
        {scanResult?.risk === "Low" && (
          <p className="Risk-Low">Risk: {scanResult?.risk}</p>
        )}

        {scanResult?.risk === "Medium" && (
          <p className="Risk-Medium">Risk: {scanResult?.risk}</p>
        )}

        {scanResult?.risk === "High" && (
          <p className="Risk-High">Risk: {scanResult?.risk}</p>
        )}

        <p>Status: {scanResult?.status}</p>
        <p>Message: {scanResult?.message}</p>

        {scanResult && (
          <div>
            <p> Threats: {scanResult.threats.length === 0 && "None"} </p>
            {Array.isArray(scanResult.threats) &&
              scanResult.threats.length > 0 && (
                <ul>
                  {scanResult.threats.map((threat, index) => (
                    <li key={index} className="Threat-Item">
                      <strong>{threat.threatType}</strong> |{" "}
                      {threat.platformType} | {threat.threatEntryType} |{" "}
                      {threat.matchedURL}
                    </li>
                  ))}
                </ul>
              )}
          </div>
        )}

        <p>Source: {scanResult?.source}</p>

        {status === "processing" && (
          <ProcessingLoader message="VirusTotal analysis pending — check back shortly." />
        )}

        {status === "Safe" && <SafeShield />}

        {status === "Potentially Unwanted" && <WarningShield />}

        {status === "Dangerous" && <UnsafeShield />}
      </div>
    </div>
  );
}