import axios from "axios";

export async function ScanURL(req,res) {
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ result: 'URL parameter is required' });
    }

    if (!process.env.GOOGLE_SAFE_BROWSING_KEY) {
        return res.status(500).json({
            result: "Safe Browsing API key not configured"
        });
    }

    try {
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
      );

      if (response.data.matches) {
        return res.json({
          result: "Dangerous URL detected",
          threats: response.data.matches
        });
      }

      return res.json({
          result: "URL appears safe"
      });

    } catch (error) {
      console.error('Error scanning URL:', error.response?.data || error.message);
      res.status(500).json({ result: 'Error scanning URL' });
    }
  };