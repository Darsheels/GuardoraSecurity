import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import SafeShield from "./SafeShield";
import UnsafeShield from "./UnsafeShield";
import WarningShield from "./WarningShield";

export default function PublicScanResult() {
  const { publicId } = useParams();
  const [scan, setScan] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadScan = async () => {
      try {
        const response = await api.get(`/API/scan/public/${publicId}`);
        if (isMounted) setScan(response.data);
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.status === 404
              ? "This result wasn't found, or is no longer shared."
              : "Error loading this scan result.",
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadScan();
    return () => {
      isMounted = false;
    };
  }, [publicId]);

  if (loading) {
    return (
      <div className="PublicScanResult">
        <p className="Info">Loading result...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="PublicScanResult">
        <p className="Error">{error}</p>
        <Link className="link" to="/">
          Back to Guardora Security
        </Link>
      </div>
    );
  }

  const riskClass =
    scan.risk_level === "Low"
      ? "Risk-Low"
      : scan.risk_level === "Medium"
        ? "Risk-Medium"
        : "Risk-High";

  return (
    <div className="PublicScanResult">
      <div className="PublicScanResult-Header">
        <p className="PublicScanResult-Eyebrow">Shared security report</p>
        <h1 className="PublicScanResult-Title">Guardora Security Scan</h1>
        <p className={`PublicScanResult-Risk ${riskClass}`}>
          {scan.risk_level} risk
        </p>
      </div>

      <div className="PublicScanResult-Status">
        {scan.status === "Safe" && <SafeShield />}
        {scan.status === "Potentially Unwanted" && <WarningShield />}
        {scan.status === "Dangerous" && <UnsafeShield />}
        <div>
          <span className="PublicScanResult-StatusLabel">Scan status</span>
          <strong>{scan.status}</strong>
        </div>
      </div>

      <dl className="PublicScanResult-Details">
        <div>
          <dt>Type</dt>
          <dd>{scan.scan_type}</dd>
        </div>
        <div>
          <dt>Name</dt>
          <dd>{scan.name}</dd>
        </div>
        <div>
          <dt>Scanned</dt>
          <dd>{new Date(scan.created_at).toLocaleString()}</dd>
        </div>
      </dl>

      <div className="PublicScanResult-Message">
        <span>Analysis message</span>
        <p>{scan.message}</p>
      </div>

      <Link className="PublicScanResult-Link" to="/">
        Scan something yourself <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}