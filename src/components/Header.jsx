import { useState } from "react";
import History from "./History";
import About from "./About";
import Hero from "./Hero";
import logo from "../assets/GuardoraIcon.png";
import Dashboard from "./Dashboard";
import { useScanStats } from "../contexts/ScanStatsContext";

export default function Header() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const { stats } = useScanStats();

  const nav_items = [
    { name: "QR Scan", link: "#QRScanner" },
    { name: "URL Scan", link: "#URLScanner" },
    { name: "File Scan", link: "#FileScanner" },
    { name: "Hash Scan", link: "#HashScanner" },
  ];

  function toggleHistory() {
    setIsAboutOpen(false);
    setIsDashboardOpen(false);
    setIsHistoryOpen(!isHistoryOpen);
  }

  function toggleAbout() {
    setIsHistoryOpen(false);
    setIsDashboardOpen(false);
    setIsAboutOpen(!isAboutOpen);
  }

  function toggleDashboard() {
    setIsHistoryOpen(false);
    setIsAboutOpen(false);
    setIsDashboardOpen(!isDashboardOpen);
  }

  return (
    <header className="Header">
      <img className="Icon" onClick={toggleDashboard} src={logo}></img>
      <a className="Title" href="#Hero">
        Guardora Security
      </a>

      <div className="Header-Items">
        {nav_items.map((item, index) => (
          <a key={index} href={item.link} className="Header-Item">
            {item.name}
          </a>
        ))}
        <button className="Header-Item" onClick={toggleHistory}>
          History
        </button>
        <button className="Header-Item" onClick={toggleAbout}>
          About
        </button>
      </div>

      {isHistoryOpen && <History onClose={() => setIsHistoryOpen(false)} />}
      {isAboutOpen && <About onClose={() => setIsAboutOpen(false)} />}
      {isDashboardOpen && (
        <Dashboard stats={stats} onClose={() => setIsDashboardOpen(false)} />
      )}
    </header>
  );
}