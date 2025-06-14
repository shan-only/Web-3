const https = require("https");

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = "shan-only/PersonalWeb3";
const FILEPATH = "visits.json";
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
              errors: json.errors,
            });
          }
        } catch (e) {
          reject({
            statusCode: 500,
            message: "JSON parse error",
            details: e.message,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject({
        statusCode: 500,
        message: "Network error",
        details: error.message,
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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Get current visits data
    let fileData;
    let visits = { total: 0, daily: {}, hourly: {}, monthly: {}, sources: {} };
    let sha = null;

    try {
      fileData = await githubRequest(`/repos/${REPO}/contents/${FILEPATH}?ref=${BRANCH}`);

      // Handle parsing errors by resetting visits data
      try {
        const content = Buffer.from(fileData.content, "base64").toString();
        visits = JSON.parse(content);
      } catch (parseError) {
        console.error("JSON parse error, resetting visits data", parseError);
        visits = { total: 0, daily: {}, hourly: {}, monthly: {}, sources: {} };
      }
      
      sha = fileData.sha;
    } catch (error) {
      if (error.statusCode !== 404) throw error;
    }

    // Update visit data
    const now = new Date();
    const dateKey = now.toISOString().split("T")[0];
    const hourKey = now.getHours();
    const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;

    visits.total = (visits.total || 0) + 1;
    visits.daily[dateKey] = (visits.daily[dateKey] || 0) + 1;

    if (!visits.hourly[dateKey]) visits.hourly[dateKey] = {};
    visits.hourly[dateKey][hourKey] = (visits.hourly[dateKey][hourKey] || 0) + 1;

    visits.monthly[monthKey] = (visits.monthly[monthKey] || 0) + 1;

    const source = req.headers.referer || "direct";
    visits.sources[source] = (visits.sources[source] || 0) + 1;

    // Update file on GitHub
    const updatePayload = {
      message: `Update visit data ${now.toISOString()}`,
      content: Buffer.from(JSON.stringify(visits, null, 2)).toString("base64"),
      branch: BRANCH,
    };

    if (sha) updatePayload.sha = sha;

    await githubRequest(`/repos/${REPO}/contents/${FILEPATH}`, "PUT", updatePayload);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error saving visit:", error);

    // Handle file creation if not exists
    if (error.statusCode === 404) {
      try {
        const initialData = {
          total: 1,
          daily: {},
          hourly: {},
          monthly: {},
          sources: {},
        };

        const now = new Date();
        const dateKey = now.toISOString().split("T")[0];
        const hourKey = now.getHours();
        const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;

        initialData.daily[dateKey] = 1;
        initialData.hourly[dateKey] = { [hourKey]: 1 };
        initialData.monthly[monthKey] = 1;
        initialData.sources[req.headers.referer || "direct"] = 1;

        await githubRequest(`/repos/${REPO}/contents/${FILEPATH}`, "PUT", {
          message: "Initial visit data",
          content: Buffer.from(JSON.stringify(initialData, null, 2)).toString("base64"),
          branch: BRANCH,
        });

        return res.status(200).json({ success: true, created: true });
      } catch (createError) {
        console.error("Error creating file:", createError);
        return res.status(500).json({ error: "Failed to create file" });
      }
    }

    res.status(500).json({ error: "Failed to save visit" });
  }
};
