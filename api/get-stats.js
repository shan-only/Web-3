const GAS_URL = "https://script.google.com/macros/s/AKfycbz_fdqOgLn3SoEaMeq-nsAAsdUapDKpRjjJG5ALvJarqnG4QgHQKYO8uJO9mQCMdt4w/exec
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
