import React, { useState, useEffect } from "react";
import "./Test.css";
import API_URL from "../config";
import useUser from "../hooks/useUser";

const mbtiColors = {
  I: "#eff6ff", E: "#f0fdf4",
  N: "#faf5ff", S: "#fff7ed",
  T: "#f0f9ff", F: "#fdf2f8",
  J: "#ecfdf5", P: "#fefce8",
};

function PersonalityTest() {
  const user = useUser();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/personality/questions`)
      .then(res => res.json())
      .then(data => { setQuestions(data); setLoading(false); })
      .catch(err => { console.error("Error fetching questions:", err); setLoading(false); });
  }, []);

  const selectAnswer = (answer) => {
    const newAnswers = { ...answers, [questions[current].id]: answer };
    setAnswers(newAnswers);
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      submitTest(newAnswers);
    }
  };

  const submitTest = (finalAnswers) => {
    fetch(`${API_URL}/personality/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id || 1, answers: finalAnswers }),
    })
      .then(res => res.json())
      .then(data => setResult(data))
      .catch(err => console.error("Submit error:", err));
  };

  if (loading) return (
    <div className="test-page">
      <div className="test-loading">
        <div className="test-loading-spinner">🧠</div>
        <p>Loading questions...</p>
      </div>
    </div>
  );

  if (questions.length === 0) return (
    <div className="test-page">
      <div className="test-loading">
        <div className="test-loading-spinner">❌</div>
        <p>No questions available. Please try again later.</p>
      </div>
    </div>
  );

  const progress = Math.round(((current + 1) / questions.length) * 100);

  return (
    <div className="test-page">

      {/* Header */}
      <div className="test-header-card">
        <div className="test-header-icon">🧠</div>
        <h1>Personality Assessment</h1>
        <p>Discover your unique MBTI personality type</p>
      </div>

      {!result ? (
        <div className="question-card">
          {/* Progress */}
          <div className="progress-wrapper">
            <div className="progress-meta">
              <span>Question {current + 1} of {questions.length}</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <p className="question-number">Question {current + 1}</p>
          <p className="question-text">{questions[current].question}</p>

          <div className="options-grid">
            <button className="option-btn" onClick={() => selectAnswer("A")}>
              <span className="option-letter">A</span>
              {questions[current].option_a}
            </button>
            <button className="option-btn" onClick={() => selectAnswer("B")}>
              <span className="option-letter">B</span>
              {questions[current].option_b}
            </button>
          </div>
        </div>
      ) : (
        <div className="result-card">
          <div className="result-emoji">✨</div>
          <h2>Your Personality Type</h2>
          <div className="personality-type-badge">{result.personality}</div>
          <p className="personality-description">{result.description}</p>

          {/* Letter breakdown */}
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px", flexWrap: "wrap" }}>
            {result.personality && result.personality.split("").map((letter, i) => (
              <div key={i} style={{
                width: "48px", height: "48px",
                borderRadius: "12px",
                background: mbtiColors[letter] || "#f1f5f9",
                border: "2px solid #e2e8f0",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.2rem", fontWeight: "800", color: "#1e40af",
              }}>
                {letter}
              </div>
            ))}
          </div>

          <p style={{ marginTop: "20px", fontSize: "0.85rem", color: "#94a3b8" }}>
            This result has been saved to your wellness report.
          </p>
        </div>
      )}
    </div>
  );
}

export default PersonalityTest;