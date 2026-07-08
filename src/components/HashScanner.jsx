import { useState } from "react";
import api from "../api";
import SafeShield from "./SafeShield";
import UnsafeShield from "./UnsafeShield";
import WarningShield from "./WarningShield";
import ProcessingLoader from "./ProcessingLoader";
import { useScanStats } from "../contexts/ScanStatsContext";

const HASH_REGEX = /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/;

export default function HashScanner() {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { incrementScans } = useScanStats();

  const handleScan = async () => {
    const trimmedHash = hash.trim();

    if (!trimmedHash) {
      setResult({
        status: "Error",
        risk: "Unknown",
        message: "Please enter a hash to scan",
        detections: "Unknown",
        source: "Unknown",
      });
      setStatus("Error");
      return;
    }

    if (!HASH_REGEX.test(trimmedHash)) {
      setResult({
        status: "Error",
        risk: "Unknown",
        message:
          "Invalid hash format. Please enter a valid MD5, SHA-1, or SHA-256 hash.",
        detections: "Unknown",
        source: "Unknown",
      });
      setStatus("Error");
      return;
    }

    setIsLoading(true);
    setStatus("scanning");
    setResult({
      status: "scanning",
      risk: "Unknown",
      message: "Checking VirusTotal database...",
      detections: "Unknown",
      source: "Unknown",
    });

    try {
      const response = await api.get(`/API/filescan/hash/${trimmedHash}`);
      const data = response.data;

      setResult({
        status: data?.status || "Unknown",
        risk: data?.risk || "Unknown",
        message: data?.message || "Unknown",
        detections: data?.detections || "Unknown",
        source: data?.source || "Unknown",
      });
      setStatus(data?.status || "Unknown");

      incrementScans({
        scanType: "hash",
        threatsDetected: data?.stats?.malicious > 0 ? data.stats.malicious : 0,
      });
    } catch (error) {
      const isRateLimited = error.response?.status === 429;
      const isNotFound = error.response?.status === 404;

      setResult({
        status: isNotFound ? "Not Found" : "Error",
        risk: "Unknown",
        message: isRateLimited
          ? "Too many requests from this IP, please try again later."
          : isNotFound
            ? error.response?.data?.message ||
              "No scan results found for this hash."
            : "Error scanning hash. Please try again.",
        detections: "Unknown",
        source: "VirusTotal",
      });
      setStatus(isNotFound ? "Not Found" : "Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isLoading) handleScan();
  };

  return (
    <div id="HashScanner" className="HashScanner">
      <h2 className="HashScanner-Title">Hash Scanner:</h2>
      <input
        className="HashInput"
        placeholder="Enter MD5, SHA-1, or SHA-256 hash..."
        value={hash}
        onChange={(e) => setHash(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        className="HashScanButton"
        onClick={handleScan}
        disabled={isLoading}
      >
        {isLoading ? "Scanning..." : "Scan Hash"}
      </button>

      <div className="HashScanResult">
        {result?.risk === "Low" && (
          <p className="Risk-Low">Risk: {result?.risk}</p>
        )}
        {(result?.risk === "High" || result?.risk === "Critical") && (
          <p className="Risk-High">Risk: {result?.risk}</p>
        )}

        <p>Status: {result?.status}</p>
        <p>Detection: {result?.detections}</p>
        <p>Message: {result?.message}</p>
        <p>Source: {result?.source}</p>

        {status === "scanning" && (
          <ProcessingLoader message="Checking VirusTotal database..." />
        )}
        {status === "Safe" && <SafeShield />}
        {status === "Potentially Unwanted" && <WarningShield />}
        {status === "Dangerous" && <UnsafeShield />}
      </div>
    </div>
  );
}