import { useState } from "react";
import axios from "axios";
import api from "../api"

export default function FileScanner() {
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);

    const handleScan = async () => {
        if (!file) return;

        console.log("Scanning file:", file);

        const formData = new FormData();
        formData.append("file", file);

    try {
        const response = await api.post(`/API/filescan`, formData);

        const data = response.data;
        console.log("File scan result:", data);

        setResult({
            status: data?.status || "Unknown",
            risk: data?.risk || "Unknown",
            hash: data?.hash || "Unknown",
            filename: data?.filename || "Unknown"
        });

    } catch (error) {
        console.error("Error scanning file:", error);
        setResult({
            status: "Error",
            risk: "Unknown",
            hash: "Unknown",
            filename: file?.name || "Unknown"
        });
    }
  };

    return (
        <div id="FileScanner" className="FileScanner">
            <h2 className="FileScanner-Title">File Scanner:</h2>
            <input className="FileScannerInput"
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
            />

            <button onClick={handleScan} className="FileScanButton">
                Scan File
            </button>

            <div className="FileScanResult">
                <p>Status: {result?.status}</p>
                <p>Risk: {result?.risk}</p>
                <p>Hash: {result?.hash}</p>
                <p>Filename: {result?.filename}</p>
            </div>
            
        </div>
    );
}