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

      const matches = response.data.matches || [];

      if (matches.length === 0) {
        console.log("API works")
        return res.json({
          success: true,
          url,
          risk_level: "Low",
          status: "Safe",
          message: "No threats detected",
          source: "Google Safe Browsing"
        }); 
      }

      if (matches.length === 1) {
        if (matches.some(m => m.threatType === "UNWANTED_SOFTWARE")) {
          return res.json({
            success: true,
            url,
            risk_level: "Medium",
            status: "Potentially Unwanted",
            message: "This URL is associated with unwanted software",
            source: "Google Safe Browsing"
          });
        }
      }
      
      return res.json({
        success: true,
        url,
        risk_level: "High",
        status: "dangerous",
        message: "Threats detected for this URL",
        source: "Google Safe Browsing",
        threats: matches.map(m => ({
          threatType: m.threatType,
          platformType: m.platformType,
          threatEntryType: m.threatEntryType,
          matchedURL: m.threat?.url || url
        }))
      });

    } catch (error) {
      console.error('Error scanning URL:', error.response?.data || error.message);
      res.status(500).json({ result: 'Error scanning URL' });
    }
};