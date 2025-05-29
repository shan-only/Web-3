// api/products.js
const https = require("https");

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = "shan-only/PersonalWeb3"; // Format: 'username/repo'
const FILEPATH = "products.json";
const BRANCH = "main";

function githubRequest(path, method = "GET", data = null) {
  const options = {
    hostname: "api.github.com",
    path,
    method,
    headers: {
      "User-Agent": "Vercel-App",
      Authorization: `token ${TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(body || "{}");
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject({ statusCode: res.statusCode, body: json });
          }
        } catch (e) {
          reject({ statusCode: res.statusCode, body, error: "JSON parse error" });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

module.exports = async (req, res) => {
  if (!TOKEN || !REPO) {
    return res.status(500).json({ error: "Missing GitHub configuration" });
  }

  try {
    // Dapatkan data file dari GitHub
    const fileData = await githubRequest(`/repos/${REPO}/contents/${FILEPATH}?ref=${BRANCH}`);
    const content = Buffer.from(fileData.content, "base64").toString("utf8");
    let products = content ? JSON.parse(content) : [];

    if (req.method === "GET") {
      return res.status(200).json(products);
    }

    // Tambah produk baru (POST)
    if (req.method === "POST") {
      const newProduct = req.body;

      // Validasi data
      if (!newProduct.name || !newProduct.image || !newProduct.price) {
        return res.status(400).json({ error: "Nama, gambar, dan harga wajib diisi" });
      }

      products.push(newProduct);
    }

    // Update file di GitHub
    const updatedContent = Buffer.from(JSON.stringify(products, null, 2)).toString("base64");

    await githubRequest(`/repos/${REPO}/contents/${FILEPATH}`, "PUT", {
      message: req.method === "POST" ? `Tambah produk: ${req.body.name}` : "Update produk",
      content: updatedContent,
      sha: fileData.sha,
      branch: BRANCH,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.body?.message || error.message || "Unknown error",
    });
  }
};
