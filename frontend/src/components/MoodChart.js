import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import API_URL from "../config";
import useUser from "../hooks/useUser";

const moodMap = { 2: "Very Positive", 1: "Positive", 0: "Neutral", "-1": "Low", "-2": "Very Low" };

function MoodChart({ year, month }) {
  const user = useUser();
  const userId = user?.id;
  const [moodData, setMoodData] = useState([]);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_URL}/mood-data/${userId}`)
      .then(res => res.json())
      .then(data => setMoodData(data))
      .catch(err => console.error("MoodChart fetch error:", err));
  }, [userId]);

  if (!userId) return <p style={{ color: "#94a3b8", textAlign: "center" }}>Please login</p>;

  const filteredData = moodData.filter(d => {
    const date = new Date(d.date);
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  });

  if (filteredData.length === 0) return (
    <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "0.9rem" }}>
      No mood data for this period
    </div>
  );

  const chartData = {
    labels: filteredData.map(d => new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })),
    datasets: [{
      label: "Mood",
      data: filteredData.map(d => d.score),
      borderColor: "#2563eb",
      backgroundColor: "rgba(37,99,235,0.08)",
      pointBackgroundColor: filteredData.map(d => {
        if (d.score >= 1) return "#22c55e";
        if (d.score >= 0) return "#eab308";
        if (d.score >= -1) return "#f97316";
        return "#ef4444";
      }),
      pointRadius: 6, tension: 0.35, fill: true, borderWidth: 2.5,
    }]
  };

  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => moodMap[String(ctx.raw)] || ctx.raw },
        backgroundColor: "#1e293b", bodyColor: "#f1f5f9", padding: 10, cornerRadius: 8,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#94a3b8", font: { size: 11 } } },
      y: {
        min: -2, max: 2, grid: { color: "#f8fafc" },
        ticks: { stepSize: 1, color: "#94a3b8", font: { size: 11 }, callback: (v) => moodMap[v] || v }
      }
    }
  };

  return <Line data={chartData} options={options} />;
}

export default MoodChart;