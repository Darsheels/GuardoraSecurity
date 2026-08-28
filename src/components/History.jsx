import { useEffect, useRef, useState } from "react";
import api from "../api";

export default function History({ onClose }) {
  const [history, setHistory] = useState([]);
  const [removingIds, setRemovingIds] = useState([]);
  const [isClearing, setIsClearing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [busyShareIds, setBusyShareIds] = useState([]);
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

  const clearHistory = async () => {
    try {
      setIsClearing(true);
      await api.delete("/API/scans");
      setTimeout(() => {
        setHistory([]);
        setRemovingIds([]);
        setIsClearing(false);
      }, 250);
    } catch (error) {
      console.error("Error clearing history:", error);
      setIsClearing(false);
    }
  };

  const DeleteItem = async (id) => {
    try {
      setRemovingIds((prev) => [...prev, id]);
      await api.delete(`/API/scans/${id}`);
      setTimeout(() => {
        setHistory((prev) => prev.filter((scan) => scan.id !== id));
        setRemovingIds((prev) => prev.filter((itemId) => itemId !== id));
      }, 250);
    } catch (error) {
      console.error("Error deleting item:", error);
      setRemovingIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const copyShareLink = async (scan) => {
    try {
      const shareUrl = `${window.location.origin}/scan/${scan.public_id}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(scan.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Error copying share link:", error);
    }
  };

  const unshareItem = async (id) => {
    setBusyShareIds((prev) => [...prev, id]);
    try {
      await api.delete(`/API/scans/${id}/share`);
      setHistory((prev) =>
        prev.map((scan) =>
          scan.id === id ? { ...scan, is_shared: false } : scan,
        ),
      );
    } catch (error) {
      console.error("Error unsharing scan:", error);
    } finally {
      setBusyShareIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const isRemoving = (id) => isClearing || removingIds.includes(id);

  return (
    <div
      className={`History${isClosing ? " closing" : ""}`}
      ref={panelRef}
      onTransitionEnd={handleTransitionEnd}
    >
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
            onClick={() => setIsClosing(true)}
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
            <div
              key={scan.id}
              className={`History-Item${isRemoving(scan.id) ? " removing" : ""}`}
            >
              <button
                className="History-Delete-Button"
                onClick={() => DeleteItem(scan.id)}
                aria-label={`Delete scan ${scan.id}`}
                title="Delete scan"
                disabled={isClearing || removingIds.includes(scan.id)}
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

              {scan.is_shared && (
                <div className="History-Share">
                  <span className="History-Share-Badge">🔗 Shared</span>
                  <button
                    className="History-Share-Copy"
                    onClick={() => copyShareLink(scan)}
                  >
                    {copiedId === scan.id ? "Copied!" : "Copy link"}
                  </button>
                  <button
                    className="History-Share-Unshare"
                    onClick={() => unshareItem(scan.id)}
                    disabled={busyShareIds.includes(scan.id)}
                  >
                    {busyShareIds.includes(scan.id)
                      ? "Unsharing..."
                      : "Unshare"}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}