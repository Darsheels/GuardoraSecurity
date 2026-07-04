import Hero from "./components/Hero";
import Header from "./components/Header";
import QRScanner from "./components/QR";
import URLScanner from "./components/URL";
import Footer from "./components/Footer";
import FileScanner from "./components/FileScanner";
import { ScanStatsProvider } from "./contexts/ScanStatsContext";

export default function App() {
  return (
    <ScanStatsProvider>
      <div className="App">
        <Header />
        <Hero />
        <QRScanner />
        <URLScanner />
        <FileScanner />
        <Footer />
      </div>
    </ScanStatsProvider>
  );
}