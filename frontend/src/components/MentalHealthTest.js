import { useState, useEffect } from "react";
import "./Test.css";
import config from "../config";
import useUser from "../hooks/useUser";

const options = [
  { text: "Never", score: 0, emoji: "🙂" },
  { text: "Sometimes", score: 1, emoji: "😐" },
  { text: "Often", score: 2, emoji: "😟" },
  { text: "Always", score: 3, emoji: "😔" },
];

function getResultInfo(score, total) {
  const pct = score / total;
  if (pct < 0.33) return { emoji: "😊", label: "You're doing well!", pill: "", pillClass: "score-pill" };
  if (pct < 0.66) return { emoji: "😐", label: "Mild stress detected. Take time for self-care.", pill: "", pillClass: "score-pill warn" };
  return { emoji: "😟", label: "High stress levels detected. Please take care of yourself.", pill: "", pillClass: "score-pill danger" };
}

function MentalHealthTest() {
  const user = useUser();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${config.API_URL}/mental/questions`)
      .then(res => res.json())
      .then(data => { setQuestions(data); setLoading(false); })
      .catch(err => { console.error("Error fetching questions:", err); setLoading(false); });
  }, []);

  const handleAnswer = (value) => {
    const newScore = score + value;
    setScore(newScore);
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      setFinished(true);
      submitResults(newScore);
    }
  };

  const submitResults = async (finalScore) => {
    try {
      await fetch(`${config.API_URL}/mental/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id || 1, answers: { score: finalScore } }),
      });
    } catch (err) {
      console.error("Error saving test results:", err);
    }
  };

  if (loading) return (
    <div className="test-page">
      <div className="test-loading">
        <div className="test-loading-spinner">🧪</div>
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
  const result = getResultInfo(score, questions.length * 3);

  return (
    <div className="test-page">

      {/* Header */}
      <div className="test-header-card">
        <div className="test-header-icon">🧪</div>
        <h1>Mental Health Assessment</h1>
        <p>Understand your current mental wellness in just a few minutes</p>
      </div>

      {!finished ? (
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

          <div className="freq-grid">
            {options.map((opt, i) => (
              <button key={i} className="freq-btn" onClick={() => handleAnswer(opt.score)}>
                {opt.emoji} {opt.text}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="result-card">
          <div className="result-emoji">{result.emoji}</div>
          <h2>Your Result</h2>
          <p className="result-label">{result.label}</p>
          <div className={result.pillClass}>
            Score: {score} / {questions.length * 3}
          </div>
          <p style={{ marginTop: "20px", fontSize: "0.85rem", color: "#94a3b8" }}>
            This result has been saved to your wellness report.
          </p>
        </div>
      )}
    </div>
  );
}

export default MentalHealthTest;