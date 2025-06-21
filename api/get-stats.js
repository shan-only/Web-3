// get-stats.js
const GAS_URL = "https://script.google.com/macros/s/AKfycbwrTl7pBgUy655M07KnpsoXEeID7jzT4AlqKbcuPTSb9IWPjqRE-XfPcurBB90dciUc/exec";

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Get stats data from Google Apps Script
    const response = await fetch(`${GAS_URL}/exec`);
    
    if (!response.ok) {
      throw new Error(`GAS responded with status: ${response.status}`);
    }

    const visits = await response.json();

    // Calculate statistics with WIB time (UTC+7)
    const now = new Date();
    const wibOffset = 7 * 60 * 60 * 1000; // UTC+7 in milliseconds
    const wibTime = new Date(now.getTime() + wibOffset);

    const today = wibTime.toISOString().split("T")[0];
    const yesterday = new Date(wibTime);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split("T")[0];

    const stats = {
      daily: visits.daily[today] || 0,
      weekly: 0,
      monthly: 0,
      total: visits.total || 0,
      dailyChange: 0,
    };

    // Calculate weekly (last 7 days)
    for (let i = 0; i < 7; i++) {
      const date = new Date(wibTime);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      stats.weekly += visits.daily[dateKey] || 0;
    }

    // Calculate monthly
    const currentMonth = `${wibTime.getFullYear()}-${String(wibTime.getMonth() + 1).padStart(2, '0')}`;
    stats.monthly = visits.monthly[currentMonth] || 0;

    // Calculate daily change
    if (visits.daily[yesterdayKey]) {
      stats.dailyChange = Math.round(((stats.daily - visits.daily[yesterdayKey]) / visits.daily[yesterdayKey]) * 100);
    }

    // Prepare chart data for daily (last 7 days) in WIB
    const dates = [];
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(wibTime);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      dates.push(`${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`);
      dailyData.push(visits.daily[dateKey] || 0);
    }

    // Prepare hourly data for today in WIB
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    let hourlyData = Array(24).fill(0);
    
    // Use today's hourly data if available
    if (visits.hourly[today]) {
      for (let hour = 0; hour < 24; hour++) {
        hourlyData[hour] = visits.hourly[today][hour] || 0;
      }
    }

    // Prepare monthly data for the last 12 months
    const months = [];
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(wibTime);
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push(date.toLocaleString("id", { month: "short" }));
      monthlyData.push(visits.monthly[monthKey] || 0);
    }

    // Prepare source data
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
