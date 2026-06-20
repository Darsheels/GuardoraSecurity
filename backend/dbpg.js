import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL");
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1);
  }
}

const db = {
  query: async (text, params) => {
    try {
      const res = await client.query(text, params);
      return res;
    } catch (err) {
      console.error("Query error:", err.message);
      throw err;
    }
  },
  all: async (text, params) => {
    try {
      const res = await client.query(text, params);
      return res.rows;
    } catch (err) {
      console.error("Query error:", err.message);
      throw err;
    }
  },
};

async function testDB() {
  await connectDB();
  try {
    const res = await db.query("SELECT * FROM users LIMIT 5");
    console.log("Users:", res.rows);
  } catch (err) {
    console.error(" Test query failed:", err.message);
  } finally {
    await client.end();
    console.log(" Disconnected from PostgreSQL");
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  testDB();
}

await connectDB();

export default db;
