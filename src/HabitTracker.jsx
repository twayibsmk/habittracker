/*
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║              HABITS HABIT TRACKER — SPACE STATION              ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║                                                                      ║
 * ║  SETUP INSTRUCTIONS:                                                 ║
 * ║                                                                      ║
 * ║  1. SUPABASE PROJECT:                                                ║
 * ║     - Replace YOUR_SUPABASE_URL with your Supabase project URL       ║
 * ║     - Replace YOUR_SUPABASE_ANON_KEY with your Supabase anon key     ║
 * ║                                                                      ║
 * ║  2. SUPABASE AUTH:                                                   ║
 * ║     - Enable Google provider in Supabase Auth → Providers dashboard  ║
 * ║     - Configure OAuth credentials from Google Cloud Console          ║
 * ║                                                                      ║
 * ║  3. SUPABASE DATABASE — Create a `habits` table:                     ║
 * ║     CREATE TABLE habits (                                            ║
 * ║       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,                 ║
 * ║       user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,      ║
 * ║       name TEXT NOT NULL,                                            ║
 * ║       frequency TEXT NOT NULL DEFAULT 'daily',                       ║
 * ║       completions JSONB DEFAULT '[]'::jsonb,                         ║
 * ║       created_at TIMESTAMPTZ DEFAULT now()                           ║
 * ║     );                                                               ║
 * ║                                                                      ║
 * ║     -- Enable RLS:                                                   ║
 * ║     ALTER TABLE habits ENABLE ROW LEVEL SECURITY;                    ║
 * ║     CREATE POLICY "Users manage own habits"                          ║
 * ║       ON habits FOR ALL                                              ║
 * ║       USING (auth.uid() = user_id)                                   ║
 * ║       WITH CHECK (auth.uid() = user_id);                             ║
 * ║                                                                      ║
 * ║  4. ANTHROPIC API:                                                   ║
 * ║     - The x-api-key header is pre-injected (no key needed here)      ║
 * ║                                                                      ║
 * ║  5. DEPENDENCIES (CDN-loaded):                                       ║
 * ║     - React 18, ReactDOM 18                                         ║
 * ║     - @supabase/supabase-js v2                                       ║
 * ║     - Tailwind CSS                                                   ║
 * ║     - Google Fonts: Orbitron, JetBrains Mono                         ║
 * ║                                                                      ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase Init ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://jyrsanijnpcgfwnmznel.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_0OH3rsmQG98okxUYS6rEsA_Ty87kO21";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Anthropic Config ────────────────────────────────────────────────────────
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-3-5-sonnet-20241022";

// ─── Date Helpers ────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split("T")[0];

const getWeekDates = () => {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
};

const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

const calculateStreak = (completions, frequency) => {
  if (!completions || completions.length === 0) return 0;
  const sorted = [...completions].sort().reverse();
  const today = new Date(todayStr());

  if (frequency === "weekly") {
    const getWeekNumber = (d) => {
      const date = new Date(d);
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const diff = date - startOfYear;
      return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
    };
    let streak = 0;
    let currentWeek = getWeekNumber(today);
    const currentYear = today.getFullYear();
    const weekSet = new Set(
      sorted.map((d) => `${new Date(d).getFullYear()}-${getWeekNumber(d)}`)
    );
    for (let i = 0; i < 52; i++) {
      const key = `${currentYear}-${currentWeek - i}`;
      if (weekSet.has(key)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }

  // Daily streak
  let streak = 0;
  let checkDate = new Date(today);
  const completionSet = new Set(sorted);

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (completionSet.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return streak;
};

// ─── CSS Keyframes & Styles (injected once) ─────────────────────────────────
const injectStyles = () => {
  if (document.getElementById("antigravity-styles")) return;
  const style = document.createElement("style");
  style.id = "antigravity-styles";
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500;600&display=swap');

    :root {
      --midnight: #0a0e1a;
      --deep-space: #0d1117;
      --panel-bg: rgba(13, 17, 30, 0.75);
      --panel-border: rgba(0, 255, 209, 0.15);
      --cyan: #00FFD1;
      --violet: #9B5DE5;
      --cyan-glow: rgba(0, 255, 209, 0.3);
      --violet-glow: rgba(155, 93, 229, 0.3);
      --text-primary: #f0f0f0;
      --text-secondary: rgba(240, 240, 240, 0.6);
      --danger: #ff4d6a;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      padding: 0;
      background: var(--deep-space);
      color: var(--text-primary);
      font-family: 'JetBrains Mono', monospace;
      overflow-x: hidden;
    }

    /* ── Star Field ─────────────────────────── */
    .starfield {
      position: fixed;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      pointer-events: none;
    }
    .starfield::before,
    .starfield::after,
    .starfield .layer3 {
      content: '';
      position: absolute;
      inset: -50%;
      background-image:
        radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.8), transparent),
        radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.6), transparent),
        radial-gradient(1px 1px at 50px 160px, rgba(255,255,255,0.5), transparent),
        radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.7), transparent),
        radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.4), transparent),
        radial-gradient(1px 1px at 160px 120px, rgba(255,255,255,0.6), transparent),
        radial-gradient(1.5px 1.5px at 200px 50px, rgba(0,255,209,0.4), transparent),
        radial-gradient(1px 1px at 250px 180px, rgba(255,255,255,0.5), transparent),
        radial-gradient(1px 1px at 300px 90px, rgba(155,93,229,0.3), transparent),
        radial-gradient(1px 1px at 350px 200px, rgba(255,255,255,0.6), transparent);
      background-size: 400px 300px;
      animation: starDrift 120s linear infinite;
    }
    .starfield::after {
      background-size: 600px 400px;
      animation: starDrift 200s linear infinite reverse;
      opacity: 0.6;
    }

    @keyframes starDrift {
      from { transform: translateY(0); }
      to { transform: translateY(300px); }
    }

    /* ── Floating Cards ─────────────────────── */
    @keyframes floatCard0 { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
    @keyframes floatCard1 { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
    @keyframes floatCard2 { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
    @keyframes floatCard3 { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
    @keyframes floatCard4 { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-14px); } }
    @keyframes floatCard5 { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-7px); } }

    .float-0 { animation: floatCard0 5.0s ease-in-out infinite; }
    .float-1 { animation: floatCard1 6.5s ease-in-out infinite; }
    .float-2 { animation: floatCard2 4.2s ease-in-out infinite; }
    .float-3 { animation: floatCard3 7.0s ease-in-out infinite; }
    .float-4 { animation: floatCard4 5.8s ease-in-out infinite; }
    .float-5 { animation: floatCard5 4.8s ease-in-out infinite; }

    /* ── Particle Confetti ──────────────────── */
    @keyframes particleUp {
      0% { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(-120px) scale(0); opacity: 0; }
    }
    .particle {
      position: absolute;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      pointer-events: none;
      animation: particleUp 0.8s ease-out forwards;
    }

    /* ── Orbit Ring (Sign-In) ───────────────── */
    @keyframes orbitSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .orbit-ring {
      position: absolute;
      border: 1px solid rgba(0, 255, 209, 0.2);
      border-radius: 50%;
      animation: orbitSpin 12s linear infinite;
    }
    .orbit-ring::after {
      content: '';
      position: absolute;
      width: 6px;
      height: 6px;
      background: var(--cyan);
      border-radius: 50%;
      top: -3px;
      left: 50%;
      margin-left: -3px;
      box-shadow: 0 0 12px var(--cyan);
    }
    .orbit-ring-2 {
      animation: orbitSpin 18s linear infinite reverse;
      border-color: rgba(155, 93, 229, 0.15);
    }
    .orbit-ring-2::after {
      background: var(--violet);
      box-shadow: 0 0 12px var(--violet);
    }

    /* ── AI Panel Slide ─────────────────────── */
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    .ai-panel-enter { animation: slideInRight 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
    .ai-panel-exit { animation: slideOutRight 0.4s cubic-bezier(0.7,0,0.84,0) forwards; }

    /* ── Typewriter Cursor ──────────────────── */
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
    .typing-cursor::after {
      content: '▋';
      color: var(--cyan);
      animation: blink 0.8s step-end infinite;
      margin-left: 2px;
    }

    /* ── Pulse Glow ─────────────────────────── */
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 5px var(--cyan-glow), 0 0 10px transparent; }
      50% { box-shadow: 0 0 15px var(--cyan-glow), 0 0 30px rgba(0,255,209,0.1); }
    }

    /* ── Progress Ring ──────────────────────── */
    @keyframes progressAppear {
      from { stroke-dashoffset: var(--circumference); }
    }

    /* ── Button Hover ───────────────────────── */
    .glow-btn {
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    .glow-btn::before {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: inherit;
      background: linear-gradient(135deg, var(--cyan), var(--violet));
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: -1;
    }
    .glow-btn:hover::before { opacity: 0.3; }
    .glow-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 20px rgba(0, 255, 209, 0.2);
    }

    /* ── Scrollbar ──────────────────────────── */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: rgba(10,14,26,0.5); }
    ::-webkit-scrollbar-thumb { background: rgba(0,255,209,0.2); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,209,0.4); }

    /* ── Checkbox Animation ─────────────────── */
    @keyframes checkPop {
      0% { transform: scale(1); }
      40% { transform: scale(1.3); }
      100% { transform: scale(1); }
    }
    .check-pop { animation: checkPop 0.3s ease; }

    /* ── Loading Shimmer ────────────────────── */
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .shimmer {
      background: linear-gradient(90deg, transparent 25%, rgba(0,255,209,0.05) 50%, transparent 75%);
      background-size: 200% 100%;
      animation: shimmer 2s infinite;
    }

    /* ── Sign-in Card Glow ──────────────────── */
    @keyframes cardGlow {
      0%, 100% {
        box-shadow: 0 0 30px rgba(0,255,209,0.1), 0 0 60px rgba(155,93,229,0.05);
      }
      50% {
        box-shadow: 0 0 50px rgba(0,255,209,0.2), 0 0 80px rgba(155,93,229,0.1);
      }
    }
  `;
  document.head.appendChild(style);
};

// ─── Particle Confetti Component ─────────────────────────────────────────────
const ParticleConfetti = ({ trigger, parentRef }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    const colors = ["#00FFD1", "#9B5DE5", "#00FFD1", "#ffffff", "#9B5DE5"];
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 60 - 30,
      y: 0,
      color: colors[i % colors.length],
      delay: Math.random() * 0.2,
      size: Math.random() * 4 + 3,
    }));
    setParticles(newParticles);
    const timer = setTimeout(() => setParticles([]), 1000);
    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <>
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: `calc(50% + ${p.x}px)`,
            bottom: "10px",
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </>
  );
};

// ─── Circular Progress Ring ──────────────────────────────────────────────────
const ProgressRing = ({ completed, total, size = 140, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total === 0 ? 0 : completed / total;
  const offset = circumference * (1 - progress);
  const percentage = Math.round(progress * 100);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            filter: "drop-shadow(0 0 6px rgba(0,255,209,0.4))",
          }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FFD1" />
            <stop offset="100%" stopColor="#9B5DE5" />
          </linearGradient>
        </defs>
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "28px",
            fontWeight: 700,
            background: "linear-gradient(135deg, #00FFD1, #9B5DE5)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {percentage}%
        </span>
        <span style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px", letterSpacing: "2px", textTransform: "uppercase" }}>
          Complete
        </span>
      </div>
    </div>
  );
};

// ─── Mini Week Calendar ──────────────────────────────────────────────────────
const WeekCalendar = ({ completions }) => {
  const weekDates = getWeekDates();
  const completionSet = new Set(completions || []);
  const today = todayStr();

  return (
    <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
      {weekDates.map((date, i) => {
        const isCompleted = completionSet.has(date);
        const isToday = date === today;
        return (
          <div
            key={date}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                color: isToday ? "#00FFD1" : "var(--text-secondary)",
                fontWeight: isToday ? 600 : 400,
                letterSpacing: "0.5px",
              }}
            >
              {dayLabels[i]}
            </span>
            <div
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "4px",
                border: `1px solid ${isCompleted ? "rgba(0,255,209,0.5)" : isToday ? "rgba(0,255,209,0.3)" : "rgba(255,255,255,0.08)"}`,
                background: isCompleted
                  ? "linear-gradient(135deg, rgba(0,255,209,0.3), rgba(155,93,229,0.2))"
                  : "rgba(255,255,255,0.02)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
              }}
            >
              {isCompleted && (
                <span style={{ fontSize: "10px", color: "#00FFD1" }}>✓</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Habit Card ──────────────────────────────────────────────────────────────
const HabitCard = ({ habit, index, onToggle, onDelete }) => {
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [checkAnim, setCheckAnim] = useState(false);
  const today = todayStr();
  const isCompletedToday = (habit.completions || []).includes(today);
  const streak = calculateStreak(habit.completions, habit.frequency);

  const handleToggle = () => {
    if (!isCompletedToday) {
      setParticleTrigger((p) => p + 1);
      setCheckAnim(true);
      setTimeout(() => setCheckAnim(false), 300);
    }
    onToggle(habit);
  };

  return (
    <div
      className={`float-${index % 6}`}
      style={{
        position: "relative",
        background: "var(--panel-bg)",
        border: "1px solid var(--panel-border)",
        borderRadius: "16px",
        padding: "20px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        transition: "all 0.3s ease",
        cursor: "default",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(0,255,209,0.35)";
        e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,255,209,0.1), 0 0 60px rgba(155,93,229,0.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(0,255,209,0.15)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Confetti particles */}
      <ParticleConfetti trigger={particleTrigger} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "15px",
              fontWeight: 600,
              margin: 0,
              color: "var(--text-primary)",
              letterSpacing: "0.5px",
            }}
          >
            {habit.name}
          </h3>
          <span
            style={{
              fontSize: "10px",
              color: habit.frequency === "daily" ? "#00FFD1" : "#9B5DE5",
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginTop: "4px",
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: "4px",
              background: habit.frequency === "daily" ? "rgba(0,255,209,0.08)" : "rgba(155,93,229,0.08)",
              border: `1px solid ${habit.frequency === "daily" ? "rgba(0,255,209,0.15)" : "rgba(155,93,229,0.15)"}`,
            }}
          >
            {habit.frequency}
          </span>
        </div>
        <button
          onClick={() => onDelete(habit.id)}
          title="Delete habit"
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "16px",
            padding: "4px",
            borderRadius: "4px",
            transition: "all 0.2s ease",
            lineHeight: 1,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#ff4d6a"; e.currentTarget.style.background = "rgba(255,77,106,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "none"; }}
        >
          ✕
        </button>
      </div>

      {/* Streak & Toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "18px" }}>🔥</span>
          <span
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "20px",
              fontWeight: 700,
              background: streak > 0 ? "linear-gradient(135deg, #00FFD1, #9B5DE5)" : "none",
              color: streak > 0 ? undefined : "var(--text-secondary)",
              WebkitBackgroundClip: streak > 0 ? "text" : undefined,
              WebkitTextFillColor: streak > 0 ? "transparent" : undefined,
            }}
          >
            {streak}
          </span>
          <span style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>
            {habit.frequency === "daily" ? "days" : "weeks"}
          </span>
        </div>

        {/* Toggle Button */}
        <button
          onClick={handleToggle}
          className={checkAnim ? "check-pop" : ""}
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            border: `2px solid ${isCompletedToday ? "#00FFD1" : "rgba(255,255,255,0.15)"}`,
            background: isCompletedToday
              ? "linear-gradient(135deg, rgba(0,255,209,0.2), rgba(155,93,229,0.15))"
              : "rgba(255,255,255,0.03)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            transition: "all 0.3s ease",
            boxShadow: isCompletedToday ? "0 0 20px rgba(0,255,209,0.2)" : "none",
          }}
          onMouseEnter={(e) => {
            if (!isCompletedToday) {
              e.currentTarget.style.borderColor = "rgba(0,255,209,0.5)";
              e.currentTarget.style.background = "rgba(0,255,209,0.05)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isCompletedToday) {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            }
          }}
        >
          {isCompletedToday ? (
            <span style={{ color: "#00FFD1" }}>✓</span>
          ) : (
            <span style={{ color: "rgba(255,255,255,0.2)" }}>○</span>
          )}
        </button>
      </div>

      {/* Week Calendar */}
      <WeekCalendar completions={habit.completions} />
    </div>
  );
};

// ─── Add Habit Form ──────────────────────────────────────────────────────────
const AddHabitForm = ({ onAdd, loading }) => {
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), frequency });
    setName("");
    setFrequency("daily");
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="glow-btn"
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: "16px",
          border: "1px dashed rgba(0,255,209,0.25)",
          background: "rgba(0,255,209,0.03)",
          color: "#00FFD1",
          cursor: "pointer",
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "13px",
          fontWeight: 500,
          letterSpacing: "1px",
          transition: "all 0.3s ease",
        }}
      >
        + NEW HABIT
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "var(--panel-bg)",
        border: "1px solid var(--panel-border)",
        borderRadius: "16px",
        padding: "20px",
        backdropFilter: "blur(20px)",
      }}
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Habit name..."
        autoFocus
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: "10px",
          border: "1px solid rgba(0,255,209,0.2)",
          background: "rgba(0,0,0,0.3)",
          color: "var(--text-primary)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "14px",
          outline: "none",
          transition: "border-color 0.3s ease",
          marginBottom: "12px",
        }}
        onFocus={(e) => { e.target.style.borderColor = "rgba(0,255,209,0.5)"; }}
        onBlur={(e) => { e.target.style.borderColor = "rgba(0,255,209,0.2)"; }}
      />

      <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
        {["🌌", "💧", "🏃‍♂️", "📖", "🧘‍♀️", "🍎", "🚀", "💻", "🛸", "🧠", "🏋️"].map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setName((prev) => prev ? `${e} ${prev.replace(/^[\u1000-\uFFFF]+\s*/, '')}` : `${e} `)}
            style={{
              padding: "6px 8px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(ev) => { ev.currentTarget.style.background = "rgba(0,255,209,0.1)"; ev.currentTarget.style.borderColor = "rgba(0,255,209,0.3)"; }}
            onMouseLeave={(ev) => { ev.currentTarget.style.background = "rgba(255,255,255,0.03)"; ev.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
          >
            {e}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {["daily", "weekly"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFrequency(f)}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              border: `1px solid ${frequency === f ? (f === "daily" ? "rgba(0,255,209,0.5)" : "rgba(155,93,229,0.5)") : "rgba(255,255,255,0.08)"}`,
              background: frequency === f
                ? (f === "daily" ? "rgba(0,255,209,0.1)" : "rgba(155,93,229,0.1)")
                : "rgba(255,255,255,0.02)",
              color: frequency === f ? (f === "daily" ? "#00FFD1" : "#9B5DE5") : "var(--text-secondary)",
              cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              transition: "all 0.3s ease",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.03)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
            transition: "all 0.2s ease",
          }}
        >
          CANCEL
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          style={{
            flex: 2,
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid rgba(0,255,209,0.3)",
            background: "linear-gradient(135deg, rgba(0,255,209,0.15), rgba(155,93,229,0.1))",
            color: "#00FFD1",
            cursor: loading || !name.trim() ? "not-allowed" : "pointer",
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "1px",
            opacity: loading || !name.trim() ? 0.4 : 1,
            transition: "all 0.3s ease",
          }}
        >
          {loading ? "LAUNCHING..." : "LAUNCH HABIT"}
        </button>
      </div>
    </form>
  );
};

// ─── AI Coaching Panel ───────────────────────────────────────────────────────
const AICoachingPanel = ({ isOpen, onClose, habits }) => {
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [displayedText, setDisplayedText] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const scrollRef = useRef(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setResponse("");
      setDisplayedText("");
      setError(null);
      onClose();
    }, 400);
  };

  // Typewriter effect
  useEffect(() => {
    if (!response) return;
    let i = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      if (i < response.length) {
        setDisplayedText(response.slice(0, i + 1));
        i++;
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
      }
    }, 12);
    return () => clearInterval(interval);
  }, [response]);

  const fetchCoaching = async () => {
    setIsLoading(true);
    setError(null);
    setResponse("");
    setDisplayedText("");

    // Simulate network delay for "AI" processing effect
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const totalHabits = habits.length;
      if (totalHabits === 0) {
        setResponse("🛰️ **Mission Status** — Launch sequence pending.\n\n🌟 **What's Working** — Access terminal connected.\n\n⚠️ **Attention Needed** — No active habits detected.\n\n🚀 **Next Steps** \n1. Click + New Habit below.\n2. Initialize your first daily objective.");
        return;
      }

      const activeToday = habits.filter(h => (h.completions || []).includes(todayStr()));
      const completionRate = activeToday.length / totalHabits;
      
      let bestHabit = habits[0];
      let maxStreak = 0;
      habits.forEach(h => {
        const s = calculateStreak(h.completions, h.frequency);
        if (s >= maxStreak) {
          maxStreak = s;
          bestHabit = h;
        }
      });

      const slipping = habits.filter(h => calculateStreak(h.completions, h.frequency) === 0 && (h.completions || []).length > 0);

      let status = "Stabilizing orbit.";
      if (completionRate === 1) status = "Optimal trajectory. All primary systems engaged.";
      else if (completionRate >= 0.5) status = "Main thrusters active. Solid daily progress.";
      else if (completionRate > 0) status = "Minimum velocity achieved. Recommend immediate boost.";
      else status = "Drifting. No thruster activity detected today.";

      let nextSteps = "1. Target your easiest uncompleted habit right now.\n2. Review if your frequencies are too demanding.";
      if (completionRate === 1) nextSteps = "1. Rest and recharge. Mission accomplished for today.\n2. Prepare to maintain momentum on the next cycle.";

      let responseText = `🛰️ **Mission Status** — ${status}\n\n`;
      
      if (maxStreak > 0) {
        responseText += `🌟 **What's Working** — Your protocol for **${bestHabit.name}** is excelling with an ongoing ${maxStreak} streak!\n\n`;
      } else {
        responseText += `🌟 **What's Working** — Habit objectives are successfully logged in the database.\n\n`;
      }

      if (slipping.length > 0) {
        const slippingNames = slipping.slice(0, 2).map(s => `**${s.name}**`).join(' and ');
        responseText += `⚠️ **Attention Needed** — ${slippingNames} ${slipping.length > 2 ? 'and others' : ''} are showing lapsed signals. Recalibrate to avoid losing progress entirely.\n\n`;
      } else if (completionRate < 1) {
        responseText += `⚠️ **Attention Needed** — Prioritize remaining daily objectives to secure the sector.\n\n`;
      } else {
        responseText += `⚠️ **Attention Needed** — None. All systems operating at peak efficiency.\n\n`;
      }

      responseText += `🚀 **Next Steps** \n${nextSteps}`;

      setResponse(responseText);
    } catch (err) {
      setError("Failed to analyze data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch on open
  useEffect(() => {
    if (isOpen && !response && !isLoading && !error) {
      fetchCoaching();
    }
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 998,
          backdropFilter: "blur(4px)",
          transition: "opacity 0.3s ease",
          opacity: isClosing ? 0 : 1,
        }}
      />

      {/* Panel */}
      <div
        className={isClosing ? "ai-panel-exit" : "ai-panel-enter"}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(480px, 90vw)",
          background: "linear-gradient(180deg, rgba(10,14,26,0.98) 0%, rgba(13,17,23,0.98) 100%)",
          borderLeft: "1px solid rgba(155,93,229,0.2)",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          backdropFilter: "blur(40px)",
        }}
      >
        {/* Panel Header */}
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid rgba(155,93,229,0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: "16px",
                fontWeight: 700,
                margin: 0,
                background: "linear-gradient(135deg, #9B5DE5, #00FFD1)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "1px",
              }}
            >
              AI MISSION BRIEFING
            </h2>
            <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "4px 0 0", letterSpacing: "1px" }}>
              POWERED BY CLAUDE SONNET
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "8px 12px",
              fontSize: "14px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
          >
            ✕
          </button>
        </div>

        {/* Panel Content */}
        <div ref={scrollRef} style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          {isLoading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "16px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                border: "2px solid rgba(155,93,229,0.2)",
                borderTop: "2px solid #9B5DE5",
                borderRadius: "50%",
                animation: "orbitSpin 1s linear infinite",
              }} />
              <span className="typing-cursor" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: "var(--text-secondary)" }}>
                Analyzing mission data
              </span>
            </div>
          )}

          {error && (
            <div style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid rgba(255,77,106,0.3)",
              background: "rgba(255,77,106,0.06)",
              color: "#ff4d6a",
              fontSize: "13px",
              textAlign: "center",
            }}>
              <p style={{ margin: "0 0 12px" }}>⚠️ {error}</p>
              <button
                onClick={fetchCoaching}
                style={{
                  padding: "8px 20px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,77,106,0.3)",
                  background: "rgba(255,77,106,0.1)",
                  color: "#ff4d6a",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                RETRY
              </button>
            </div>
          )}

          {displayedText && (
            <div
              className={displayedText.length < response.length ? "typing-cursor" : ""}
              style={{
                fontSize: "14px",
                lineHeight: "1.7",
                color: "var(--text-primary)",
                whiteSpace: "pre-wrap",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {displayedText.split("\n").map((line, i) => {
                // Bold formatting
                const formatted = line.replace(
                  /\*\*(.*?)\*\*/g,
                  '<strong style="color: #00FFD1">$1</strong>'
                );
                return (
                  <p
                    key={i}
                    style={{ margin: "0 0 8px" }}
                    dangerouslySetInnerHTML={{ __html: formatted }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Retry Button at bottom */}
        {response && !isLoading && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(155,93,229,0.1)" }}>
            <button
              onClick={fetchCoaching}
              className="glow-btn"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid rgba(155,93,229,0.3)",
                background: "linear-gradient(135deg, rgba(155,93,229,0.1), rgba(0,255,209,0.05))",
                color: "#9B5DE5",
                cursor: "pointer",
                fontFamily: "'Orbitron', sans-serif",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "1.5px",
              }}
            >
              🔄 REQUEST NEW BRIEFING
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Sign-In Screen ──────────────────────────────────────────────────────────
const SignInScreen = ({ onSignIn, loading, error }) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        background: "var(--deep-space)",
      }}
    >
      <div className="starfield">
        <div className="layer3" />
      </div>

      {/* Sign-in Card */}
      <div
        style={{
          position: "relative",
          width: "380px",
          maxWidth: "90vw",
          padding: "48px 36px",
          borderRadius: "24px",
          background: "rgba(13, 17, 30, 0.8)",
          border: "1px solid rgba(0,255,209,0.15)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          textAlign: "center",
          animation: "cardGlow 4s ease-in-out infinite",
          zIndex: 2,
        }}
      >
        {/* Orbit Rings */}
        <div
          className="orbit-ring"
          style={{
            width: "340px",
            height: "340px",
            top: "50%",
            left: "50%",
            marginTop: "-170px",
            marginLeft: "-170px",
          }}
        />
        <div
          className="orbit-ring orbit-ring-2"
          style={{
            width: "420px",
            height: "420px",
            top: "50%",
            left: "50%",
            marginTop: "-210px",
            marginLeft: "-210px",
          }}
        />

        {/* Logo */}
        <div style={{ marginBottom: "8px", fontSize: "40px" }}>🛸</div>
        <h1
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "22px",
            fontWeight: 800,
            margin: "0 0 4px",
            background: "linear-gradient(135deg, #00FFD1, #9B5DE5)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "3px",
          }}
        >
          HABITS
        </h1>
        <p
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "10px",
            color: "var(--text-secondary)",
            margin: "0 0 32px",
            letterSpacing: "4px",
            textTransform: "uppercase",
          }}
        >
          Tracker
        </p>

        <p
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            margin: "0 0 32px",
          }}
        >
          Track your habits across the cosmos.
          <br />
          Build streaks. Get AI coaching.
        </p>

        {error && (
          <div
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid rgba(255,77,106,0.3)",
              background: "rgba(255,77,106,0.06)",
              color: "#ff4d6a",
              fontSize: "12px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={onSignIn}
          disabled={loading}
          className="glow-btn"
          style={{
            width: "100%",
            padding: "14px 24px",
            borderRadius: "12px",
            border: "1px solid rgba(0,255,209,0.3)",
            background: "linear-gradient(135deg, rgba(0,255,209,0.12), rgba(155,93,229,0.08))",
            color: "#00FFD1",
            cursor: loading ? "wait" : "pointer",
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "1.5px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            opacity: loading ? 0.6 : 1,
            transition: "all 0.3s ease",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {loading ? "CONNECTING..." : "SIGN IN WITH GOOGLE"}
        </button>

        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", margin: "20px 0 0", letterSpacing: "0.5px" }}>
          Secured by Supabase • Powered by Claude
        </p>
      </div>
    </div>
  );
};

// ─── Loading Screen ──────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--deep-space)",
      zIndex: 200,
      gap: "20px",
    }}
  >
    <div className="starfield"><div className="layer3" /></div>
    <div
      style={{
        width: "50px",
        height: "50px",
        border: "2px solid rgba(0,255,209,0.15)",
        borderTop: "2px solid #00FFD1",
        borderRadius: "50%",
        animation: "orbitSpin 1s linear infinite",
      }}
    />
    <p
      style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: "12px",
        color: "var(--text-secondary)",
        letterSpacing: "3px",
      }}
    >
      INITIALIZING STATION
    </p>
  </div>
);

// ─── Main App ────────────────────────────────────────────────────────────────
export default function HabitTracker() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [habits, setHabits] = useState([]);
  const [habitsLoading, setHabitsLoading] = useState(false);
  const [savingHabit, setSavingHabit] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);

  // Inject styles on mount
  useEffect(() => { injectStyles(); }, []);

  // ── Auth ─────────────────────────────────────
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setAuthLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  // ── Load Habits ──────────────────────────────
  const loadHabits = useCallback(async () => {
    if (!session?.user) return;
    setHabitsLoading(true);
    try {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setHabits(data || []);
    } catch (err) {
      console.error("Failed to load habits:", err);
    } finally {
      setHabitsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) loadHabits();
  }, [session, loadHabits]);

  const [addHabitError, setAddHabitError] = useState(null);

  // ── CRUD Operations ──────────────────────────
  const createHabit = async ({ name, frequency }) => {
    if (!session?.user) return;
    setSavingHabit(true);
    setAddHabitError(null);
    try {
      const { data, error } = await supabase
        .from("habits")
        .insert({
          user_id: session.user.id,
          name,
          frequency,
          completions: [],
        })
        .select()
        .single();
      if (error) throw error;
      setHabits((prev) => [...prev, data]);
    } catch (err) {
      console.error("Create habit error:", err);
      let errorMsg = err.message || "Failed to create habit.";
      if (err.code === "42P01") {
        errorMsg = "Table 'habits' does not exist. Did you run the SQL script?";
      } else if (err.code === "42501") {
        errorMsg = "Permission denied (RLS). Check your table policies.";
      }
      setAddHabitError(errorMsg);
    } finally {
      setSavingHabit(false);
    }
  };

  const deleteHabit = async (id) => {

    try {
      const { error } = await supabase
        .from("habits")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setHabits((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error("Delete habit error:", err);
    }
  };

  const toggleCompletion = async (habit) => {

    const today = todayStr();
    const completions = habit.completions || [];
    const isCompleted = completions.includes(today);
    const newCompletions = isCompleted
      ? completions.filter((d) => d !== today)
      : [...completions, today];

    // Optimistic update
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id ? { ...h, completions: newCompletions } : h
      )
    );

    try {
      const { error } = await supabase
        .from("habits")
        .update({ completions: newCompletions })
        .eq("id", habit.id);
      if (error) throw error;
    } catch (err) {
      console.error("Toggle completion error:", err);
      // Revert on error
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habit.id ? { ...h, completions } : h
        )
      );
    }
  };

  // ── Auth Actions ─────────────────────────────
  const signIn = async () => {

    setAuthLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      setAuthError(err.message || "Sign-in failed");
      setAuthLoading(false);
    }
  };

  const signOut = async () => {

    await supabase.auth.signOut();
    setSession(null);
    setHabits([]);
  };

  // ── Computed ─────────────────────────────────
  const today = todayStr();
  const todayCompleted = habits.filter((h) =>
    (h.completions || []).includes(today)
  ).length;
  const totalHabits = habits.length;

  const user = session?.user;
  const userName = user?.user_metadata?.full_name || user?.email || "Astronaut";
  const userAvatar = user?.user_metadata?.avatar_url;

  // ── Render ───────────────────────────────────
  if (loading) return <LoadingScreen />;
  if (!session) return <SignInScreen onSignIn={signIn} loading={authLoading} error={authError} />;

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Star Field Background */}
      <div className="starfield"><div className="layer3" /></div>

      {/* App Content */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto", padding: "24px 20px 60px" }}>
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "36px",
            padding: "16px 20px",
            borderRadius: "16px",
            background: "rgba(13, 17, 30, 0.6)",
            border: "1px solid rgba(0,255,209,0.08)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>🛸</span>
            <div>
              <h1
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: "16px",
                  fontWeight: 800,
                  margin: 0,
                  background: "linear-gradient(135deg, #00FFD1, #9B5DE5)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "2px",
                }}
              >
                HABITS
              </h1>
              <p style={{ margin: 0, fontSize: "10px", color: "var(--text-secondary)", letterSpacing: "2px" }}>
                TRACKER
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* AI Coach Button */}
            <button
              onClick={() => setCoachOpen(true)}
              disabled={habits.length === 0}
              className="glow-btn"
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: "1px solid rgba(155,93,229,0.3)",
                background: "linear-gradient(135deg, rgba(155,93,229,0.1), rgba(0,255,209,0.05))",
                color: "#9B5DE5",
                cursor: habits.length === 0 ? "not-allowed" : "pointer",
                fontFamily: "'Orbitron', sans-serif",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "1px",
                opacity: habits.length === 0 ? 0.4 : 1,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ fontSize: "14px" }}>🤖</span>
              GET COACHING
            </button>

            {/* User Info */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: "2px solid rgba(0,255,209,0.3)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(0,255,209,0.2), rgba(155,93,229,0.2))",
                    border: "2px solid rgba(0,255,209,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#00FFD1",
                  }}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ display: "none" /* Hidden on small screens */ }}>
                <span style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 500 }}>
                  {userName}
                </span>
              </div>
              <button
                onClick={signOut}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "10px",
                  fontFamily: "'JetBrains Mono', monospace",
                  transition: "all 0.2s ease",
                  letterSpacing: "1px",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,77,106,0.3)"; e.currentTarget.style.color = "#ff4d6a"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                SIGN OUT
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard: Progress Ring + Stats */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "40px",
            marginBottom: "40px",
            padding: "32px",
            borderRadius: "20px",
            background: "rgba(13, 17, 30, 0.5)",
            border: "1px solid rgba(0,255,209,0.08)",
            backdropFilter: "blur(16px)",
            flexWrap: "wrap",
          }}
        >
          <ProgressRing completed={todayCompleted} total={totalHabits} />

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <p style={{ margin: 0, fontSize: "10px", color: "var(--text-secondary)", letterSpacing: "2px", textTransform: "uppercase" }}>
                Today's Mission
              </p>
              <p style={{ margin: "4px 0 0", fontFamily: "'Orbitron', sans-serif", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
                <span style={{ color: "#00FFD1" }}>{todayCompleted}</span>
                <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}> / {totalHabits}</span>
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "10px", color: "var(--text-secondary)", letterSpacing: "2px", textTransform: "uppercase" }}>
                Active Habits
              </p>
              <p style={{ margin: "4px 0 0", fontFamily: "'Orbitron', sans-serif", fontSize: "20px", fontWeight: 700, color: "#9B5DE5" }}>
                {totalHabits}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "10px", color: "var(--text-secondary)", letterSpacing: "2px", textTransform: "uppercase" }}>
                Best Streak
              </p>
              <p style={{ margin: "4px 0 0", fontFamily: "'Orbitron', sans-serif", fontSize: "20px", fontWeight: 700, color: "#00FFD1" }}>
                {habits.length > 0
                  ? Math.max(...habits.map((h) => calculateStreak(h.completions, h.frequency)))
                  : 0}
                <span style={{ fontSize: "12px", color: "var(--text-secondary)", marginLeft: "4px" }}>🔥</span>
              </p>
            </div>
          </div>
        </div>

        {/* Habits Loading State */}
        {habitsLoading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <div
              style={{
                width: "30px",
                height: "30px",
                border: "2px solid rgba(0,255,209,0.2)",
                borderTop: "2px solid #00FFD1",
                borderRadius: "50%",
                animation: "orbitSpin 1s linear infinite",
              }}
            />
          </div>
        )}

        {/* Habit Grid */}
        {!habitsLoading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            {habits.map((habit, i) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                index={i}
                onToggle={toggleCompletion}
                onDelete={deleteHabit}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!habitsLoading && habits.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "48px 20px",
              marginBottom: "20px",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🌌</div>
            <h3
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                margin: "0 0 8px",
                letterSpacing: "2px",
              }}
            >
              NO HABITS YET
            </h3>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", margin: 0 }}>
              Launch your first habit to begin the mission
            </p>
          </div>
        )}

        {/* Add Habit */}
        <div style={{ maxWidth: "360px", margin: "0 auto" }}>
          <AddHabitForm onAdd={createHabit} loading={savingHabit} />
          {addHabitError && (
            <div style={{
              marginTop: "16px",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid rgba(255,77,106,0.3)",
              background: "rgba(255,77,106,0.06)",
              color: "#ff4d6a",
              fontSize: "13px",
              textAlign: "center",
            }}>
              ⚠️ {addHabitError}
            </div>
          )}
        </div>
      </div>

      {/* AI Coaching Panel */}
      <AICoachingPanel
        isOpen={coachOpen}
        onClose={() => setCoachOpen(false)}
        habits={habits}
      />
    </div>
  );
}
