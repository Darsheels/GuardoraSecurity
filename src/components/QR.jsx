import { useEffect,useRef } from "react";
import { useState } from "react";
import jsQR from "jsqr";

export default function QRScanner() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [qrCodeData, setQrCodeData] = useState(null);
    const [status, setStatus] = useState("idle");

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

            const scan = () => {
                if (!videoRef.current) return;

                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;

                context.drawImage(videoRef.current,0,0, canvas.width,canvas.height);
                
                const imageData = context.getImageData(0,0,canvas.width,canvas.height);

                const code = jsQR(imageData.data, canvas.width, canvas.height);

                if (code) {
                    console.log("QR Code Found", code.data);
                    setQrCodeData(code.data);
                    setStatus("success");
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
            <div className="QRScanner-Data">{qrCodeData}</div>
        </div>
    );
}