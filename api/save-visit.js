import { Octokit } from "@octokit/rest";

export default async (req, res) => {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  try {
    // Dapatkan konten file yang ada
    const { data } = await octokit.repos.getContent({
      owner: "shan-only",
      repo: "shan-only/PersonalWeb3",
      path: "visits.json",
      ref: "main", // Ganti dengan branch yang sesuai
    });

    const content = Buffer.from(data.content, "base64").toString();
    const visits = JSON.parse(content);

    // Update data
    const now = new Date();
    const dateKey = now.toISOString().split("T")[0];
    const hourKey = now.getHours();
    const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;

    visits.total = (visits.total || 0) + 1;

    // Update harian
    visits.daily[dateKey] = (visits.daily[dateKey] || 0) + 1;

    // Update per jam
    if (!visits.hourly[dateKey]) visits.hourly[dateKey] = {};
    visits.hourly[dateKey][hourKey] = (visits.hourly[dateKey][hourKey] || 0) + 1;

    // Update bulanan
    visits.monthly[monthKey] = (visits.monthly[monthKey] || 0) + 1;

    // Update sumber (opsional)
    const source = req.headers.referer || "direct";
    visits.sources = visits.sources || {};
    visits.sources[source] = (visits.sources[source] || 0) + 1;

    // Simpan kembali ke GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: "shan-only",
      repo: "shan-only/PersonalWeb3",
      path: "visits.json",
      message: `Update visit data ${new Date().toISOString()}`,
      content: Buffer.from(JSON.stringify(visits, null, 2)).toString("base64"),
      sha: data.sha,
      branch: "main", // Ganti dengan branch yang sesuai
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error saving visit:", error);

    // Jika file belum ada, buat yang baru
    if (error.status === 404) {
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

        await octokit.repos.createOrUpdateFileContents({
          owner: process.env.GITHUB_OWNER || "shan-only",
          repo: process.env.GITHUB_REPO || "PersonalWeb3",
          path: process.env.DATA_PATH || "data/visits.json",
          message: "Initial visit data",
          content: Buffer.from(JSON.stringify(initialData, null, 2)).toString("base64"),
          branch: "main", // Ganti dengan branch yang sesuai
        });

        return res.status(200).json({ success: true, created: true });
      } catch (createError) {
        console.error("Error creating new file:", createError);
        return res.status(500).json({ error: "Failed to create file" });
      }
    }

    res.status(500).json({ error: "Failed to save visit" });
  }
};
