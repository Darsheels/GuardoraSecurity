import Hero from "./components/Hero"
import Header from "./components/Header"
import QRScanner from "./components/QR"
import URLScanner from "./components/URL"

export default function App() {
  return (
    <div className="App">
      <Header></Header>
      <Hero></Hero>
      <QRScanner></QRScanner>
      <URLScanner></URLScanner>
    </div>
  )
}


