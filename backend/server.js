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

app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(apiLimiter);

app.use("/API/URLscan", scanLimiter);
app.use("/API/filescan", fileLimiter);

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