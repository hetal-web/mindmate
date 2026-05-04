import React, { useState, useEffect } from "react";
import PersonalityTest from "./components/PersonalityTest";
import MentalHealthTest from "./components/MentalHealthTest";
import MoodGraph from "./components/MoodGraph";
import Journal from "./components/journal";
import Dashboard from "./components/Dashboard";
import Chat from "./components/ChatComponent";
import Report from "./components/report";
import Login from "./components/Login";
import Register from "./components/Register";
import Landing from "./components/LandingPage";
import Layout from "./components/layout";
import Calendar from "./components/Calendar";
import Meditation from "./components/Meditation";
import EmergencyButton from "./components/Emergency";
import AdminDashboard from "./components/Admindashboard";

function App() {
  const [page, setPage] = useState("dashboard");
  const [authView, setAuthView] = useState("landing"); // "landing" | "login" | "register"
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  });

  useEffect(() => {
    if (!user) setAuthView("landing");
    else if (user.role === "admin") setPage("admin");
  }, [user]);

  // Not logged in — Landing / Login / Register each include <EmergencyButton /> internally
  if (!user) {
    if (authView === "landing")  return <Landing  onLogin={() => setAuthView("login")} onRegister={() => setAuthView("register")} />;
    if (authView === "login")    return <Login    onLoggedIn={(u) => { setUser(u); setPage(u.role === "admin" ? "admin" : "dashboard"); }} onShowRegister={() => setAuthView("register")} />;
    if (authView === "register") return <Register onRegistered={() => setAuthView("login")} onShowLogin={() => setAuthView("login")} />;
  }

  // Admin
  if (user?.role === "admin") {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f4ff" }}>
        <div style={{ background: "linear-gradient(90deg, #1e3a8a, #2563eb)", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "white", fontWeight: "700", fontSize: "1.1rem" }}>🧠 MindMate Admin</span>
          <button onClick={() => { localStorage.removeItem("user"); setUser(null); setAuthView("landing"); }}
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", padding: "6px 16px", color: "white", cursor: "pointer", fontSize: "0.85rem" }}>
            Logout
          </button>
        </div>
        <div style={{ padding: "24px" }}><AdminDashboard /></div>
        <EmergencyButton />
      </div>
    );
  }

  // Regular user
  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff" }}>
      <Layout setPage={setPage} currentPage={page} setUser={(u) => { setUser(u); if (!u) setAuthView("landing"); }}>
        {page === "dashboard"   && <Dashboard setPage={setPage} />}
        {page === "chat"        && <Chat />}
        {page === "personality" && <PersonalityTest />}
        {page === "mental"      && <MentalHealthTest />}
        {page === "meditation"  && <Meditation />}
        {page === "journal"     && <Journal />}
        {page === "graph"       && <MoodGraph />}
        {page === "calendar"    && <Calendar />}
        {page === "Report"      && <Report />}
      </Layout>
      <EmergencyButton />
    </div>
  );
}

export default App;