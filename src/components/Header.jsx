import { useState } from "react";
import History from "./History";

export default function Header() {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const nav_items = [
        { name: "QR Scan", link: "#QRScanner" },
        { name: "URL Scan", link: "#URLScanner" },
    ];

    function toggleSettings() {
        setIsSettingsOpen(!isSettingsOpen);
    }

    return (
        <header className="Header">
            <img className="Icon" src="./src/assets/GuardoraIcon.png"></img>
            <a className="Title" href="#Hero">Guardora Security</a>

            <div className="Header-Items">
                {nav_items.map((item, index) => (
                    <a key={index} href={item.link} className="Header-Item">
                        {item.name}
                    </a>
                ))}
                <button className="Header-Item" onClick={toggleSettings}>History</button>
            </div>
            {isSettingsOpen && <History></History>}
        </header>
    )
}