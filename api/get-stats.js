import { Octokit } from "@octokit/rest";

export default async (req, res) => {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  try {
    const { data } = await octokit.repos.getContent({
      owner: "shan-only",
      repo: "shan-only/PersonalWeb3",
      path: "visits.json",
      ref: "main", // Ganti dengan branch yang sesuai
    });

    const content = Buffer.from(data.content, "base64").toString();
    const visits = JSON.parse(content);

    // Hitung statistik
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split("T")[0];

    const stats = {
      daily: visits.daily[today] || 0,
      weekly: 0,
      monthly: 0,
      total: visits.total || 0,
      dailyChange: 0,
      hourly: visits.hourly[today] || {},
    };

    // Hitung mingguan (7 hari terakhir)
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      stats.weekly += visits.daily[dateKey] || 0;
    }

    // Hitung bulanan
    const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
    stats.monthly = visits.monthly[currentMonth] || 0;

    // Hitung perubahan harian
    if (visits.daily[yesterdayKey]) {
      stats.dailyChange = Math.round(((stats.daily - visits.daily[yesterdayKey]) / visits.daily[yesterdayKey]) * 100);
    }

    // Data untuk chart
    const dates = [];
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      dates.push(`${date.getDate()}/${date.getMonth() + 1}`);
      dailyData.push(visits.daily[dateKey] || 0);
    }

    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const hourlyData = hours.map((_, hour) => stats.hourly[hour] || 0);

    const months = [];
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      months.push(date.toLocaleString("id", { month: "short" }));
      monthlyData.push(visits.monthly[monthKey] || 0);
    }

    const sources = Object.keys(visits.sources || {});
    const sourceData = Object.values(visits.sources || {});
    const sourceColors = ["#33aaff", "#ff6b6b", "#00cc99", "#ffcc00", "#9933ff", "#ff9933"];

    res.status(200).json({
      stats,
      dates,
      dailyData,
      hours,
      hourlyData,
      months,
      monthlyData,
      sources,
      sourceData,
      sourceColors,
    });
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};
