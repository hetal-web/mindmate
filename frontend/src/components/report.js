import { useEffect, useState } from "react";
import ReportMoodChart from "./ReportMoodChart";
import API_URL from "../config";
import useUser from "../hooks/useUser";

// ─────────────────────────────────────────────
// Personality type descriptions (MBTI-style)
// ─────────────────────────────────────────────
const PERSONALITY_DESCRIPTIONS = {
  INTJ: { title: "The Architect",     summary: "Strategic, independent, and highly analytical. INTJs are driven by logic and long-term vision, preferring depth over breadth in all pursuits.",            strengths: "Strategic thinking, decisiveness, high standards",          growth: "Opening up emotionally and embracing flexibility" },
  INTP: { title: "The Logician",      summary: "Curious and inventive thinkers who love exploring abstract ideas. INTPs seek precision and often lose themselves in thought.",                              strengths: "Analytical ability, creativity, open-mindedness",            growth: "Following through on ideas and social engagement" },
  ENTJ: { title: "The Commander",     summary: "Bold, imaginative, and strong-willed leaders who always find a way — or make one. ENTJs thrive in roles of authority and direction.",                     strengths: "Leadership, confidence, efficiency",                         growth: "Patience and emotional sensitivity toward others" },
  ENTP: { title: "The Debater",       summary: "Smart, curious thinkers who cannot resist an intellectual challenge. ENTPs love to debate and explore all angles of an idea.",                            strengths: "Wit, versatility, enthusiasm for ideas",                     growth: "Focusing energy and respecting boundaries" },
  INFJ: { title: "The Advocate",      summary: "Quiet, insightful, and deeply empathetic. INFJs are driven by a core sense of idealism and the desire to help others find their way.",                   strengths: "Empathy, vision, integrity",                                 growth: "Setting boundaries and avoiding burnout" },
  INFP: { title: "The Mediator",      summary: "Poetic and kind-hearted, INFPs are guided by their values and a deep desire for authenticity and meaning in everything they do.",                        strengths: "Compassion, creativity, open-mindedness",                    growth: "Managing self-criticism and staying grounded" },
  ENFJ: { title: "The Protagonist",   summary: "Charismatic and inspiring leaders who radiate warmth. ENFJs are natural mentors who genuinely care about the growth of those around them.",              strengths: "Empathy, communication, altruism",                           growth: "Prioritising their own needs without guilt" },
  ENFP: { title: "The Campaigner",    summary: "Enthusiastic, creative, and sociable free spirits who find reasons to smile everywhere. ENFPs love connecting ideas and people.",                        strengths: "Energy, empathy, creativity",                                growth: "Maintaining focus and following through" },
  ISTJ: { title: "The Logistician",   summary: "Practical and fact-minded, ISTJs are reliable and dedicated individuals who take responsibilities seriously.",                                            strengths: "Dependability, thoroughness, honesty",                       growth: "Embracing change and emotional expression" },
  ISFJ: { title: "The Defender",      summary: "Warm, caring protectors who are always ready to defend those they love. ISFJs combine practicality with deep emotional loyalty.",                        strengths: "Reliability, patience, generosity",                          growth: "Asserting personal needs and resisting overcommitment" },
  ESTJ: { title: "The Executive",     summary: "Excellent administrators who are unsurpassed at managing things and people. ESTJs value order, tradition, and clear expectations.",                      strengths: "Organisation, dedication, directness",                       growth: "Flexibility and emotional openness" },
  ESFJ: { title: "The Consul",        summary: "Caring, social, and popular people who are always eager to help. ESFJs thrive when they feel appreciated and connected to a community.",                strengths: "Warmth, practicality, loyalty",                              growth: "Building self-worth beyond others' opinions" },
  ISTP: { title: "The Virtuoso",      summary: "Bold, practical experimenters who love to explore with their hands and eyes. ISTPs master tools and skills with quiet intensity.",                       strengths: "Problem-solving, calm under pressure, adaptability",         growth: "Long-term planning and emotional communication" },
  ISFP: { title: "The Adventurer",    summary: "Flexible, charming artists who are always ready to explore something new. ISFPs live in the present and delight in creativity.",                        strengths: "Creativity, empathy, adaptability",                          growth: "Confidence and planning for the future" },
  ESTP: { title: "The Entrepreneur",  summary: "Smart, energetic, and perceptive people who enjoy living on the edge. ESTPs bring boldness and practicality to every situation.",                       strengths: "Boldness, directness, perceptiveness",                       growth: "Patience and consideration of long-term consequences" },
  ESFP: { title: "The Entertainer",   summary: "Spontaneous, energetic, and enthusiastic performers who love the spotlight and live for the moment.",                                                    strengths: "Optimism, practicality, social energy",                      growth: "Focus and long-term planning" },
};

function getPersonalityDesc(type) {
  return PERSONALITY_DESCRIPTIONS[type?.toUpperCase()] || {
    title: "Unique Profile",
    summary: "Your personality profile is one of a kind. Keep exploring what makes you, you.",
    strengths: "Self-awareness and openness",
    growth: "Continued self-exploration",
  };
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ background: "#fff", borderRadius: "14px", padding: "18px 20px", border: "1px solid #f1f5f9", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "14px" }}>
      <div style={{ fontSize: "24px", width: "44px", height: "44px", borderRadius: "12px", background: color + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <div>
        <p style={{ margin: "0 0 2px", fontSize: "0.75rem", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
        <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#1e293b" }}>{value}</p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: "16px", padding: "24px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", marginBottom: "16px" }}>
      <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: "700", color: "#1e293b", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>{title}</h3>
      {children}
    </div>
  );
}

function Report() {
  const user = useUser();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  useEffect(() => {
    if (!user.id) return;
    fetch(`${API_URL}/report/data/${user.id}`)
      .then(res => res.json())
      .then(data => setReport(data))
      .catch(() => setError("Failed to load report. Please try again."));
  }, [user.id]);

  if (error) return (
    <div style={{ padding: "20px" }}>
      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "16px 20px", color: "#dc2626" }}>⚠️ {error}</div>
    </div>
  );

  if (!report) return (
    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
      <div style={{ fontSize: "36px", marginBottom: "12px" }}>📊</div>
      <p>Loading your wellness report...</p>
    </div>
  );

  if (report.empty) return (
    <div style={{ maxWidth: "500px", margin: "60px auto", textAlign: "center" }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>💙</div>
      <h2 style={{ color: "#1e293b", marginBottom: "8px" }}>Welcome to MindMate</h2>
      <p style={{ color: "#64748b" }}>No data yet. Start chatting, journaling, or meditating to generate your wellness report.</p>
    </div>
  );

  const getMoodColor = (score) => score >= 1 ? "#22c55e" : score >= 0 ? "#eab308" : "#ef4444";
  const personalityDesc = getPersonalityDesc(report.personality);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "8px 0 32px" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #60a5fa 100%)", borderRadius: "20px", padding: "28px 32px", marginBottom: "24px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: "0 0 6px", fontSize: "1.5rem", fontWeight: "700" }}>📄 Wellness Report</h1>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: "0.9rem" }}>
            {today.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => window.open(`${API_URL}/report/${user.id || 1}`)}
          style={{ padding: "10px 20px", border: "2px solid rgba(255,255,255,0.4)", borderRadius: "10px", background: "rgba(255,255,255,0.15)", color: "white", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.25)"}
          onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.15)"}
        >
          ⬇️ Download PDF
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        <StatCard label="Streak" value={`${report.streak} days`} icon="🔥" color="#f97316" />
        <StatCard label="Journals" value={report.total_journals} icon="📓" color="#2563eb" />
        <StatCard label="Meditation" value={`${report.total_meditation} mins`} icon="🧘" color="#10b981" />
        <StatCard label="Avg Mood" value={report.avg_mood ?? "—"} icon="📊" color={getMoodColor(report.avg_mood)} />
      </div>

      {/* Personality */}
      <Section title="🧠 Personality Profile">
        {/* Type badge row */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
          <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "#1e40af", background: "#eff6ff", border: "2px solid #bfdbfe", borderRadius: "14px", padding: "10px 20px", letterSpacing: "2px", flexShrink: 0 }}>
            {report.personality || "—"}
          </div>
          <div>
            <p style={{ margin: "0 0 2px", fontWeight: "700", color: "#1e293b", fontSize: "1rem" }}>{personalityDesc.title}</p>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.88rem" }}>Based on your personality assessment</p>
          </div>
        </div>

        {/* Description card */}
        <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px 18px", border: "1px solid #e2e8f0" }}>
          <p style={{ margin: "0 0 12px", color: "#374151", fontSize: "0.92rem", lineHeight: 1.7 }}>
            {personalityDesc.summary}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ background: "#f0fdf4", borderRadius: "10px", padding: "10px 14px", border: "1px solid #bbf7d0" }}>
              <p style={{ margin: "0 0 4px", fontSize: "0.72rem", fontWeight: "700", color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.5px" }}>✦ Key Strengths</p>
              <p style={{ margin: 0, fontSize: "0.87rem", color: "#1e293b" }}>{personalityDesc.strengths}</p>
            </div>
            <div style={{ background: "#fefce8", borderRadius: "10px", padding: "10px 14px", border: "1px solid #fde68a" }}>
              <p style={{ margin: "0 0 4px", fontSize: "0.72rem", fontWeight: "700", color: "#ca8a04", textTransform: "uppercase", letterSpacing: "0.5px" }}>✦ Growth Area</p>
              <p style={{ margin: 0, fontSize: "0.87rem", color: "#1e293b" }}>{personalityDesc.growth}</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Mental Health */}
      <Section title="🧪 Mental Health Score">
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: "80px", height: "80px", flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: "80px", height: "80px", transform: "rotate(-90deg)" }}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={getMoodColor((report.mental_score || 0) / 50 - 1)}
                strokeWidth="3" strokeDasharray={`${report.mental_score || 0} 100`} strokeLinecap="round" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: "700", color: "#1e293b" }}>
              {report.mental_score ?? "—"}
            </div>
          </div>
          <div>
            <p style={{ margin: "0 0 4px", fontWeight: "600", color: "#1e293b" }}>Score: {report.mental_score} / 100</p>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.88rem", lineHeight: 1.6 }}>{report.mental_interpretation}</p>
          </div>
        </div>
      </Section>

      {/* Mood Analysis */}
      <Section title="📊 Mood Analysis">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px", marginBottom: "16px" }}>
          {[
            ["Best Day", report.best_day, "😊"],
            ["Lowest Day", report.worst_day, "😔"],
            ["Best Score", report.best_score, "⬆️"],
            ["Lowest Score", report.worst_score, "⬇️"],
          ].map(([label, val, icon]) => (
            <div key={label} style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px 14px" }}>
              <p style={{ margin: "0 0 2px", fontSize: "0.75rem", color: "#94a3b8", fontWeight: "600" }}>{icon} {label}</p>
              <p style={{ margin: 0, fontWeight: "700", color: "#1e293b" }}>{val ?? "—"}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Mood chart */}
      <Section title="📈 Weekly Mood Trend">
        <div style={{ height: "260px" }}>
          <ReportMoodChart moodData={report.weekly_mood} year={year} month={month} />
        </div>
      </Section>

      {/* AI Insights */}
      <Section title="🤖 AI Insights">
        <p style={{ margin: 0, color: "#374151", fontSize: "0.92rem", lineHeight: 1.8, background: "#f8fafc", borderRadius: "10px", padding: "14px 16px" }}>{report.insight}</p>
      </Section>

      {/* Recommendations */}
      <Section title="💡 Recommendations">
        {report.recommendations?.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {report.recommendations.map((rec, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 14px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                <span style={{ color: "#22c55e", fontWeight: "700", flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.6 }}>{rec}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#94a3b8", margin: 0 }}>No recommendations available yet.</p>
        )}
      </Section>
    </div>
  );
}

export default Report;