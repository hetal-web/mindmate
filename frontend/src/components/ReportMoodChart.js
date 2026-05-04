// ─── ReportMoodChart.js ───────────────────────────────────────────────────────
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend } from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend);

const moodMap = { 2: "Very Positive", 1: "Positive", 0: "Neutral", "-1": "Low", "-2": "Very Low" };

const ReportMoodChart = ({ moodData }) => {
  if (!moodData || moodData.length === 0) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "0.9rem" }}>
        No mood data available
      </div>
    );
  }

  const last7 = moodData.slice(-7);

  const data = {
    labels: last7.map(d => new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })),
    datasets: [{
      label: "Mood",
      data: last7.map(d => d.score),
      borderColor: "#2563eb",
      backgroundColor: "rgba(37,99,235,0.08)",
      pointBackgroundColor: last7.map(d => {
        if (d.score >= 1) return "#22c55e";
        if (d.score >= 0) return "#eab308";
        if (d.score >= -1) return "#f97316";
        return "#ef4444";
      }),
      fill: true, tension: 0.35, pointRadius: 6, pointHoverRadius: 9, borderWidth: 2.5,
    }]
  };

  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => moodMap[String(ctx.raw)] || ctx.raw },
        backgroundColor: "#1e293b", bodyColor: "#f1f5f9",
        padding: 10, cornerRadius: 8,
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

  return <Line data={data} options={options} />;
};

export default ReportMoodChart;