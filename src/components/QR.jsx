import { useEffect,useRef } from "react";
import { useState } from "react";
import jsQR from "jsqr";
import axios from "axios";
import SafeShield from "./SafeShield";
import UnsafeShield from "./UnsafeShield";
import WarningShield from "./WarningShield"

export default function QRScanner() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const scanningRef = useRef(false);
    const [qrCodeData, setQrCodeData] = useState(null);
    const [url, setURL] = useState(null);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        async function startCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });

                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    scanQRCode();
                }
            } catch (error) {
                console.error("Error accessing camera:", error);
                }
            }

        function scanQRCode() {
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");

            const scan = async () => {
                if (!videoRef.current) return;

                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;

                context.drawImage(videoRef.current,0,0, canvas.width,canvas.height);
                
                const imageData = context.getImageData(0,0,canvas.width,canvas.height);

                const code = jsQR(imageData.data, canvas.width, canvas.height);

                if (code && !scanningRef.current) {
                    scanningRef.current = true;
                    console.log("QR Code Found", code.data);
                    
                    try {
                        new URL(code.data);
                    } catch {
                    setQrCodeData({ 
                        risk: "unknown",
                        status: "unknown", 
                        message: "Invalid QR", 
                        threats: []
                    });

                        scanningRef.current = false;
                    }
                    try {
                        setQrCodeData({ 
                            risk: "unknown",
                            status: "scanning", 
                            message: "Scanning URL...", 
                            threats: []
                        });

                        const response = await axios.get(
                            `http://localhost:5000/API/URLscan?url=${encodeURIComponent(code.data)}`
                        );
                        
                        const data = response.data;

                        setQrCodeData({
                        risk: data?.risk_level || "unknown",
                        status: data?.status || "unknown",
                        message: data?.message || "",
                        threats: Array.isArray(data?.threats) ? data.threats : [] 
                    });
                        
                        setStatus(data?.status || "unknown");
                        setURL(code.data)

                    } finally {
                        setTimeout(() => {
                            scanningRef.current = false;
                            console.log("Ready for next scan");
                        }, 2000);
                    }
                }
                requestAnimationFrame(scan);
            };

            scan();
        }
        startCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
           }
         };
    }, []); 
    
    return (
        <div id="QRScanner" className="QRScanner">
            <h1 className="QRScanner-Title">QR Scanner:</h1>
            <video ref={videoRef} className="QRScanner-Video" autoPlay playsInline></video>
            <canvas ref={canvasRef} style={{display: "none"}} className="QR Content "></canvas>
            <div className="QRScanner-Data">

                {qrCodeData?.risk === "Low" && (
                    <p className="Risk-Low">Risk:{qrCodeData?.risk}</p>
                )}
                
                {qrCodeData?.risk === "High" && (
                    <p className="Risk-High">Risk:{qrCodeData?.risk}</p>
                )}
                
                <p>Status:{qrCodeData?.status}</p>
                <p>Message:{qrCodeData?.message}</p>

                {qrCodeData && (
                <div>
                    <p> Threats: {qrCodeData.threats.length === 0 && "None"} </p>
                    {Array.isArray(qrCodeData.threats) && qrCodeData.threats.length > 0 && (
                    <ul>
                    {qrCodeData.threats.map((threat, index) => (
                        <li key={index}>
                            <strong>{threat.threatType}</strong> | {threat.platformType} | {threat.threatEntryType} | {threat.matchedURL}
                        </li>
                    ))}
                    </ul>
                    )}
                </div>
                )}

                <a className="link" href={url} rel="noopener noreferrer" target="_blank">{url}</a>

                {status === "Safe" && (
                    <>
                    <SafeShield />
                    </>
                )}

                {status === "Potentially Unwanted" && (
                    <>
                    <WarningShield />
                    </>
                )}

                {status === "dangerous" && (
                    <>
                    <UnsafeShield />
                    </>
                )}
                
            </div>
        </div>
    );
}