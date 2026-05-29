import { useEffect,useRef } from "react";
import { useState } from "react";
import jsQR from "jsqr";
import axios from "axios";

export default function QRScanner() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [qrCodeData, setQrCodeData] = useState(null);
    const [url, setURL] = useState(null);

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

                if (code) {
                    console.log("QR Code Found", code.data);
                    
                    try {
                        new URL(code.data);
                    } catch {
                        setQrCodeData("QR code does not contain a valid URL");
                        return;
                    }
                    try {
                        const response = await axios.get(
                            `http://localhost:5000/API/URLscan?url=${encodeURIComponent(code.data)}`
                        );
                        
                        const data = response.data;

                        setQrCodeData({
                        risk: data?.risk_level || "unknown",
                        status: data?.status || "unknown",
                        message: data?.message || "",
                        threats: data?.threats || "None"});

                        setURL(code.data)

                        return;
                    } catch (error) {
                    console.error("Error scanning URL:", error);
                    setQrCodeData("Could not be found")
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
                <p>Risk:{qrCodeData?.risk}</p>
                <p>Status:{qrCodeData?.status}</p>
                <p>Message:{qrCodeData?.message}</p>
                <p>Threats:{qrCodeData?.threats}</p>
                <a className="link" href={url}>{url}</a>
            </div>
        </div>
    );
}