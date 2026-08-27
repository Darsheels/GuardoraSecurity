import { BrowserRouter, Routes, Route } from "react-router-dom";
import Hero from "./components/Hero";
import Header from "./components/Header";
import QRScanner from "./components/QR";
import URLScanner from "./components/URL";
import Footer from "./components/Footer";
import FileScanner from "./components/FileScanner";
import { ScanStatsProvider } from "./contexts/ScanStatsContext";
import HashScanner from "./components/HashScanner";
import PublicScanResult from "./components/PublicScanResult";

function HomePage() {
  return (
    <>
      <Header />
      <Hero />
      <QRScanner />
      <URLScanner />
      <FileScanner />
      <HashScanner />
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <ScanStatsProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/scan/:publicId" element={<PublicScanResult />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ScanStatsProvider>
  );
}