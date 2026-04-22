import Webcam from "react-webcam";
import { useEffect,useRef } from "react";


export default function QRScanner() {
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        async function startCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });

                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
            } catch (error) {
                console.error("Error accessing camera:", error);
                }      
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
            <video ref={videoRef} className="QRScanner-Video" autoPlay playsInline></video>
        </div>
    );
}