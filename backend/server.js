import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import scanURL from "./routes/URLscanRoutes.js";
import scanFile from "./routes/FilescanRoutes.js";
import db from "./db.js";
import { apiLimiter, scanLimiter, fileLimiter} from "./middleware/rateLimiter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

app.use(express.json({ limit: "10mb" }));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://www.guardorasec.com",
  "https://guardorasec.com"
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false); 
    }
  }
};

app.use(cors(corsOptions));
app.use(apiLimiter);

app.use("/API/URLscan", scanLimiter);

app.use("/API", scanURL);
app.use("/API", scanFile);

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/", (req, res) => res.json({ message: "Hello from the backend!" }));

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await db.end();
    console.log("Pool closed");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));