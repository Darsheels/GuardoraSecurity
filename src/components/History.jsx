import { useEffect, useState } from "react";
import api from "../api";

export default function History({ onClose }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get("/API/scans");
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

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
    <div className="History">
      <div className="History-Header">
        <h2 className="History-Title">Scan History</h2>
        <div className="History-Actions">
          <button className="History-Clear" onClick={clearHistory} aria-label="Clear history">
            Clear
          </button>
          <button className="History-Close" onClick={onClose} aria-label="Close history">
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
              <p><strong>Type:</strong> {scan.scan_type}</p>
              <p><strong>Name:</strong> {scan.name}</p>
              <p><strong>Status:</strong> {scan.status}</p>
              <p><strong>Risk:</strong> {scan.risk_level}</p>
              <p>{new Date(scan.created_at).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}