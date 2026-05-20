import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

app.get('/API/scan', async (req, res) => {
  
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ result: 'URL parameter is required' });
    }

    try {
      console.log("This is my key: ", process.env.GOOGLE_SAFE_BROWSING_KEY);
      const response = await axios.post(  
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_BROWSING_KEY}`,
        {
          client: {
            clientId: "GuardoraSecurity",
            clientVersion: "1.0"
          },
          threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [
              { url }
            ]
          }
        }
      )
      res.json({ result: 'URL scanned successfully', data: response.data });
    } catch (error) {
      console.error('Error scanning URL:', error);
      res.status(500).json({ result: 'Error scanning URL' });
    }
  }
);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});