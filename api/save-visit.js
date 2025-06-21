// save-visit.js
const GAS_URL = "https://script.google.com/macros/s/AKfycbzIxZXy4A1_V8LWh3Moitg_xXbTv8YW7zQyEPyHQ5tJnKPZbY_EwonsGD4LjP_yGhgh/exec";

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Get source from headers
    const source = req.headers.referer || "direct";
    
    // Send data to Google Apps Script
    const response = await fetch(`${GAS_URL}/exec`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ source })
    });

    if (!response.ok) {
      throw new Error(`GAS responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      res.status(200).json({ success: true });
    } else {
      throw new Error("GAS returned unsuccessful response");
    }
  } catch (error) {
    console.error("Error saving visit:", error);
    res.status(500).json({ error: "Failed to save visit" });
  }
};
