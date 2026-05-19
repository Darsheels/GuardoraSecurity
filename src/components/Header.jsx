export default function Header() {
    const nav_items = [
        { name: "QR Scan", link: "#QRScanner" },
        { name: "URL Scan", link: "#URLScanner" }
    ];

    return (
        <header className="Header">
            <a className="Title" href="#Hero">Guardora Security</a>

            <div className="Header-Items">
                {nav_items.map((item, index) => (
                    <a key={index} href={item.link} className="Header-Item">
                        {item.name}
                    </a>
                ))}
            </div>
        </header>
    )
}