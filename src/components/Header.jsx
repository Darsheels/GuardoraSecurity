import { useState } from "react";
import History from "./History";
import About from "./About";
import Hero from "./Hero";

export default function Header() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const nav_items = [
    { name: "QR Scan", link: "#QRScanner" },
    { name: "URL Scan", link: "#URLScanner" },
    { name: "File Scan", link: "#FileScanner" },
  ];

  function toggleHistory() {
    setIsAboutOpen(false);
    setIsHistoryOpen(!isHistoryOpen);
  }

  function toggleAbout() {
    setIsHistoryOpen(false);
    setIsAboutOpen(!isAboutOpen);
  }

  return (
    <header className="Header">
      <img className="Icon" src="./src/assets/GuardoraIcon.png"></img>
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
    </header>
  );
}