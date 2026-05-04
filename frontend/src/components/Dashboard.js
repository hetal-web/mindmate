import "./Dashboard.css";
import useUser from "../hooks/useUser";

const features = [
  { icon: "🤖", title: "AI Chat", desc: "Talk to your personal wellness assistant anytime", page: "chat", color: "#eff6ff", border: "#bfdbfe" },
  { icon: "📓", title: "Journal", desc: "Write freely and track your thoughts daily", page: "journal", color: "#f0fdf4", border: "#bbf7d0" },
  { icon: "📊", title: "Mood Graph", desc: "Visualize your emotional patterns over time", page: "graph", color: "#faf5ff", border: "#e9d5ff" },
  { icon: "📅", title: "Calendar", desc: "See your mood history day by day", page: "calendar", color: "#fff7ed", border: "#fed7aa" },
  { icon: "🧘", title: "Meditation", desc: "Guided sessions to calm your mind", page: "meditation", color: "#ecfdf5", border: "#a7f3d0" },
  { icon: "🧪", title: "Assessments", desc: "Mental health & personality tests", page: "mental", color: "#fef2f2", border: "#fecaca" },
];

function Dashboard({ setPage }) {
  const user = useUser();

  return (
    <div className="dashboard">

      {/* Hero */}
      <div className="hero-card">
        <div className="hero-left">
          <p className="hero-greeting">Good day, {user?.name || "there"} 👋</p>
          <h1 className="hero-title">Welcome to MindMate</h1>
          <p className="hero-sub">Your personal AI-powered mental wellness companion. How are you feeling today?</p>
          <div className="hero-actions">
            {setPage && (
              <>
                <button className="btn-primary" onClick={() => setPage("chat")}>💬 Start Chatting</button>
                <button className="btn-secondary" onClick={() => setPage("journal")}>📓 Write in Journal</button>
              </>
            )}
          </div>
        </div>
        <div className="hero-emoji">🧠</div>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer-card">
        <span className="disclaimer-icon">⚠️</span>
        <p><strong>Important:</strong> MindMate is not a medical or professional mental health service. It is designed for support and awareness only. If you are experiencing serious mental health issues, please consult a licensed professional.</p>
      </div>

      {/* Features Grid */}
      <h2 className="section-title">Explore Features</h2>
      <div className="features-grid">
        {features.map((f) => (
          <div
            key={f.page}
            className="feature-card"
            style={{ background: f.color, borderColor: f.border }}
            onClick={() => setPage && setPage(f.page)}
          >
            <div className="feature-icon">{f.icon}</div>
            <div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* What MindMate Does */}
      <div className="info-card">
        <h2>🌱 What MindMate Does</h2>
        <div className="info-grid">
          {[
            { icon: "🎯", text: "Tracks your daily mood" },
            { icon: "🤖", text: "Analyzes emotions using AI" },
            { icon: "💡", text: "Provides insights & suggestions" },
            { icon: "✅", text: "Helps you build healthy habits" },
          ].map((item) => (
            <div key={item.text} className="info-item">
              <span className="info-icon">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default Dashboard;