// api/testimonials.js
const https = require("https");

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = "shan-only/PersonalWeb3"; // Format: 'username/repo'
const FILEPATH = "testimonials.json";
const BRANCH = "main";

// Fungsi yang sama seperti di products.js
function githubRequest(path, method = "GET", data = null) {
  /* ... */
}

module.exports = async (req, res) => {
  if (!TOKEN || !REPO) {
    return res.status(500).json({ error: "Missing GitHub configuration" });
  }

  try {
    // Dapatkan data file dari GitHub
    const fileData = await githubRequest(`/repos/${REPO}/contents/${FILEPATH}?ref=${BRANCH}`);
    const content = Buffer.from(fileData.content, "base64").toString("utf8");
    let testimonials = content ? JSON.parse(content) : [];

    if (req.method === "GET") {
      return res.status(200).json(testimonials);
    }

    // Tambah testimoni baru (POST)
    if (req.method === "POST") {
      const newTestimonial = req.body;

      // Validasi data
      if (!newTestimonial.name || !newTestimonial.rating || !newTestimonial.comment) {
        return res.status(400).json({ error: "Nama, rating, dan komentar wajib diisi" });
      }

      testimonials.push(newTestimonial);
    }

    // Update file di GitHub
    const updatedContent = Buffer.from(JSON.stringify(testimonials, null, 2)).toString("base64");

    await githubRequest(`/repos/${REPO}/contents/${FILEPATH}`, "PUT", {
      message: req.method === "POST" ? `Tambah testimoni dari: ${req.body.name}` : "Update testimoni",
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
