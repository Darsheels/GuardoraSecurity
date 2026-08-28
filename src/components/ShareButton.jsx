import { useState } from "react";
import api from "../api";
import image from "../assets/Share.png";

export default function ShareButton({ scanId }) {
  const [status, setStatus] = useState("idle");
  const [isShared, setIsShared] = useState(false);

  const handleShare = async () => {
    if (!scanId || status === "loading") return;
    setStatus("loading");

    try {
      const response = await api.patch(`/API/scans/${scanId}/share`);
      const publicId = response.data?.publicId;
      if (!publicId) throw new Error("No public ID returned");

      const shareUrl = `${window.location.origin}/scan/${publicId}`;
      await navigator.clipboard.writeText(shareUrl);

      setIsShared(true);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      console.error("Error sharing scan:", error);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const handleUnshare = async () => {
    if (!scanId || status === "loading") return;
    setStatus("loading");

    try {
      await api.delete(`/API/scans/${scanId}/share`);
      setIsShared(false);
      setStatus("idle");
    } catch (error) {
      console.error("Error unsharing scan:", error);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const label =
    status === "loading"
      ? "Working..."
      : status === "copied"
        ? "Link copied!"
        : status === "error"
          ? "Failed, try again"
          : isShared
            ? "Unshare"
            : "Share result";

  return (
    <button
      className={`ShareButton ShareButton--${status}${isShared ? " ShareButton--shared" : ""}`}
      onClick={isShared ? handleUnshare : handleShare}
      disabled={status === "loading"}
      aria-label={
        isShared ? "Unshare this scan result" : "Share this scan result"
      }
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