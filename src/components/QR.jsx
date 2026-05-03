import { useEffect,useRef } from "react";
import jsQR from "jsqr";

export default function QRScanner() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

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
                canvas.height = video.current.videoHeight;

                context.drawImage(videoRef.current,0,0, canvas.width,canvas.height);

                const imageData = context.getImageData(0,0,canvas.width,canvas.height);

                const code = jsQR(imageData.data, canvas.width, canvas.height);

                if (code) {
                    console.log("QR Code Found", code.data);
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
        <div className="QRScanner">
            <h1 className="QRScanner-Title">QR Scanner:</h1>
            <video ref={videoRef} className="QRScanner-Video" autoPlay playsInline></video>
            <canvas ref={canvasRef} style={{display: "none"}}></canvas>
        </div>
    );
}