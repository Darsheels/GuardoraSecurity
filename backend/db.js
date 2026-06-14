import sqlite3 from "sqlite3";

const db = new sqlite3.Database("guardora.db", (err) => {
    if (err) {
        console.error("Error opening database:", err);
    } else {
        console.log("Connected to the database.");
    }
});

export default db;