import { useState, useEffect, useRef } from "react";
import EmergencyButton from "./Emergency";

const features = [
  { icon: "🤖", title: "AI Chat", desc: "Talk to your personal wellness assistant anytime — it listens and responds with care.", color: "#eff6ff", border: "#bfdbfe" },
  { icon: "📓", title: "Journal", desc: "Write freely and track your thoughts daily. Your entries are private and always yours.", color: "#f0fdf4", border: "#bbf7d0" },
  { icon: "📊", title: "Mood Graph", desc: "Visualize your emotional patterns over time with charts that help you understand yourself.", color: "#faf5ff", border: "#e9d5ff" },
  { icon: "🧘", title: "Meditation", desc: "Guided sessions to calm your mind whenever you need stillness — find it in minutes.", color: "#ecfdf5", border: "#a7f3d0" },
  { icon: "🧪", title: "Assessments", desc: "Mental health and personality tests with personalized results made just for you.", color: "#fef2f2", border: "#fecaca" },
  { icon: "📅", title: "Calendar", desc: "See your mood history day by day — spot patterns and celebrate your good days.", color: "#fff7ed", border: "#fed7aa" },
];

function useVisible() {
  const ref = useRef();
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.12 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return [ref, v];
}

function FadeUp({ children, delay = 0 }) {
  const [ref, v] = useVisible();
  return (
    <div ref={ref} style={{ transition: `opacity .6s ${delay}ms ease, transform .6s ${delay}ms cubic-bezier(.22,1,.36,1)`, opacity: v ? 1 : 0, transform: v ? "none" : "translateY(20px)" }}>
      {children}
    </div>
  );
}

export default function Landing({ onLogin, onRegister }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 80); }, []);

  const a = (d = 0) => ({
    transition: `opacity .7s ${d}ms ease, transform .7s ${d}ms cubic-bezier(.22,1,.36,1)`,
    opacity: vis ? 1 : 0,
    transform: vis ? "none" : "translateY(22px)",
  });

  return (
    <div style={{ background: "#f0f4ff", minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: "#1e293b", overflowX: "hidden" }}>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(240,244,255,0.92)", backdropFilter: "blur(14px)", borderBottom: "1px solid #e0e7ff", padding: "0 clamp(20px,5vw,72px)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontSize: 22 }}>🧠</span>
            <span style={{ fontWeight: 700, fontSize: "1.15rem", letterSpacing: "-0.02em", color: "#1e3a8a" }}>MindMate</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <NavBtn onClick={onLogin}>Sign In</NavBtn>
            <NavBtn filled onClick={onRegister}>Get Started</NavBtn>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(64px,9vh,110px) clamp(20px,5vw,72px) clamp(56px,7vh,88px)" }}>

        <div style={{ ...a(0), display: "inline-flex", alignItems: "center", gap: 8, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 100, padding: "6px 16px", marginBottom: 28 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563eb", display: "inline-block", animation: "blink 2s ease-in-out infinite" }} />
          <span style={{ fontSize: "0.78rem", color: "#1d4ed8", fontWeight: 600, letterSpacing: "0.05em" }}>AI-POWERED MENTAL WELLNESS</span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 48, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 480px" }}>
            <h1 style={{ ...a(100), fontSize: "clamp(2.5rem,6vw,4.5rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.04em", margin: "0 0 20px", color: "#1e293b" }}>
              Your mind deserves<br />
              <span style={{ background: "linear-gradient(90deg, #1e3a8a, #2563eb, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                a safe space.
              </span>
            </h1>
            <p style={{ ...a(200), fontSize: "clamp(.97rem,1.8vw,1.07rem)", color: "#475569", lineHeight: 1.75, margin: "0 0 38px", maxWidth: 500, fontWeight: 400 }}>
              MindMate is your personal AI companion for emotional wellbeing. Chat, journal, track your mood, and understand yourself — all in one private place.
            </p>
            <div style={{ ...a(300), display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <NavBtn filled large onClick={onRegister}>Start for free →</NavBtn>
              <NavBtn large onClick={onLogin}>Sign In</NavBtn>
            </div>
            <p style={{ ...a(400), marginTop: 16, fontSize: "0.78rem", color: "#94a3b8" }}>
              ⚠️ Not a substitute for professional mental health care
            </p>
          </div>

          {/* preview card */}
          <div style={{ ...a(180), flex: "0 1 300px" }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: 22, boxShadow: "0 8px 32px rgba(37,99,235,0.1), 0 1px 4px rgba(0,0,0,0.04)", border: "1px solid #e0e7ff" }}>
              <p style={{ margin: "0 0 14px", fontSize: "0.72rem", fontWeight: 700, color: "#93c5fd", letterSpacing: "0.08em" }}>WHAT'S INSIDE</p>
              {features.map(f => (
                <div key={f.title} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: f.color, border: `1px solid ${f.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{f.icon}</div>
                  <span style={{ fontSize: "0.87rem", fontWeight: 500, color: "#334155" }}>{f.title}</span>
                  <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "#cbd5e1" }}>→</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #60a5fa 100%)", padding: "clamp(60px,8vh,96px) clamp(20px,5vw,72px)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <FadeUp>
            <p style={{ color: "#93c5fd", fontSize: "0.74rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Six tools for you</p>
            <h2 style={{ fontSize: "clamp(1.7rem,3.5vw,2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 48px", color: "#fff", maxWidth: 460, lineHeight: 1.2 }}>
              Everything your mind needs
            </h2>
          </FadeUp>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 14 }}>
            {features.map((f, i) => (
              <FadeUp key={f.title} delay={i * 55}>
                <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 18, padding: "22px 20px", backdropFilter: "blur(8px)", transition: "all .25s", height: "100%" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: f.color, border: `1px solid ${f.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>{f.icon}</div>
                  <h3 style={{ fontWeight: 700, margin: "0 0 7px", fontSize: "0.96rem", color: "#fff" }}>{f.title}</h3>
                  <p style={{ color: "rgba(255,255,255,0.65)", margin: 0, fontSize: "0.84rem", lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "clamp(60px,8vh,96px) clamp(20px,5vw,72px)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <FadeUp>
            <p style={{ color: "#2563eb", fontSize: "0.74rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, textAlign: "center" }}>Simple by design</p>
            <h2 style={{ fontSize: "clamp(1.7rem,3.5vw,2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 48px", textAlign: "center", color: "#1e293b" }}>How it works</h2>
          </FadeUp>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {[
              { n: "1", title: "Create your account", desc: "Sign up free in seconds. No credit card, no catch — just you." },
              { n: "2", title: "Check in daily", desc: "Chat, journal, or log your mood — whatever feels right today." },
              { n: "3", title: "Understand yourself", desc: "Your graphs and insights reveal emotional patterns over time." },
            ].map((s, i) => (
              <FadeUp key={s.n} delay={i * 90}>
                <div style={{ flex: "1 1 240px", background: "#fff", border: "1px solid #e0e7ff", borderRadius: 18, padding: "28px 22px", position: "relative", overflow: "hidden", boxShadow: "0 2px 12px rgba(37,99,235,0.06)" }}>
                  <span style={{ position: "absolute", top: 10, right: 16, fontSize: "4rem", fontWeight: 800, color: "#eff6ff", lineHeight: 1, userSelect: "none" }}>{s.n}</span>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #1e3a8a, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: "0.9rem", marginBottom: 14, position: "relative" }}>{s.n}</div>
                  <h3 style={{ fontWeight: 700, margin: "0 0 7px", fontSize: "0.96rem", color: "#1e293b", position: "relative" }}>{s.title}</h3>
                  <p style={{ color: "#64748b", margin: 0, fontSize: "0.84rem", lineHeight: 1.65, position: "relative" }}>{s.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section style={{ padding: "0 clamp(20px,5vw,72px) clamp(40px,5vh,60px)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderLeft: "4px solid #f97316", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>⚠️</span>
            <p style={{ margin: 0, color: "#7c2d12", fontSize: "0.85rem", lineHeight: 1.65 }}>
              <strong>Important:</strong> MindMate is designed for support and awareness only. It is not a medical or professional mental health service. If you're experiencing serious mental health issues, please consult a licensed professional.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "clamp(60px,8vh,100px) clamp(20px,5vw,72px)", textAlign: "center" }}>
        <FadeUp>
          <div style={{ maxWidth: 500, margin: "0 auto", background: "#fff", border: "1px solid #e0e7ff", borderRadius: 24, padding: "clamp(36px,5vw,56px) clamp(22px,4vw,48px)", boxShadow: "0 8px 40px rgba(37,99,235,0.1)" }}>
            <span style={{ fontSize: 36, display: "block", marginBottom: 16 }}>🌱</span>
            <h2 style={{ fontSize: "clamp(1.6rem,3.5vw,2.2rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 12px", color: "#1e293b", lineHeight: 1.2 }}>Ready to feel better?</h2>
            <p style={{ color: "#64748b", fontSize: "0.93rem", margin: "0 auto 30px", lineHeight: 1.7, maxWidth: 340 }}>It's free, it's private, and it's here whenever you need it.</p>
            <NavBtn filled large onClick={onRegister}>Create Free Account →</NavBtn>
            <p style={{ color: "#cbd5e1", fontSize: "0.75rem", marginTop: 12 }}>No credit card required</p>
          </div>
        </FadeUp>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #e0e7ff", padding: "22px clamp(20px,5vw,72px)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🧠</span>
          <span style={{ fontWeight: 700, fontSize: "0.97rem", color: "#1e3a8a" }}>MindMate</span>
        </div>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.78rem" }}>Your AI-powered mental wellness companion</p>
      </footer>

      {/* EMERGENCY BUTTON — always present */}
      <EmergencyButton />

      <style>{`
        * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        body { margin: 0; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.35} }
      `}</style>
    </div>
  );
}

function NavBtn({ children, onClick, filled, large }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: large ? "13px 32px" : "8px 20px",
        fontSize: large ? "0.97rem" : "0.87rem",
        fontWeight: 600, fontFamily: "'Inter', sans-serif",
        borderRadius: 10, cursor: "pointer", transition: "all .2s", lineHeight: 1,
        border: filled ? "none" : "1.5px solid #bfdbfe",
        background: filled ? (h ? "#1d4ed8" : "#2563eb") : (h ? "#eff6ff" : "transparent"),
        color: filled ? "#fff" : "#2563eb",
        boxShadow: filled ? (h ? "0 6px 20px rgba(37,99,235,0.4)" : "0 4px 12px rgba(37,99,235,0.25)") : "none",
        transform: filled && h ? "translateY(-1px)" : "none",
      }}>
      {children}
    </button>
  );
}