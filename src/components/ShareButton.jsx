import { useState } from "react";
import api from "../api";
import image from "../assets/Share.png";

export default function ShareButton({ scanId }) {
  const [status, setStatus] = useState("idle");

  const handleShare = async () => {
    if (!scanId || status === "loading") return;

    setStatus("loading");

    try {
      const response = await api.patch(`/API/scans/${scanId}/share`);
      const publicId = response.data?.publicId;

      if (!publicId) {
        throw new Error("No public ID returned");
      }

      const shareUrl = `${window.location.origin}/scan/${publicId}`;
      await navigator.clipboard.writeText(shareUrl);

      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      console.error("Error sharing scan:", error);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const label =
    status === "loading"
      ? "Sharing..."
      : status === "copied"
        ? "Link copied!"
        : status === "error"
          ? "Failed, try again"
          : "Share result";

  return (
    <button
      className={`ShareButton ShareButton--${status}`}
      onClick={handleShare}
      disabled={status === "loading"}
      aria-label="Share this scan result"
      aria-live="polite"
    >
      <span className="ShareButton-Icon" aria-hidden="true">
        {status === "loading" ? (
          <span className="ShareButton-Spinner" />
        ) : status === "copied" ? (
          "✓"
        ) : status === "error" ? (
          "!"
        ) : (
          <img src={image} alt="" />
        )}
      </span>
      <span className="ShareButton-Label">{label}</span>
    </button>
  );
}