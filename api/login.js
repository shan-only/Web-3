module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).end('Method Not Allowed');
  }

  const { username, password } = req.query;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ success: false });
  }
};