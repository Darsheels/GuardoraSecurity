import { useEffect, useState } from "react"
import axios from "axios"

export default function History() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await axios.get(
                "http://localhost:5000/API/scans"
            );
            
            setHistory(response.data);
        } catch (error) {
            console.error("Error fetching history:", error);
        }
    }
    return (
        <div className="History">
            <div className="History-Content">
                <h2 className="History-Title">Scan History</h2>

                {history.length === 0 ? (
                    <p>No scan history available.</p>
                ) : (
                    history.map((scan) => {
                        return (<div key={scan.id} className="History-Item">
                            <p><strong>URL:</strong> {scan.url}</p>
                            <p><strong>Status:</strong> {scan.status}</p>
                            <p><strong>Risk:</strong> {scan.risk_level}</p>
                            <p><strong>Date:</strong> {scan.created_at}</p>
                        </div>
                       );
                    })
                )}
            </div>
        </div>
    )
}