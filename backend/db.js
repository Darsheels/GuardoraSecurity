import sqlite3 from "sqlite3";

const db = new sqlite3.Database("guardora.db", (err) => {
    if (err) {
        console.error("Error opening database:", err);
    } else {
        console.log("Connected to the database.");
    }
});

db.run(`
    CREATE TABLE IF NOT EXISTS scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        status TEXT NOT NULL,
        risk_level TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

export default db;