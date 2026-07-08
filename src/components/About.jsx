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
        Guardora Security is a lightweight cybersecurity platform designed to
        help individuals and small teams identify phishing attempts, malicious
        URLs, dangerous QR codes, and suspicious files before they become a
        threat. Built for speed, accuracy, and real-world protection, Guardora
        provides clear, easy-to-understand security insights, allowing users to
        verify digital content with confidence and stay safer online.
      </div>
    </div>
  );
}
