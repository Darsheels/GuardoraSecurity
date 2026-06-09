import { useState } from "react";
import validator from "validator";
import axios from "axios";
import SafeShield from "./SafeShield";
import UnsafeShield from "./UnsafeShield";

export default function URLScanner() {
    const [url, setUrl] = useState("");
    const [scanResult, setScanResult] = useState(null);
    const [status, setStatus] = useState(null);

    const handleScan = async () => {
        if (!validator.isURL(url)) {
            setScanResult({
                risk: "unknown",
                status: "invalid",
                message: "Please enter a valid URL",
                threats: []
            });
            setStatus(null);
            return;
        }

        try {
            const response = await axios.get(
                `http://localhost:5000/API/URLscan?url=${encodeURIComponent(url)}`
            );
            
            const data = response.data;

            setScanResult({
                risk: data?.risk_level || "unknown",
                status: data?.status || "unknown",
                message: data?.message || "",
                threats: Array.isArray(data?.threats) ? data.threats : [] 
            });

            setStatus(data?.status || "unknown");

        } catch (error) {
            console.error("Error scanning URL:", error);
            setScanResult({
                risk: "unknown",
                status: "error",
                message: "Error scanning URL. Please try again.",
                threats: []
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
            <button className="ScanButton" onClick={handleScan}>Scan URL</button>
            <div className="URLScanResult">
                <p>Risk: {scanResult?.risk}</p>
                <p>Status: {scanResult?.status}</p>
                <p>Message: {scanResult?.message}</p>
                
                {scanResult && (
                <div>
                    <p> Threats: {scanResult.threats.length === 0 && "None"} </p>
                    {Array.isArray(scanResult.threats) && scanResult.threats.length > 0 && (
                    <ul>
                        {scanResult.threats.map((threat, index) => (
                            <li key={index}>
                                <strong>{threat.threatType}</strong> | {threat.platformType} | {threat.threatEntryType} | {threat.matchedURL}
                            </li>
                        ))}
                    </ul>
                    )}
                </div>
                )}

                {status === "Safe" && (
                    <SafeShield />
                )}

                {status === "dangerous" && (
                    <UnsafeShield />
                )}
            </div>
        </div>
    );
}