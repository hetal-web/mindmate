import React, { useState, useEffect } from "react";
import "./journal.css";
import API_URL from "../config";
import useUser from "../hooks/useUser";

const emotionConfig = {
  happy:    { color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0", emoji: "😊" },
  happiness:{ color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0", emoji: "😊" },
  sad:      { color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", emoji: "😢" },
  sadness:  { color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", emoji: "😢" },
  angry:    { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", emoji: "😤" },
  anxiety:  { color: "#8b5cf6", bg: "#faf5ff", border: "#e9d5ff", emoji: "😰" },
  anxious:  { color: "#8b5cf6", bg: "#faf5ff", border: "#e9d5ff", emoji: "😰" },
  stressed: { color: "#f97316", bg: "#fff7ed", border: "#fed7aa", emoji: "😓" },
  neutral:  { color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", emoji: "😐" },
  love:     { color: "#ec4899", bg: "#fdf2f8", border: "#fbcfe8", emoji: "💗" },
  tired:    { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", emoji: "😴" },
};

const getEmotion = (emotion) => emotionConfig[emotion?.toLowerCase()] || emotionConfig.neutral;

function Journal() {
  const user = useUser();
  const [text, setText] = useState("");
  const [entries, setEntries] = useState([]);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [charCount, setCharCount] = useState(0);

  const loadJournals = async () => {
    const userId = user.id;
    if (!userId) return;
    try {
      const res = await fetch(`${API_URL}/journal/list/${userId}`);
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Journal load error:", err);
      setEntries([]);
    }
  };

  useEffect(() => { loadJournals(); }, [user.id]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    setCharCount(e.target.value.length);
  };

  const saveEntry = async () => {
    const userId = user.id || 1;
    if (!text.trim()) return;
    setSaveError("");
    setSaveSuccess("");
    try {
      await fetch(`${API_URL}/journal/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, content: text }),
      });
      setText("");
      setCharCount(0);
      setSaveSuccess("Entry saved! ✨");
      setTimeout(() => setSaveSuccess(""), 3000);
      loadJournals();
    } catch (err) {
      console.error("Save error:", err);
      setSaveError("Failed to save. Please try again.");
    }
  };

  const deleteJournal = async (id) => {
    try {
      await fetch(`${API_URL}/journal/delete/${id}`, { method: "DELETE" });
      loadJournals();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.ctrlKey) saveEntry();
  };

  return (
    <div className="journal-container">

      {/* Header */}
      <div className="journal-header">
        <h1 className="journal-heading">📓 Journal</h1>
        <p className="journal-subheading">Write freely — no judgment, just you.</p>
        <div className="journal-stats">
          <span>{entries.length} {entries.length === 1 ? "entry" : "entries"}</span>
        </div>
      </div>

      {/* Write section */}
      <div className="journal-write">
        <div className="write-top">
          <h2 className="journal-title">What's on your mind today?</h2>
          <span className="char-count">{charCount} chars</span>
        </div>

        <textarea
          className="journal-textarea"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Write freely... no judgment here 🌿&#10;&#10;Tip: Ctrl+Enter to save quickly"
        />

        <div className="write-actions">
          <button
            className="journal-btn"
            onClick={saveEntry}
            disabled={!text.trim()}
            style={{ opacity: text.trim() ? 1 : 0.5, cursor: text.trim() ? "pointer" : "not-allowed" }}
          >
            Save Entry
          </button>
          {text && (
            <button className="clear-btn" onClick={() => { setText(""); setCharCount(0); }}>
              Clear
            </button>
          )}
        </div>

        {saveSuccess && (
          <div className="save-banner success">{saveSuccess}</div>
        )}
        {saveError && (
          <div className="save-banner error">{saveError}</div>
        )}
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌱</div>
          <p>Your journal is empty. Write your first entry above!</p>
        </div>
      ) : (
        <div className="journal-list">
          <h3 className="entries-heading">Your Entries</h3>
          {entries.map((entry, index) => {
            const em = getEmotion(entry.emotion);
            return (
              <div
                key={index}
                className="entry-card"
                style={{ background: em.bg, borderLeft: `4px solid ${em.color}`, borderTop: `1px solid ${em.border}`, borderRight: `1px solid ${em.border}`, borderBottom: `1px solid ${em.border}` }}
              >
                <div className="entry-header">
                  <div className="entry-emotion">
                    <span className="emotion-emoji">{em.emoji}</span>
                    <span className="emotion-label" style={{ color: em.color }}>
                      {entry.emotion || "neutral"}
                    </span>
                  </div>
                  <div className="entry-date">
                    {new Date(entry.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>

                <p className="entry-content">{entry.content}</p>

                <button
                  className="delete-btn"
                  onClick={() => deleteJournal(entry.id)}
                >
                  🗑 Delete
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Journal;