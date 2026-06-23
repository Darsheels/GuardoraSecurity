import { useState, useRef, useEffect } from "react";
import axios from "axios";
import api from "../api";
import SafeShield from "./SafeShield";
import UnsafeShield from "./UnsafeShield";
import WarningShield from "./WarningShield";

const poll_interval_ms = 15000;
const max_polling_attempts = 20;

export default function FileScanner() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);

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
      setResult((prev) => ({
        ...prev,
        status: "Error",
        message:
          "analysis is taking longer than expected. Please try again later.",
      }));
      setStatus("Error");
      return;
    }

    pollingAttemptsRef.current += 1;

    try {
      const response = await api.get(`/API/filescan/result/${id}`);
      const data = response.data;

      if (data?.status === "processing") {
        pollTimeoutRef.current = setTimeout(
          () => pollForResult(id, meta),
          poll_interval_ms,
        );
        return;
      }
      setResult({
        status: data?.status || "Unknown",
        risk: data?.risk || "Unknown",
        message: data?.message || "Unknown",
        hash: meta.hash || "Unknown",
        fileSize: meta.fileSize || "Unknown",
        fileType: meta.fileType || "Unknown",
        filename: meta.filename || "Unknown",
        detections: data?.detections || "Unknown",
      });
      setStatus(data?.status || "Unknown");
    } catch (error) {
      console.error("Error polling for result:", error);
      setResult((prev) => ({
        ...prev,
        status: "Error",
        message: "Error polling for result",
      }));
      setStatus("Error");
    }
  };

  const handleScan = async () => {
    if (!file) {
      setResult({
        status: "Error, No File Selected",
        risk: "Unknown",
        message: "Unknown",
        hash: "Unknown",
        filename: "Unknown",
        fileSize: "Unknown",
        fileType: "Unknown",
        detections: "Unknown",
      });
      setStatus("Unknown");
      return;
    }

    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }

    pollingAttemptsRef.current = 0;

    console.log("Scanning file:", file);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setResult({
        status: "scanning",
        risk: "unknown",
        message: "Scanning File...",
        hash: "Unknown",
        fileSize: "Unknown",
        fileType: "Unknown",
        detections: "Unknown",
        filename: "Unknown",
      });

      const response = await api.post(`/API/filescan`, formData);

      const data = response.data;
      console.log("File scan result:", data);

      if (data?.status === "processing") {
        setResult({
          status: "processing",
          risk: data?.risk || "Unknown",
          message: "Processing file...",
          hash: data?.hash || "Unknown",
          fileSize: data?.fileSize || "Unknown",
          fileType: data?.fileType || "Unknown",
          detections: data?.detections || "Unknown",
          filename: data?.filename || "Unknown",
        });
        setStatus("processing");

        pollTimeoutRef.current = setTimeout(
          () =>
            pollForResult(data?.id, {
              hash: data?.hash,
              fileSize: data?.fileSize,
              fileType: data?.fileType,
              filename: data?.filename,
              detections: data?.detections,
            }),
          poll_interval_ms,
        );
        return;
      }

      setResult({
        status: data?.status || "Unknown",
        risk: data?.risk || "Unknown",
        message: data?.message || "Unknown",
        hash: data?.hash || "Unknown",
        fileSize: data?.fileSize || "Unknown",
        fileType: data?.fileType || "Unknown",
        detections: data?.detections || "Unknown",
        filename: data?.filename || "Unknown",
      });

      setStatus(data?.status || "Unknown");
    } catch (error) {
      console.error("Error scanning file:", error);
      setResult({
        status: "Error",
        risk: "Unknown",
        message: "Unknown",
        hash: "Unknown",
        fileSize: "Unknown",
        fileType: "Unknown",
        filename: file?.name || "Unknown",
        detections: "Unknown",
      });
    }
  };

  return (
    <div id="FileScanner" className="FileScanner">
      <h2 className="FileScanner-Title">File Scanner:</h2>
      <input
        className="FileScannerInput"
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={handleScan} className="FileScanButton">
        Scan File
      </button>

      <div className="FileScanResult">
        {result?.risk === "Low" && (
          <p className="Risk-Low">Risk: {result?.risk}</p>
        )}

        {result?.risk === "High" || result?.risk === "Critical" && (
          <p className="Risk-High">Risk: {result?.risk}</p>
        )}

        <p>Status: {result?.status}</p>
        <p>Filename: {result?.filename}</p>
        <p>File Size: {result?.fileSize}</p>
        <p>File Type: {result?.fileType}</p>
        <p>Detection: {result?.detections}</p>
        <p className="FileScanResult-Hash">SHA256: {result?.hash}</p>
        <p>Message: {result?.message}</p>

        {status === "processing" && (
          <p className="Risk-Pending">
            ⏳ Analysis pending — check back shortly.
          </p>
        )}

        {status === "Safe" && <SafeShield />}

        {status === "Potentially Unwanted" && <WarningShield />}

        {status === "Dangerous" && <UnsafeShield />}
      </div>
    </div>
  );
}