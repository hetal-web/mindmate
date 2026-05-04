import React, { useState } from "react";

const navLinks = [
  { page: "dashboard",   label: "🏠 Dashboard" },
  { page: "chat",        label: "🤖 Chat" },
  { page: "personality", label: "🧠 Personality Test" },
  { page: "mental",      label: "🧪 Mental Health Test" },
  { page: "meditation",  label: "🧘 Meditation" },
  { page: "journal",     label: "📓 Journal" },
  { page: "graph",       label: "📊 Mood Graph" },
  { page: "calendar",    label: "📅 Calendar" },
  { page: "Report",      label: "📄 Report" },
];

function NavItem({ page, label, currentPage, setPage, onNavigate }) {
  const isActive = page === currentPage;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => { setPage(page); onNavigate && onNavigate(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer",
        marginTop: "4px",
        padding: "10px 14px",
        borderRadius: "10px",
        background: isActive
          ? "rgba(255,255,255,0.18)"
          : hovered ? "rgba(255,255,255,0.1)" : "transparent",
        color: "white",
        fontWeight: isActive ? "600" : "400",
        fontSize: "0.9rem",
        transition: "all 0.2s ease",
        borderLeft: isActive ? "3px solid rgba(255,255,255,0.8)" : "3px solid transparent",
        userSelect: "none",
      }}
    >
      {label}
    </div>
  );
}

function Layout({ children, setPage, currentPage, setUser }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setPage("login");
  };

  const sidebarContent = (
    <>
      <div style={{ marginBottom: "28px", paddingLeft: "6px" }}>
        <h2 style={{ color: "#ffffff", fontSize: "1.4rem", fontWeight: "700", margin: 0 }}>
          🧠 MindMate
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", margin: "4px 0 0" }}>
          Your wellness companion
        </p>
      </div>
      <div style={{ height: "1px", background: "rgba(255,255,255,0.15)", marginBottom: "12px" }} />
      <div style={{ flex: 1 }}>
        {navLinks.map(({ page, label }) => (
          <NavItem
            key={page}
            page={page}
            label={label}
            currentPage={currentPage}
            setPage={setPage}
            onNavigate={() => setMenuOpen(false)}
          />
        ))}
      </div>
      <div>
        <div style={{ height: "1px", background: "rgba(255,255,255,0.15)", margin: "16px 0" }} />
        <button
          onClick={handleLogout}
          style={{
            width: "100%", padding: "10px", background: "rgba(255,255,255,0.12)",
            color: "white", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "10px",
            cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", transition: "all 0.2s",
          }}
          onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.22)"}
          onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.12)"}
        >
          🚪 Logout
        </button>
      </div>
    </>
  );

  const sidebarStyle = {
    background: "linear-gradient(180deg, #1e3a8a 0%, #1e40af 60%, #2563eb 100%)",
    color: "#ffffff",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f0f4ff" }}>

      {/* ── Mobile top bar ── */}
      <div style={{
        display: "none",
        background: "linear-gradient(90deg, #1e3a8a, #2563eb)",
        padding: "12px 16px",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }} className="mobile-topbar">
        <span style={{ color: "white", fontWeight: "700", fontSize: "1.1rem" }}>🧠 MindMate</span>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "8px", padding: "6px 12px", color: "white",
            cursor: "pointer", fontSize: "1.1rem",
          }}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* ── Mobile slide-down menu ── */}
      {menuOpen && (
        <div style={{
          ...sidebarStyle,
          padding: "16px",
          position: "sticky", top: "48px", zIndex: 99,
        }} className="mobile-menu">
          {sidebarContent}
        </div>
      )}

      {/* ── Desktop layout ── */}
      <div style={{ display: "flex", flex: 1, borderRadius: "20px", overflow: "hidden", boxShadow: "0 16px 40px rgba(15,23,42,0.12)", margin: "16px" }} className="desktop-layout">

        {/* Sidebar */}
        <div style={{ ...sidebarStyle, width: "240px", minWidth: "240px", justifyContent: "space-between" }} className="desktop-sidebar">
          {sidebarContent}
        </div>

        {/* Main */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px", background: "#ffffff" }} className="main-content">
          {children}
        </div>
      </div>

      {/* ── Mobile main content ── */}
      <div style={{ display: "none", flex: 1, padding: "16px", background: "#ffffff" }} className="mobile-content">
        {children}
      </div>

      {/* Footer */}
      <footer style={{
        background: "#ffffff", color: "#6b7280", padding: "16px 20px",
        textAlign: "center", borderTop: "1px solid #e5e7eb",
      }}>
        <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: "500" }}>
          ✨ MindMate • Your mental wellness companion ✨
        </p>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .mobile-topbar { display: flex !important; }
          .desktop-layout { display: none !important; }
          .mobile-content { display: block !important; }
        }
        @media (min-width: 769px) {
          .mobile-topbar { display: none !important; }
          .mobile-menu { display: none !important; }
          .desktop-layout { display: flex !important; }
          .mobile-content { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default Layout;