# 💧 Hydration Tracker

A simple, beautiful water intake tracker to help you drink 9 glasses (2,250ml) a day.

## Features

- **Live countdown timer** to your next glass of water
- **Audio alarm** when it's time to drink
- **Browser notifications** (asks permission on first visit)
- **Visual glass** that fills up as you log water
- **9-dot progress tracker** — tap to log or undo
- **Daily schedule** with suggested times
- **Saves your progress** across page refreshes (resets each new day automatically)

## How to Use Locally

Just open `index.html` in any modern browser. No build step, no dependencies.

```bash
git clone https://github.com/YOUR_USERNAME/water-tracker.git
cd water-tracker
open index.html   # macOS
# or double-click index.html on Windows/Linux
```

## Deploy to GitHub Pages (Free Hosting)

1. Push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/water-tracker.git
git push -u origin main
```

2. Go to your repo on GitHub → **Settings** → **Pages**
3. Under "Source", select `main` branch → `/ (root)` → **Save**
4. Your app will be live at: `https://YOUR_USERNAME.github.io/water-tracker`

## Schedule

| Time     | Glass |
|----------|-------|
| 6:30 AM  | 1 — Wake up |
| 8:00 AM  | 2 — After breakfast |
| 10:00 AM | 3 — Mid-morning |
| 12:00 PM | 4 — Before lunch |
| 2:00 PM  | 5 — Early afternoon |
| 4:00 PM  | 6 — Mid-afternoon |
| 6:00 PM  | 7 — Before dinner |
| 8:00 PM  | 8 — After dinner |
| 9:30 PM  | 9 — Before bed |

## Notes

- Allow notifications when prompted so the alarm works even when the tab is in the background
- Keep the browser tab open for the countdown timer to work
- Progress is saved to `localStorage` and auto-resets each day
