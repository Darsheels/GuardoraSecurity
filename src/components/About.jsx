import { useEffect, useRef, useState } from "react";

export default function About({ onClose }) {
  const panelRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsClosing(true);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleTransitionEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  return (
    <div
      id="Hero"
      className={`About${isClosing ? " closing" : ""}`}
      ref={panelRef}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="About-Header">
        <h1 className="About-Title">About:</h1>
        <button
          className="About-Close"
          onClick={() => {
            setIsClosing(true);
          }}
          aria-label="Close About"
        >
          ✕
        </button>
      </div>

      <div className="About-Content">
        Guardora Security is a lightweight, threat-scanning platform designed to
        help individuals and small teams instantly detect phishing attempts,
        malicious URLs, and dangerous QR codes before they cause damage. Built
        for speed, clarity, and real‑world protection, Guardora gives users a
        simple way to verify suspicious links and stay safe online.
      </div>
    </div>
  );
}