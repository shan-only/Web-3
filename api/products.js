const https = require("https");

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = "shan-only/PersonalWeb3";
const FILEPATH = "products.json";
const BRANCH = "main";

function githubRequest(path, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.github.com",
      path,
      method,
      headers: {
        "User-Agent": "Vercel-App",
        Authorization: `token ${TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(body || "{}");
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject({
              statusCode: res.statusCode,
              message: json.message || `GitHub API error: ${res.statusCode}`,
            });
          }
        } catch (e) {
          reject({ 
            statusCode: 500, 
            message: "JSON parse error",
            details: e.message 
          });
        }
      });
    });

    req.on("error", (error) => {
      reject({ 
        statusCode: 500, 
        message: "Network error",
        details: error.message 
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!TOKEN) {
    return res.status(500).json({ 
      error: "Missing GitHub token. Please set GITHUB_TOKEN environment variable." 
    });
  }

  try {
    // GET: Return product list
    if (req.method === "GET") {
      let fileData;
      try {
        fileData = await githubRequest(
          `/repos/${REPO}/contents/${FILEPATH}?ref=${BRANCH}`
        );
      } catch (error) {
        // Handle 404 - File not found
        if (error.statusCode === 404) {
          return res.status(200).json([]);
        }
        throw error;
      }
      
      if (fileData.content) {
        const content = Buffer.from(fileData.content, "base64").toString("utf8");
        try {
          return res.status(200).json(JSON.parse(content));
        } catch (e) {
          return res.status(500).json({ 
            error: "Invalid JSON format in products file",
            details: e.message
          });
        }
      }
      return res.status(200).json([]);
    }

    // POST: Add new product
    if (req.method === "POST") {
      const newProduct = req.body;
      
      // Validate data
      if (!newProduct.name || !newProduct.image || !newProduct.price) {
        return res.status(400).json({ 
          error: "Nama, gambar, dan harga wajib diisi" 
        });
      }

      // Convert price to number
      newProduct.price = parseFloat(newProduct.price);
      if (isNaN(newProduct.price)) {
        return res.status(400).json({ 
          error: "Harga harus berupa angka" 
        });
      }

      // Get current products
      let fileData;
      let products = [];
      
      try {
        fileData = await githubRequest(
          `/repos/${REPO}/contents/${FILEPATH}?ref=${BRANCH}`
        );
        
        if (fileData.content) {
          const content = Buffer.from(fileData.content, "base64").toString("utf8");
          products = JSON.parse(content);
        }
      } catch (error) {
        // If file doesn't exist, create new one
        if (error.statusCode !== 404) throw error;
      }

      // Add new product
      products.push(newProduct);

      // Prepare update payload
      const updatePayload = {
        message: `Tambah produk: ${newProduct.name}`,
        content: Buffer.from(JSON.stringify(products, null, 2)).toString("base64"),
        branch: BRANCH,
      };

      // Add SHA if file exists
      if (fileData && fileData.sha) {
        updatePayload.sha = fileData.sha;
      }

      // Update file on GitHub
      await githubRequest(`/repos/${REPO}/contents/${FILEPATH}`, "PUT", updatePayload);

      return res.status(201).json({ 
        success: true,
        message: "Produk berhasil ditambahkan" 
      });
    }

    return res.status(405).json({ 
      error: "Method not allowed. Only GET and POST are supported." 
    });
  } catch (error) {
    console.error("Products API Error:", error);
    return res.status(error.statusCode || 500).json({
      error: error.message || "Internal server error",
      details: error.details || "No additional details"
    });
  }
};
