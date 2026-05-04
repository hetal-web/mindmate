import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend } from "chart.js";
import config from "../config";
import useUser from "../hooks/useUser";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend);

const moodLabels = { 2: "Very Positive 😊", 1: "Positive 🙂", 0: "Neutral 😐", "-1": "Low 😔", "-2": "Very Low 😞" };
const moodColors = { 2: "#22c55e", 1: "#84cc16", 0: "#f0c133", "-1": "#F97316", "-2": "#F44336" };

const statCard = (label, value, sub, color) => (
  <div style={{ background: "#fff", borderRadius: "16px", padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", flex: 1, minWidth: "140px" }}>
    <p style={{ margin: "0 0 4px", fontSize: "0.78rem", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px" }}>{label}</p>
    <p style={{ margin: "0 0 2px", fontSize: "1.5rem", fontWeight: "700", color: color || "#1e293b" }}>{value}</p>
    {sub && <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>{sub}</p>}
  </div>
);

function MoodGraph() {
  const user = useUser();
  const userId = user.id || 1;
  const [moodData, setMoodData] = useState([]);

  useEffect(() => {
    if (!userId) return;
    fetch(`${config.API_URL}/mood-last-24h/${userId}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => setMoodData(data))
      .catch(err => console.error("Error loading mood data:", err));
  }, [userId]);

  const labels = moodData.map(d => new Date(d.time || d.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  const chartInnerWidth = Math.max(900, labels.length * 80);
  const scores = moodData.map(d => d.score);

  const chartData = {
    labels,
    datasets: [{
      label: "Mood Score", data: scores,
      borderColor: "#2563eb", backgroundColor: "rgba(37,99,235,0.08)",
      pointBackgroundColor: moodData.map(d => moodColors[String(d.score)] || "#94a3b8"),
      pointRadius: 7, pointHoverRadius: 10,
      tension: 0.35, fill: true, borderWidth: 2.5,
    }]
  };

  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => moodLabels[String(ctx.raw)] || ctx.raw,
          title: (items) => `Time: ${items[0].label}`,
        },
        backgroundColor: "#1e293b", titleColor: "#94a3b8",
        bodyColor: "#f1f5f9", padding: 12, cornerRadius: 10,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#94a3b8", font: { size: 11 } } },
      y: {
        min: -2, max: 2, grid: { color: "#f1f5f9" },
        ticks: {
          stepSize: 1, color: "#94a3b8", font: { size: 11 },
          callback: (v) => ({ 2: "Very Positive", 1: "Positive", 0: "Neutral", "-1": "Low", "-2": "Very Low" })[v] || v
        }
      }
    }
  };

  const avgMood = moodData.length > 0 ? (moodData.reduce((s, d) => s + d.score, 0) / moodData.length) : 0;
  const latestMood = moodData.length > 0 ? moodData[moodData.length - 1].score : 0;
  const lastThree = moodData.slice(-3);
  const lowTrend = lastThree.length === 3 && lastThree.every(d => d.score <= -1);
  const upTrend = lastThree.length === 3 && lastThree.every(d => d.score >= 0);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "8px 0 32px" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #60a5fa 100%)", borderRadius: "20px", padding: "28px 32px", marginBottom: "24px", color: "white" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "1.5rem", fontWeight: "700" }}>📊 Mood Graph</h1>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: "0.9rem" }}>Your emotional patterns from the last 24 hours</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: "14px", marginBottom: "20px", flexWrap: "wrap" }}>
        {statCard("Current Mood", moodLabels[String(latestMood)]?.split(" ")[0] || "—", moodLabels[String(latestMood)]?.split(" ")[1], moodColors[String(latestMood)])}
        {statCard("Average (24h)", avgMood.toFixed(2), avgMood >= 0 ? "Trending positive" : "Trending low", avgMood >= 0 ? "#22c55e" : "#F97316")}
        {statCard("Data Points", moodData.length, "mood logs today", "#2563eb")}
      </div>

      {/* Chart card */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "600", color: "#1e293b" }}>Mood Over Time</h3>
          <div style={{ display: "flex", gap: "12px", fontSize: "0.78rem" }}>
            {[["#22c55e", "Positive"], ["#f0c133", "Neutral"], ["#F97316", "Low"], ["#F44336", "Very Low"]].map(([c, l]) => (
              <span key={l} style={{ display: "flex", alignItems: "center", gap: "4px", color: "#64748b" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: c, display: "inline-block" }} />{l}
              </span>
            ))}
          </div>
        </div>
        <div style={{ width: "100%", height: "320px", overflowX: "auto" }}>
          <div style={{ minWidth: `${chartInnerWidth}px`, height: "100%" }}>
            <Line data={chartData} options={options} />
          </div>
        </div>
      </div>

      {/* Insight card */}
      {(lowTrend || upTrend || moodData.length === 0) && (
        <div style={{ borderRadius: "14px", padding: "18px 22px", background: lowTrend ? "#fef2f2" : upTrend ? "#f0fdf4" : "#f8fafc", border: `1px solid ${lowTrend ? "#fecaca" : upTrend ? "#bbf7d0" : "#e2e8f0"}` }}>
          <h4 style={{ margin: "0 0 6px", fontSize: "0.9rem", fontWeight: "600", color: lowTrend ? "#dc2626" : upTrend ? "#16a34a" : "#475569" }}>
            {lowTrend ? "⚠️ Mood Alert" : upTrend ? "✅ Great Progress" : "💡 No Data Yet"}
          </h4>
          <p style={{ margin: 0, fontSize: "0.88rem", color: lowTrend ? "#991b1b" : upTrend ? "#166534" : "#64748b", lineHeight: 1.6 }}>
            {lowTrend && "Your mood has been consistently low. Try a short walk, breathing exercise, or talking to someone you trust."}
            {upTrend && "Your mood has been consistently positive recently. Keep up the great self-care!"}
            {moodData.length === 0 && "Start chatting with MindMate to begin tracking your mood."}
          </p>
        </div>
      )}
    </div>
  );
}

export default MoodGraph;