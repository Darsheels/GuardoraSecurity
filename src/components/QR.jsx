import { useEffect, useRef } from "react";
import { useState } from "react";
import jsQR from "jsqr";
import axios from "axios";
import SafeShield from "./SafeShield";
import UnsafeShield from "./UnsafeShield";
import WarningShield from "./WarningShield";
import api from "../api";

export default function QRScanner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanningRef = useRef(false);
  const frameRef = useRef(null);

  const [qrCodeData, setQrCodeData] = useState(null);
  const [url, setURL] = useState(null);
  const [status, setStatus] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [cameraStarted, setCameraStarted] = useState(false);

  const permission = navigator.permissions.query({ name: "camera" });

  async function startCamera() {
    const isSecure =
      window.isSecureContext ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1";

    if (!isSecure) {
      setCameraError(
        "Camera access requires a secure context (HTTPS or localhost).",
      );
      return;
    }

    if (permission.state === "denied") {
      setCameraError(
        "Camera access denied. Please enable camera access in your browser settings.",
      );
      return;
    }

    console.log("Permission:", permission);

    try {
      setCameraStarted(true);
      setCameraError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve;
        });

        await videoRef.current.play();
        scanQRCode();
      }
    } catch (error) {
      setCameraError(error.message);
      setCameraStarted(false);
      console.error("Error accessing camera:", error);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraStarted(false);
  }

  function scanQRCode() {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    const scan = async () => {
      if (!cameraStarted || !videoRef.current) return;

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

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
            threats: [],
          });
          scanningRef.current = false;
          return;
        }

        try {
          setQrCodeData({
            risk: "unknown",
            status: "scanning",
            message: "Scanning URL...",
            threats: [],
          });

          const response = await api.get(
            `/API/URLscan?url=${encodeURIComponent(code.data)}`,
          );

          const data = response.data;

          setQrCodeData({
            risk: data?.risk_level || "unknown",
            status: data?.status || "unknown",
            message: data?.message || "",
            threats: Array.isArray(data?.threats) ? data.threats : [],
          });

          setStatus(data?.status || "unknown");
          setURL(code.data);
        } catch (error) {
          const isRateLimited = error.response?.status === 429;
          console.error("Error scanning QR code URL:", error);
          setQrCodeData({
            risk: "unknown",
            status: "error",
            message: isRateLimited
              ? "Too many URL scans from this IP, please try again later."
              : "Error scanning QR code URL. Please try again.",
            threats: [],
          });
        } finally {
          setTimeout(() => {
            scanningRef.current = false;
            console.log("Ready for next scan");
          }, 2000);
        }
      }
      frameRef.current = requestAnimationFrame(scan);
    };
    scan();
  }

  useEffect(() => {
    if (!cameraStarted) return;

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [cameraStarted]);

  return (
    <div id="QRScanner" className="QRScanner">
      <h1 className="QRScanner-Title">QR Scanner:</h1>

      {permission && permission.state === "denied" && (
        <p className="Info">
          Camera access denied. Please enable camera access in your browser
          settings.
        </p>
      )}

      {!cameraStarted ? (
        <>
          <button
            onClick={() => setCameraStarted(true)}
            className="StartButton"
          >
            Start Camera
          </button>

          <p className="Info">
            Click the button to start the camera and scan a QR code.
          </p>
        </>
      ) : (
        <>
          <video
            ref={videoRef}
            className="QRScanner-Video"
            autoPlay
            playsInline
          ></video>
          <canvas
            ref={canvasRef}
            style={{ display: "none" }}
            className="QR Content "
          ></canvas>

          <button onClick={stopCamera} className="StopButton">
            Stop Camera
          </button>
        </>
      )}

      {cameraError && <p className="Error">Error: {cameraError}</p>}

      <div className="QRScanner-Data">
        {qrCodeData?.risk === "Low" && (
          <p className="Risk-Low">Risk:{qrCodeData?.risk}</p>
        )}

        {qrCodeData?.risk === "Medium" && (
          <p className="Risk-Medium">Risk:{qrCodeData?.risk}</p>
        )}

        {qrCodeData?.risk === "High" && (
          <p className="Risk-High">Risk:{qrCodeData?.risk}</p>
        )}

        <p>Status:{qrCodeData?.status}</p>
        <p>Message:{qrCodeData?.message}</p>

        {qrCodeData && (
          <div>
            <p> Threats: {qrCodeData.threats.length === 0 && "None"} </p>
            {Array.isArray(qrCodeData.threats) &&
              qrCodeData.threats.length > 0 && (
                <ul>
                  {qrCodeData.threats.map((threat, index) => (
                    <li key={index}>
                      <strong>{threat.threatType}</strong> |{" "}
                      {threat.platformType} | {threat.threatEntryType} |{" "}
                      {threat.matchedURL}
                    </li>
                  ))}
                </ul>
              )}
          </div>
        )}

        <a
          className="link"
          href={url}
          rel="noopener noreferrer"
          target="_blank"
        >
          {url}
        </a>

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