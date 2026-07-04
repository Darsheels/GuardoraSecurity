import { useEffect, useRef } from "react";

export default function Dashboard({ stats, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="dashboard" ref={panelRef}>
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Dashboard</h2>
          <p className="panel-subtitle">
            Your local scan activity at a glance.
          </p>
        </div>
        <button
          className="panel-close"
          onClick={onClose}
          aria-label="Close Dashboard"
        >
          ✕
        </button>
      </div>

      <div className="panel-content dashboard-content">
        <div className="stats-grid">
          <article className="stat-card">
            <span className="stat-label">Total Scans</span>
            <strong className="stat-value">{stats.totalScans}</strong>
          </article>
          <article className="stat-card accent-card">
            <span className="stat-label">Threats Detected</span>
            <strong className="stat-value">{stats.totalThreatsDetected}</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">Files Scanned</span>
            <strong className="stat-value">{stats.totalFilesScanned}</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">URLs Scanned</span>
            <strong className="stat-value">{stats.totalURLsScanned}</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">QR Codes Scanned</span>
            <strong className="stat-value">{stats.totalQRCodesScanned}</strong>
          </article>
        </div>
        <p className="panel-note">Counts are stored locally in this browser.</p>
      </div>
    </div>
  );
}