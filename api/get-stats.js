const GAS_URL = "https://script.google.com/macros/s/AKfycbySJSoLG8A5AE7Sf4Kav7728FYbc-ok9ov6vcdospm_jIZ_oiojDwz5df45bZSUqNSy/exec
"; // URL deploy GAS

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch(`${GAS_URL}?action=get-stats`);
    const data = await response.json();
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
