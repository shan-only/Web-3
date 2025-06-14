// save-visit.js
const GAS_URL = "https://script.google.com/macros/s/AKfycbyVDHIc1FlHVDXmzyAXNMZ6dmZNQwDWrUAlgAhMfPoc6wzCxxGyCaunjkNdKFYm3kbU/exec";

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const source = req.headers.referer || 'direct';
    
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'save-visit',
        source
      })
    });

    const data = await response.json();
    
    if (data.success) {
      res.status(200).json({ success: true });
    } else {
      throw new Error(data.error || 'Failed to save visit');
    }
  } catch (error) {
    console.error('Error saving visit:', error);
    res.status(500).json({ error: error.message });
  }
};
