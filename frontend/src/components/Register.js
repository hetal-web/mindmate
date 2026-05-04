import React, { useState, useEffect } from "react";
import API_URL from "../config";
import EmergencyButton from "./Emergency";

function Register({ onRegistered, onShowLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const strength = password.length === 0 ? null : password.length < 6 ? "weak" : password.length < 10 ? "fair" : "strong";
  const sm = {
    weak:   { color: "#ef4444", w: "33%",  label: "Too short" },
    fair:   { color: "#f59e0b", w: "66%",  label: "Could be stronger" },
    strong: { color: "#22c55e", w: "100%", label: "Strong password ✓" },
  };

  const features = [
    { icon: "🤖", label: "AI Chat" }, { icon: "📓", label: "Private Journal" },
    { icon: "📊", label: "Mood Graph" }, { icon: "🧘", label: "Meditation" },
    { icon: "🧪", label: "Assessments" }, { icon: "📅", label: "Mood Calendar" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      setSuccess("Account created! You can now sign in.");
      if (onRegistered) onRegistered();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter', sans-serif", background: "#f0f4ff" }}>

      {/* Left panel */}
      <div className="auth-left" style={{
        flex: 1,
        background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 70%, #60a5fa 100%)",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "48px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", width: 360, height: 360, borderRadius: "50%", background: "rgba(255,255,255,0.06)", top: -100, left: -100 }} />
        <div style={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.04)", bottom: 20, right: -60 }} />

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ fontSize: 22 }}>🧠</span>
          <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "#fff", letterSpacing: "-0.02em" }}>MindMate</span>
        </div>

        <div style={{ position: "relative" }}>
          <h2 style={{ fontSize: "2.3rem", fontWeight: 800, color: "#fff", margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
            Everything<br />free for you ✨
          </h2>
          <p style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.7, margin: "0 0 28px", fontSize: "0.92rem" }}>
            One account unlocks all six wellness tools — no subscriptions, no limits.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {features.map(f => (
              <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 12px" }}>
                <span style={{ fontSize: 16 }}>{f.icon}</span>
                <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.82rem", fontWeight: 500 }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ position: "relative", color: "rgba(255,255,255,0.4)", fontSize: "0.74rem", margin: 0, lineHeight: 1.6 }}>
          ⚠️ Not a substitute for professional mental health care
        </p>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        padding: "48px clamp(24px,5vw,80px)",
        transition: "opacity .65s, transform .65s cubic-bezier(.22,1,.36,1)",
        opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(18px)",
        background: "#f0f4ff",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: "1.9rem", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.03em", color: "#1e293b" }}>Create account</h1>
            <p style={{ color: "#94a3b8", margin: 0, fontSize: "0.88rem" }}>Start your wellness journey today</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Full Name" type="text" value={name} onChange={setName} placeholder="Your name" />
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />

            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <FieldInput type={showPassword ? "text" : "password"} value={password} onChange={setPassword} placeholder="Min. 6 characters" padRight />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 15, padding: 0 }}>
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {strength && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 3, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: sm[strength].w, background: sm[strength].color, borderRadius: 4, transition: "width .3s, background .3s" }} />
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: sm[strength].color, fontWeight: 500 }}>{sm[strength].label}</p>
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "11px 14px", color: "#dc2626", fontSize: "0.84rem", display: "flex", gap: 8, alignItems: "center" }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "11px 14px", color: "#16a34a", fontSize: "0.84rem", display: "flex", gap: 8, alignItems: "center" }}>
                ✅ {success}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              padding: "13px", border: "none", borderRadius: 10, marginTop: 2,
              background: loading ? "#93c5fd" : "linear-gradient(135deg, #1e40af, #2563eb)",
              color: "white", fontSize: "0.96rem", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 14px rgba(37,99,235,0.35)",
              transition: "all .2s", fontFamily: "'Inter', sans-serif",
            }}>
              {loading ? "Creating account…" : "Create Account →"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, color: "#94a3b8", fontSize: "0.87rem" }}>
            Already have an account?{" "}
            <span onClick={() => onShowLogin && onShowLogin()} style={{ color: "#2563eb", cursor: "pointer", fontWeight: 600 }}>
              Sign in →
            </span>
          </p>
        </div>
      </div>

      <EmergencyButton />

      <style>{`
        @media (max-width: 640px) { .auth-left { display: none !important; } }
        * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        input::placeholder { color: #cbd5e1; }
      `}</style>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: 7 };

function FieldInput({ type, value, onChange, placeholder, padRight }) {
  const [focused, setFocused] = useState(false);
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        width: "100%", padding: "12px 14px", paddingRight: padRight ? 42 : 14,
        background: "#fff", border: `1.5px solid ${focused ? "#2563eb" : "#e2e8f0"}`,
        borderRadius: 10, color: "#1e293b", fontSize: "0.93rem", outline: "none",
        transition: "border-color .2s, box-shadow .2s",
        boxShadow: focused ? "0 0 0 3px rgba(37,99,235,0.1)" : "none",
        fontFamily: "'Inter', sans-serif",
      }}
    />
  );
}

function Field({ label, type, value, onChange, placeholder }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <FieldInput type={type} value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}

export default Register;