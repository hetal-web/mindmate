import { useEffect, useState } from "react";
import "./Calendar.css";
import config from "../config";
import useUser from "../hooks/useUser";

function Calendar() {
  const user = useUser();
  const [calendarData, setCalendarData] = useState([]);
  const [streak, setStreak] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getMoodColor = (avgMood) => {
    if (avgMood === null || avgMood === undefined) return null;
    const mood = parseFloat(avgMood);
    if (mood >= 0.6) return { bg: "#dcfce7", dot: "#22c55e" };
    if (mood >= 0.2) return { bg: "#d1fae5", dot: "#10b981" };
    if (mood >= -0.2) return { bg: "#fef9c3", dot: "#eab308" };
    if (mood >= -0.5) return { bg: "#ffedd5", dot: "#f97316" };
    return { bg: "#fee2e2", dot: "#ef4444" };
  };

  const getStreakInfo = (s) => {
    if (s === 0) return { icon: "🌱", msg: "Start your journey today" };
    if (s === 1) return { icon: "✨", msg: "Nice start! Keep going" };
    if (s < 4) return { icon: "🔥", msg: "Building a great habit" };
    if (s < 7) return { icon: "💪", msg: "Consistency is growing" };
    if (s < 14) return { icon: "🚀", msg: "Amazing dedication" };
    return { icon: "🏆", msg: "You're unstoppable!" };
  };

  const goToPrevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  useEffect(() => {
    if (!user.id) return;
    fetch(`${config.API_URL}/calendar/${user.id}?year=${year}&month=${month + 1}`)
      .then(res => res.json())
      .then(data => { setCalendarData(data.calendar); setStreak(data.streak); })
      .catch(err => console.error("Calendar error:", err));
  }, [year, month, user.id]);

  const dataMap = {};
  calendarData.forEach(d => { dataMap[d.date] = d; });

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) {
    days.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }

  const today = new Date().toLocaleDateString("en-CA");
  const streakInfo = getStreakInfo(streak);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "8px 0 32px" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #60a5fa 100%)", borderRadius: "20px", padding: "28px 32px", marginBottom: "24px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: "0 0 6px", fontSize: "1.5rem", fontWeight: "700" }}>📅 Mood Calendar</h1>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: "0.9rem" }}>Track your emotional journey day by day</p>
        </div>
        <div style={{ textAlign: "center", background: "rgba(255,255,255,0.15)", borderRadius: "14px", padding: "14px 20px" }}>
          <div style={{ fontSize: "2rem" }}>{streakInfo.icon}</div>
          <div style={{ fontSize: "1.3rem", fontWeight: "700" }}>{streak} days</div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)" }}>{streakInfo.msg}</div>
        </div>
      </div>

      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <button onClick={goToPrevMonth} className="cal-nav-btn">◀</button>
        <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700", color: "#1e293b" }}>
          {currentDate.toLocaleString("default", { month: "long" })} {year}
        </h2>
        <button onClick={goToNextMonth} className="cal-nav-btn">▶</button>
      </div>

      {/* Day headers */}
      <div className="cal-grid cal-header">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: "0.78rem", fontWeight: "600", color: "#94a3b8", paddingBottom: "8px" }}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="cal-grid">
        {days.map((day, i) => {
          const dayData = dataMap[day];
          const isToday = day === today;
          const colors = dayData ? getMoodColor(dayData.avg_mood) : null;

          return (
            <div
              key={i}
              className={`cal-day ${dayData ? "has-data" : ""} ${isToday ? "is-today" : ""}`}
              style={{ background: colors ? colors.bg : "#f8fafc" }}
              onClick={() => dayData && setSelectedDay(dayData)}
            >
              <div className={`cal-day-num ${isToday ? "today-num" : ""}`}>
                {day ? parseInt(day.split("-")[2]) : ""}
              </div>
              {colors && <div className="cal-dot" style={{ background: colors.dot }} />}
              {dayData && (
                <div className="cal-entry-count">{dayData.journal_count}📓</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", marginTop: "16px", flexWrap: "wrap", justifyContent: "center" }}>
        {[["#22c55e", "Great"], ["#eab308", "Neutral"], ["#f97316", "Low"], ["#ef4444", "Very Low"], ["#f8fafc", "No data"]].map(([c, l]) => (
          <span key={l} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#64748b" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: c, border: "1px solid #e2e8f0", display: "inline-block" }} />{l}
          </span>
        ))}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="details-card">
          <button className="details-close" onClick={() => setSelectedDay(null)}>✕</button>
          <h3>📅 {selectedDay.date}</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Mood score</span>
              <span className="detail-value">{selectedDay.avg_mood?.toFixed(2)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Journal entries</span>
              <span className="detail-value">{selectedDay.journal_count}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Meditation</span>
              <span className="detail-value">{selectedDay.meditation || 0} mins</span>
            </div>
          </div>
          {selectedDay.summary && (
            <p style={{ margin: "14px 0 0", fontSize: "0.9rem", color: "#64748b", fontStyle: "italic", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
              {selectedDay.summary}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Calendar;