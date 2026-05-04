import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Chat.css";
import API_URL from "../config";
import useUser from "../hooks/useUser";

// ── helpers ────────────────────────────────────────────────────────────────

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
}

function getDayLabel(ts) {
  const msgDate = new Date(ts);
  const today   = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate();

  if (sameDay(msgDate, today))     return "Today";
  if (sameDay(msgDate, yesterday)) return "Yesterday";

  return msgDate.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
}

// Convert a SQLite timestamp string ("2024-05-01 14:32:00") or
// an existing numeric ts to a stable ms epoch number.
// Falls back to a fixed offset so history messages never flicker.
function assignHistoryTimestamps(messages) {
  const fallbackBase = Date.now();
  return messages.map((msg, i) => {
    if (msg.ts) return msg; // already a number (sent this session)
    if (msg.timestamp) {
      // SQLite stores in UTC as "YYYY-MM-DD HH:MM:SS" — append Z so JS treats it as UTC,
      // then it converts to local IST (UTC+5:30) automatically when displaying.
      const parsed = new Date(msg.timestamp.replace(" ", "T") + "Z").getTime();
      return { ...msg, ts: isNaN(parsed) ? fallbackBase - (messages.length - i) * 60_000 : parsed };
    }
    // No timestamp at all — space them 1 min apart ending at now
    return { ...msg, ts: fallbackBase - (messages.length - i) * 60_000 };
  });
}

// ── component ──────────────────────────────────────────────────────────────

function Chat() {
  const user   = useUser();
  const userId = user.id || 1;

  const bottomRef = useRef(null);
  const [input, setInput]         = useState("");
  const [chat,  setChat]          = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const recognitionRef = useRef(null);

  const voiceEnabledRef = useRef(voiceEnabled);
  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
    if (!voiceEnabled) {
      window.speechSynthesis.cancel();
      if (hindiAudioRef.current) {
        hindiAudioRef.current.pause();
        hindiAudioRef.current = null;
      }
    }
  }, [voiceEnabled]);

  const detectLang = (text) => (/[\u0900-\u097F]/.test(text) ? "hi" : "en");
  const lastLangRef = useRef("en");
  const cleanText   = (text) => text.replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, "");
  const hindiAudioRef = useRef(null);

  const speak = useCallback(async (text) => {
    if (!voiceEnabledRef.current) return;

    window.speechSynthesis.cancel();
    if (hindiAudioRef.current) {
      hindiAudioRef.current.pause();
      URL.revokeObjectURL(hindiAudioRef.current.src);
      hindiAudioRef.current = null;
    }

    const cleaned = cleanText(text);
    const isHindi = /[\u0900-\u097F]/.test(cleaned);

    if (isHindi) {
      const chunks = [];
      let remaining = cleaned;
      while (remaining.length > 0) {
        let cutAt = 200;
        if (remaining.length > 200) {
          const boundary = remaining.lastIndexOf("।", 199);
          cutAt = boundary > 50 ? boundary + 1 : 200;
        }
        chunks.push(remaining.slice(0, cutAt).trim());
        remaining = remaining.slice(cutAt).trim();
      }

      const playChunk = async (index) => {
        if (index >= chunks.length || !voiceEnabledRef.current) return;
        try {
          const res = await fetch(`${API_URL}/tts/hindi`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: chunks[index] }),
          });
          if (!res.ok) throw new Error(`TTS proxy error: ${res.status}`);
          const blob  = await res.blob();
          const url   = URL.createObjectURL(blob);
          const audio = new Audio(url);
          hindiAudioRef.current = audio;
          audio.onended = () => { URL.revokeObjectURL(url); playChunk(index + 1); };
          audio.onerror = (e) => console.error("Audio play error:", e);
          await audio.play();
        } catch (err) {
          console.error("Hindi TTS chunk error:", err);
        }
      };

      playChunk(0);
    } else {
      const utterance = new SpeechSynthesisUtterance(cleaned);
      const voices    = window.speechSynthesis.getVoices();
      const selectedVoice =
        voices.find((v) => v.lang === "en-US" && v.name.includes("Google")) ||
        voices.find((v) => v.lang === "en-US" && v.name.toLowerCase().includes("female")) ||
        voices.find((v) => v.lang === "en-US") ||
        voices.find((v) => v.name.includes("Google") && v.lang.startsWith("en")) ||
        voices.find((v) => v.lang.startsWith("en"));
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.rate  = 0.95;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const inputRef = useRef(input);
  useEffect(() => { inputRef.current = input; }, [input]);

  const sendMessage = useCallback(async (overrideText) => {
    const textToSend = typeof overrideText === "string" ? overrideText : inputRef.current;
    if (!textToSend.trim()) return;

    const lang = detectLang(textToSend);
    lastLangRef.current = lang;
    if (recognitionRef.current) recognitionRef.current.lang = lang === "hi" ? "hi-IN" : "en-US";

    const userMsg = { sender: "user", text: textToSend, ts: Date.now() };
    setInput("");
    setChat((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, message: textToSend, detected_lang: lang }),
      });

      const data   = await res.json();
      const botMsg = { sender: "bot", text: data.reply, crisis: data.crisis === true, ts: Date.now() };

      setChat((prev) => [...prev, botMsg]);
      speak(data.reply);

      if (data.crisis === true) {
        localStorage.setItem("crisisActive", "true");
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChat((prev) => [...prev, { sender: "bot", text: "Sorry, something went wrong. Please try again.", ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  }, [speak, userId]);

  useEffect(() => {
    fetch(`${API_URL}/chat/history/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const msgs = assignHistoryTimestamps(data.messages || []);
        setChat(msgs);
      })
      .catch((err) => console.error("History load error:", err));
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const sendMessageRef = useRef(sendMessage);
  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition       = new SpeechRecognition();
    recognition.lang        = "en-US";
    recognition.continuous  = false;
    recognition.interimResults = false;
    recognitionRef.current  = recognition;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setInput(text);
      setListening(false);
      sendMessageRef.current(text);
    };
    recognition.onerror = (event) => { console.error("Speech error:", event.error); setListening(false); };
    recognition.onend   = () => setListening(false);
  }, []);

  useEffect(() => {
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const startNewChat = async () => {
    try {
      await fetch(`${API_URL}/chat/reset/${userId}`, { method: "POST" });
      setChat([]);
      setInput("");
      localStorage.removeItem("crisisActive");
      lastLangRef.current = "en";
      if (recognitionRef.current) recognitionRef.current.lang = "en-US";
    } catch (err) {
      console.error("Reset error:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const startListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition || listening) return;
    window.speechSynthesis.cancel();
    setListening(true);
    try { recognition.start(); }
    catch (err) { console.warn("Start error:", err.message); setListening(false); }
  };

  // ── build render list with date separators ───────────────────────────────

  const renderItems = [];
  let lastDayLabel = null;

  chat.forEach((msg, index) => {
    const label = getDayLabel(msg.ts || Date.now());
    if (label !== lastDayLabel) {
      renderItems.push({ type: "separator", label, key: `sep-${index}` });
      lastDayLabel = label;
    }
    renderItems.push({ type: "message", msg, key: `msg-${index}` });
  });

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <div className="chat-wrapper">
      <div className="chat-header">
        <div className="chat-header-left">
          <h1>🤖 MindMate Chat</h1>
          <p>Talk to your personal mental wellness assistant</p>
        </div>
        <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`voice-toggle-btn${voiceEnabled ? " voice-on" : ""}`}>
          {voiceEnabled ? "🔊 On" : "🔇 Off"}
        </button>
      </div>

      <div className="chat-container">
        {chat.length === 0 && (
          <div className="chat-empty">
            <p className="empty-icon">💬</p>
            <p className="empty-text">Start a conversation to get support and guidance</p>
          </div>
        )}

        {renderItems.map((item) => {
          if (item.type === "separator") {
            return (
              <div key={item.key} className="chat-date-separator">
                <span>{item.label}</span>
              </div>
            );
          }

          const { msg } = item;
          return (
            <div key={item.key} className={`chat-message ${msg.sender}`}>
              {msg.sender === "bot" ? (
                msg.crisis ? (
                  <div className="crisis-bubble">
                    <div className="crisis-bubble-body">
                      🚨 <strong>Support Needed</strong>
                      <p>{msg.text}</p>
                    </div>
                    <span className="msg-time crisis-time">{formatTime(msg.ts)}</span>
                  </div>
                ) : (
                  <div className="message-bubble bot">
                    <span className="msg-text">{msg.text}</span>
                    <span className="msg-time">{formatTime(msg.ts)}</span>
                  </div>
                )
              ) : (
                <div className="message-bubble user">
                  <span className="msg-text">{msg.text}</span>
                  <span className="msg-time user-time">{formatTime(msg.ts)}</span>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="chat-message bot">
            <div className="message-bubble typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-footer">
        <div className="chat-input-area">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share your thoughts..."
            className="chat-input"
            disabled={loading}
          />
          <div className="chat-actions">
            <button onClick={startListening} className={`chat-btn speak-btn${listening ? " listening" : ""}`}>
              🎤 {listening ? "Listening..." : "Speak"}
            </button>
            <button onClick={sendMessage} className="chat-btn send-btn" disabled={!input.trim() || loading}>
              {loading ? "···" : "Send ➤"}
            </button>
            <button onClick={startNewChat} className="chat-btn reset-btn">
              ↺ New Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;