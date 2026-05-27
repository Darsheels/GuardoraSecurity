import { useState } from "react";
import validator from "validator";
import axios from "axios";

export default function URLScanner() {
    const [url, setUrl] = useState("");
    const [scanResult, setScanResult] = useState("");

    const handleScan = async () => {
        if (!validator.isURL(url)) {
            setScanResult("Invalid URL format. Please enter a valid URL.");
            return;
        }

        try {
            const response = await axios.get(
                `http://localhost:5000/API/URLscan?url=${encodeURIComponent(url)}`
            );
            
            setScanResult(response.data);

        } catch (error) {
            console.error("Error scanning URL:", error);
            setScanResult("Error scanning URL. Please try again.");
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
            <div className="URLScanResult">{scanResult}</div>
        </div>
    );
}