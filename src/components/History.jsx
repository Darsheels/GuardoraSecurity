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

  return (
    <div className="History">
      <div className="History-Content">
        <div className="History-Header">
          <h2 className="History-Title">Scan History</h2>
          <button className="History-Close" onClick={onClose} aria-label="Close history">
            ✕
          </button>
        </div>

        {history.length === 0 ? (
          <p>No scan history available.</p>
        ) : (
          history.map((scan) => (
            <div key={scan.id} className="History-Item">
              <p><strong>URL:</strong> {scan.url}</p>
              <p><strong>Status:</strong> {scan.status}</p>
              <p><strong>Risk:</strong> {scan.risk_level}</p>
              <p><strong>Date:</strong> {scan.created_at}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}