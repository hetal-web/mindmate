import { useState, useEffect, useCallback, useRef } from "react";
import "./Meditation.css";
import config from "../config";
import useUser from "../hooks/useUser";

function Meditation() {
  const user = useUser();
  const [time, setTime] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [selectedSound, setSelectedSound] = useState("om");
  const [completed, setCompleted] = useState(false);
  const [breathPhase, setBreathPhase] = useState("Inhale");
  const audioRef = useRef(null);
  const breathRef = useRef(null);

  const sounds = {
    om: "/sounds/om.mp3",
    desert_whale: "/sounds/Desert_Whale.mp3",
    forest: "/sounds/Forest_Birds.mp3",
    healing: "/sounds/Healing.mp3",
    meditate: "/sounds/Meditate.mp3",
    calm: "/sounds/Calm_Space.mp3",
  };

  const saveMeditation = useCallback((duration) => {
    const userId = user?.id;
    if (!userId) return;
    fetch(`${config.API_URL}/meditation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        duration,
        date: new Date().toISOString().split("T")[0],
      }),
    }).catch((err) => console.error("Meditation save failed", err));
  }, [user?.id]);

  // Breath phase tracker — 4s inhale, 4s exhale
  useEffect(() => {
    if (!running) {
      clearInterval(breathRef.current);
      return;
    }
    setBreathPhase("Inhale");
    breathRef.current = setInterval(() => {
      setBreathPhase((prev) => (prev === "Inhale" ? "Exhale" : "Inhale"));
    }, 4000);
    return () => clearInterval(breathRef.current);
  }, [running]);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (running && seconds > 0) {
      timer = setInterval(() => setSeconds((prev) => prev - 1), 1000);
    }
    if (seconds === 0 && running) {
      setRunning(false);
      saveMeditation(time);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setCompleted(true);
    }
    return () => clearInterval(timer);
  }, [running, seconds, time, saveMeditation]);

  const startMeditation = () => {
    setSeconds(time * 60);
    setRunning(true);
    setCompleted(false);
    if (audioRef.current) {
      audioRef.current.src = sounds[selectedSound];
      audioRef.current.loop = true;
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
  };

  const pauseMeditation = () => {
    setRunning(false);
    if (audioRef.current) audioRef.current.pause();
  };

  const resumeMeditation = () => {
    setRunning(true);
    if (audioRef.current) audioRef.current.play().catch(() => {});
  };

  const exitMeditation = () => {
    setRunning(false);
    setSeconds(0);
    setCompleted(false);
    clearInterval(breathRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const formatTime = () => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const isSetup = !running && seconds === 0;
  const isPaused = !running && seconds > 0;

  return (
    <div className="meditation-container">
      <div className="meditation-card">
        <audio ref={audioRef} />

        <p className="meditation-title">Mindful Space</p>
        <h2 className="meditation-subtitle">Still the mind,<br />open the heart</h2>
        <div className="divider" />

        {/* Completion banner */}
        {completed && (
          <div className="completion-card">
            <p>Session complete</p>
            <span>✦ &nbsp; Well done &nbsp; ✦</span>
          </div>
        )}

        {/* Setup screen */}
        {isSetup && (
          <>
            <div className="select-group">
              <div className="select-wrapper">
                <select className="time-select" value={time} onChange={(e) => setTime(Number(e.target.value))}>
                  <option value={1}>1 minute</option>
                  <option value={2}>2 minutes</option>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                </select>
              </div>
              <div className="select-wrapper">
                <select className="time-select" value={selectedSound} onChange={(e) => setSelectedSound(e.target.value)}>
                  <option value="om">🕉️  OM</option>
                  <option value="desert_whale">🐳  Desert Whale</option>
                  <option value="forest">🌿  Forest Birds</option>
                  <option value="healing">🌸  Healing</option>
                  <option value="meditate">🧘  Meditate</option>
                  <option value="calm">🌌  Calm Space</option>
                </select>
              </div>
            </div>
            <button className="start-btn" onClick={startMeditation}>Begin</button>
          </>
        )}

        {/* Paused screen */}
        {isPaused && (
          <>
            <span className="state-label">Paused</span>
            <div className="orb-wrapper">
              <div className="orb-ring" />
              <div className="orb-ring" />
              <div className="circle" style={{ animationPlayState: "paused" }} />
            </div>
            <div className="timer-text">{formatTime()}</div>
            <div className="breath-text">Rest here a moment</div>
            <div className="meditation-actions">
              <button className="pause-btn" onClick={resumeMeditation}>Resume</button>
              <button className="exit-btn" onClick={exitMeditation}>Exit</button>
            </div>
          </>
        )}

        {/* Active session */}
        {running && (
          <>
            <div className="orb-wrapper">
              <div className="orb-ring" />
              <div className="orb-ring" />
              <div className="circle" />
            </div>
            <div className="timer-text">{formatTime()}</div>
            <div className="breath-text">{breathPhase}…</div>
            <div className="meditation-actions">
              <button className="pause-btn" onClick={pauseMeditation}>Pause</button>
              <button className="exit-btn" onClick={exitMeditation}>Exit</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Meditation;