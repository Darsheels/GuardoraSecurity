import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const dbUrl = process.env.DB_URL?.trim();
const isFullUri = dbUrl?.startsWith("postgres://") || dbUrl?.startsWith("postgresql://");

const poolConfig = {
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

if (isFullUri) {
  poolConfig.connectionString = dbUrl;
} else {
  if (dbUrl) {
    console.warn("DB_URL provided is not a full PostgreSQL URI, using host/port/user/password/database instead.");
  }

  if (process.env.DB_HOST) poolConfig.host = process.env.DB_HOST;
  if (process.env.DB_PORT) poolConfig.port = Number(process.env.DB_PORT);
  if (process.env.DB_USER) poolConfig.user = process.env.DB_USER;
  if (process.env.DB_PASSWORD) poolConfig.password = process.env.DB_PASSWORD;
  if (process.env.DB_NAME) poolConfig.database = process.env.DB_NAME;
}

const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

const db = {
  query: async (text, params) => {
    const client = await pool.connect();
    try {
      return await client.query(text, params);
    } finally {
      client.release();
    }
  },
  all: async (text, params) => {
    const client = await pool.connect();
    try {
      const res = await client.query(text, params);
      return res.rows;
    } finally {
      client.release();
    }
  },
};

db.end = () => pool.end();

export default db;