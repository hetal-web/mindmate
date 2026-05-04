import { useCallback, useEffect, useState } from "react";
import config from "../config";
import useUser from "../hooks/useUser";

function AdminDashboard() {
  const user = useUser();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);   // id currently being deleted
  const [confirmId, setConfirmId] = useState(null);     // id awaiting confirmation

  const fetchStats = useCallback(() => {
    if (!user?.id) return;
    fetch(`${config.API_URL}/admin/stats?role=${user.role}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setStats(data);
      })
      .catch(() => setError("Failed to load admin stats."));
  }, [user]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleDelete = async (userId) => {
    setDeletingId(userId);
    setConfirmId(null);
    try {
      const res = await fetch(`${config.API_URL}/admin/delete-user/${userId}?role=${user.role}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        // Remove from local state immediately — no full refetch needed
        setStats(prev => ({
          ...prev,
          total_users: prev.total_users - 1,
          recent_users: prev.recent_users.filter(u => u.id !== userId),
        }));
      }
    } catch {
      setError("Failed to delete user. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (error) return (
    <div style={{ padding: "20px" }}>
      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "16px 20px", color: "#dc2626" }}>
        ⚠️ {error}
      </div>
    </div>
  );

  if (!stats) return (
    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
      <div style={{ fontSize: "36px", marginBottom: "12px" }}>⚙️</div>
      <p>Loading admin dashboard...</p>
    </div>
  );

  const statCards = [
    { label: "Total users",     value: stats.total_users,     icon: "👤", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
    { label: "Total chats",     value: stats.total_chats,     icon: "💬", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
    { label: "Total journals",  value: stats.total_journals,  icon: "📓", color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
    { label: "Meditation mins", value: stats.total_meditation, icon: "🧘", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  ];

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "8px 0 40px" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #60a5fa 100%)",
        borderRadius: "20px", padding: "28px 32px", marginBottom: "24px", color: "white",
      }}>
        <h1 style={{ margin: "0 0 4px", fontSize: "1.5rem", fontWeight: "700" }}>⚙️ Admin Dashboard</h1>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: "0.9rem" }}>
          Logged in as {user.name} · role: admin
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px", marginBottom: "28px" }}>
        {statCards.map(card => (
          <div key={card.label} style={{
            background: card.bg, border: `1.5px solid ${card.border}`,
            borderRadius: "16px", padding: "20px",
          }}>
            <div style={{ fontSize: "24px", marginBottom: "10px" }}>{card.icon}</div>
            <p style={{ margin: "0 0 4px", fontSize: "0.75rem", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {card.label}
            </p>
            <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: "700", color: card.color }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent users table */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: "700", color: "#1e293b" }}>
          Recent users
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
              <th style={{ textAlign: "left", padding: "8px 12px", color: "#64748b", fontWeight: "600", fontSize: "0.78rem", textTransform: "uppercase" }}>ID</th>
              <th style={{ textAlign: "left", padding: "8px 12px", color: "#64748b", fontWeight: "600", fontSize: "0.78rem", textTransform: "uppercase" }}>Name</th>
              <th style={{ textAlign: "left", padding: "8px 12px", color: "#64748b", fontWeight: "600", fontSize: "0.78rem", textTransform: "uppercase" }}>Email</th>
              <th style={{ textAlign: "right", padding: "8px 12px", color: "#64748b", fontWeight: "600", fontSize: "0.78rem", textTransform: "uppercase" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stats.recent_users.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "10px 12px", color: "#94a3b8" }}>#{u.id}</td>
                <td style={{ padding: "10px 12px", color: "#1e293b", fontWeight: "500" }}>{u.name}</td>
                <td style={{ padding: "10px 12px", color: "#64748b" }}>{u.email}</td>
                <td style={{ padding: "10px 12px", textAlign: "right" }}>
                  {confirmId === u.id ? (
                    /* ── Confirmation prompt ── */
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "0.82rem", color: "#dc2626", fontWeight: "600" }}>Sure?</span>
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deletingId === u.id}
                        style={{
                          padding: "4px 12px", borderRadius: "8px", border: "none",
                          background: "#dc2626", color: "#fff", fontWeight: "600",
                          fontSize: "0.8rem", cursor: "pointer",
                        }}
                      >
                        {deletingId === u.id ? "Deleting…" : "Yes, delete"}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        style={{
                          padding: "4px 10px", borderRadius: "8px",
                          border: "1px solid #e2e8f0", background: "#fff",
                          color: "#64748b", fontWeight: "600", fontSize: "0.8rem", cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    /* ── Delete button ── */
                    <button
                      onClick={() => setConfirmId(u.id)}
                      style={{
                        padding: "5px 14px", borderRadius: "8px",
                        border: "1px solid #fecaca", background: "#fef2f2",
                        color: "#dc2626", fontWeight: "600", fontSize: "0.82rem",
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { e.target.style.background = "#dc2626"; e.target.style.color = "#fff"; }}
                      onMouseLeave={e => { e.target.style.background = "#fef2f2"; e.target.style.color = "#dc2626"; }}
                    >
                      🗑 Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {stats.recent_users.length === 0 && (
          <p style={{ color: "#94a3b8", textAlign: "center", margin: "20px 0" }}>No users yet.</p>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;