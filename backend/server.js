import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import scanURL from "./routes/URLscanRoutes.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.use("/API", scanURL)

app.get('/', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});