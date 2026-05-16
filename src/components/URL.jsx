import { useState } from "react";

export default function URLScanner() {
    const [url, setUrl] = useState("");
    const [scanResult, setScanResult] = useState("");

    const handleScan = () => {
        if (url.trim() === "") {
            setScanResult("Please enter a valid URL.");
            return;
        }
        setScanResult(`Scanned URL: ${url}`);
    };
    return (
        <div className="URLScanner">
            <h1 className="URLScanner-Title">URL Scanner:</h1>
            <input 
                className="URLInput" 
                placeholder="Enter URL to scan..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
            />
            <button className="ScanButton" onClick={handleScan}>Scan URL</button>
            <div className="URLScanResult">{scanResult}</div>
        </div>
    );
}