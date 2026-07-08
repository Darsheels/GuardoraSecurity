import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ScanStatsContext = createContext(null);

const defaultStats = {
  totalScans: 0,
  totalThreatsDetected: 0,
  totalFilesScanned: 0,
  totalURLsScanned: 0,
  totalQRCodesScanned: 0,
  totalHashesScanned: 0,
};

export function ScanStatsProvider({ children }) {
  const [stats, setStats] = useState(() => {
    try {
      const stored = window.localStorage.getItem("scanStats");
      return stored ? { ...defaultStats, ...JSON.parse(stored) } : defaultStats;
    } catch {
      return defaultStats;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("scanStats", JSON.stringify(stats));
    } catch (error) {
      console.error("Unable to persist scan stats:", error);
    }
  }, [stats]);

  const incrementScans = ({ scanType, threatsDetected = 0 }) => {
    setStats((current) => ({
      totalScans: current.totalScans + 1,
      totalThreatsDetected: current.totalThreatsDetected + threatsDetected,
      totalFilesScanned:
        current.totalFilesScanned + (scanType === "file" ? 1 : 0),
      totalURLsScanned: current.totalURLsScanned + (scanType === "url" ? 1 : 0),
      totalQRCodesScanned:
        current.totalQRCodesScanned + (scanType === "qr" ? 1 : 0),
      totalHashesScanned:
        current.totalHashesScanned + (scanType === "hash" ? 1 : 0),
    }));
  };

  const value = useMemo(() => ({ stats, incrementScans }), [stats]);

  return (
    <ScanStatsContext.Provider value={value}>
      {children}
    </ScanStatsContext.Provider>
  );
}

export function useScanStats() {
  const context = useContext(ScanStatsContext);
  if (!context) {
    throw new Error("useScanStats must be used within ScanStatsProvider");
  }
  return context;
}