import { useEffect, useRef, useState } from "react";
import api from "../api";

export default function History({ onClose }) {
  const [history, setHistory] = useState([]);
  const panelRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      try {
        const response = await api.get("/API/scans");
        if (isMounted) {
          setHistory(response.data);
        }
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const clearHistory = async () => {
    try {
      await api.delete("/API/scans");
      setHistory([]);
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  };

  const DeleteItem = async (id) => {
    try {
      await api.delete(`/API/scans/${id}`);
      setHistory(history.filter((scan) => scan.id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  return (
    <div className="History" ref={panelRef}>
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Scan History</h2>
          <p className="panel-subtitle">Your local scan history.</p>
        </div>
        <div className="History-Actions">
          <button
            className="History-Clear"
            onClick={clearHistory}
            aria-label="Clear history"
          >
            Clear
          </button>
          <button
            className="History-Close"
            onClick={onClose}
            aria-label="Close history"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="History-Content">
        {history.length === 0 ? (
          <p>No scan history available.</p>
        ) : (
          history.map((scan) => (
            <div key={scan.id} className="History-Item">
              <button
                className="History-Delete-Button"
                onClick={() => DeleteItem(scan.id)}
                aria-label={`Delete scan ${scan.id}`}
                title="Delete scan"
              >
                ✕
              </button>
              <p>
                <strong>Type:</strong> {scan.scan_type}
              </p>
              <p>
                <strong>Name:</strong> {scan.name}
              </p>
              <p>
                <strong>Status:</strong> {scan.status}
              </p>
              <p>
                <strong>Risk:</strong> {scan.risk_level}
              </p>
              <p>{new Date(scan.created_at).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}