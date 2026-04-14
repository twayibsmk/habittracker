<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Claude-AI%20Coach-8B5CF6?style=for-the-badge&logo=anthropic&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
</p>

<h1 align="center">🛸 Habits Tracker</h1>

<p align="center">
  <strong>A full-stack habit tracking app with AI coaching, built with React, Supabase, and Claude.</strong>
</p>

<p align="center">
  Track habits across the cosmos. Build streaks. Get personalized AI coaching.<br/>
  Wrapped in a deep-space command center aesthetic.
</p>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Google OAuth** | Secure sign-in via Supabase Auth with Google provider |
| 📊 **Habit CRUD** | Create, delete, and toggle daily/weekly habits |
| 🔥 **Streak Tracking** | Consecutive day/week streak counter per habit |
| 🎯 **Progress Ring** | Circular SVG ring showing today's overall completion |
| 📅 **Week Calendar** | Mini 7-day calendar row per habit showing weekly progress |
| 🤖 **AI Coaching** | Personalized feedback from Claude Opus based on your habit data |
| 🌌 **Space UI** | Deep-space aesthetic with floating cards, star fields, and particle confetti |

## 🎨 Design

- **Background**: Near-black deep space with CSS star field animation
- **Cards**: Glassmorphic floating panels with gentle oscillating drift
- **Interactions**: Particle confetti on check-off, hover glows, smooth transitions
- **Colors**: Midnight navy base, neon cyan `#00FFD1`, electric violet `#9B5DE5`
- **Typography**: [Orbitron](https://fonts.google.com/specimen/Orbitron) for headings, [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) for data
- **AI Panel**: Slides in from the right with a typewriter-style response reveal

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite 6
- **Auth & Database**: [Supabase](https://supabase.com) (PostgreSQL + Row Level Security)
- **AI**: [Anthropic Claude](https://anthropic.com) (`claude-opus-4-6-20251101`)
- **Styling**: Vanilla CSS with injected keyframe animations
- **Fonts**: Google Fonts (Orbitron, JetBrains Mono)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- A [Supabase](https://supabase.com) project
- Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

### 1. Clone the repo

```bash
git clone https://github.com/twayibsmk/habittracker.git
cd habittracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

#### a) Create the `habits` table

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily',
  completions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

-- Policy: users can only access their own habits
CREATE POLICY "Users manage own habits"
  ON habits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

#### b) Enable Google Auth

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Enable **Google** and add your OAuth Client ID + Secret
3. In Google Cloud Console, add this redirect URI:
   ```
   https://<your-project>.supabase.co/auth/v1/callback
   ```

#### c) Update credentials

Open `src/HabitTracker.jsx` and replace the Supabase URL and anon key:

```js
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key";
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📁 Project Structure

```
habittracker/
├── index.html              # Entry HTML with font preloads & SEO meta
├── vite.config.js          # Vite configuration
├── package.json            # Dependencies and scripts
├── .gitignore              # Git ignore rules
├── HabitTracker.jsx        # Standalone artifact version (CDN-based)
└── src/
    ├── main.jsx            # React entry point
    ├── index.css           # Global styles and resets
    └── HabitTracker.jsx    # Main app component (all features)
```

## 🧠 AI Coaching

The **"Get Coaching"** button sends your full habit data to Claude, including:
- Habit names and frequencies
- Current streak counts
- Recent completion history
- Today's completion status

Claude responds with a structured mission briefing:
- 🛰️ **Mission Status** — Overall assessment
- 🌟 **What's Working** — Wins and strong streaks
- ⚠️ **Attention Needed** — Habits that are slipping
- 🚀 **Next Steps** — Concrete recommendations for the next 48 hours

## 📋 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server on port 5173 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

## 🔒 Security Notes

- Row Level Security (RLS) ensures users can only access their own habits
- Supabase anon key is safe to expose client-side (RLS protects the data)
- Google OAuth tokens are managed entirely by Supabase Auth
- The Anthropic API key is pre-injected and not stored in the codebase

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with 🛸 by <a href="https://github.com/twayibsmk">twayibsmk</a>
</p>
