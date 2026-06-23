export default function About({ onClose }) {
    return (
        <div id="Hero" className="About">

            <div className="About-Header">
                <h1 className="About-Title">About:</h1>
                <button className="About-Close" onClick={onClose} aria-label="Close About">
                    ✕
                </button>
            </div>

            <div className="About-Content">
                Guardora Security is a lightweight, threat-scanning platform designed to help individuals and small teams instantly detect phishing attempts, malicious URLs, and dangerous QR codes before they cause damage. Built for speed, clarity, and real‑world protection, Guardora gives users a simple way to verify suspicious links and stay safe online.
            </div>

        </div>
    )
}