'use strict';

// ── Config ──────────────────────────────────────────────────────────────────
const TOTAL = 9;
const ML_PER_GLASS = 250;

const SCHEDULE = [
  { time: "06:30", label: "Wake up — start your day" },
  { time: "08:00", label: "After breakfast" },
  { time: "10:00", label: "Mid-morning boost" },
  { time: "12:00", label: "Before lunch" },
  { time: "14:00", label: "Early afternoon" },
  { time: "16:00", label: "Mid-afternoon" },
  { time: "18:00", label: "Before dinner" },
  { time: "20:00", label: "After dinner" },
  { time: "21:30", label: "Before bed (last call!)" },
];

// ── State ────────────────────────────────────────────────────────────────────
let count = 0;
let timerInterval = null;
let alarmFired = false;
let notifGranted = false;

// ── Storage ──────────────────────────────────────────────────────────────────
function getToday() {
  return new Date().toISOString().slice(0, 10);
}
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('wt_state') || '{}');
    if (saved.date === getToday()) {
      count = Math.min(saved.count || 0, TOTAL);
    } else {
      count = 0;
    }
  } catch { count = 0; }
}
function saveState() {
  try {
    localStorage.setItem('wt_state', JSON.stringify({ date: getToday(), count }));
  } catch {}
}

// ── Schedule helpers ─────────────────────────────────────────────────────────
function scheduleToMs(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}
function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function getNextScheduleItem() {
  const now = Date.now();
  // Find the next scheduled time that hasn't been drunk yet
  for (let i = count; i < SCHEDULE.length; i++) {
    const ms = scheduleToMs(SCHEDULE[i].time);
    if (ms > now || i === count) return { index: i, ms };
  }
  return null;
}

// ── Notifications ─────────────────────────────────────────────────────────────
async function requestNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') { notifGranted = true; return; }
  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    notifGranted = perm === 'granted';
  }
}
function fireNotification(title, body) {
  if (!notifGranted) return;
  try {
    const n = new Notification(title, { body, icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14/assets/72x72/1f4a7.png' });
    setTimeout(() => n.close(), 8000);
  } catch {}
}

// ── Audio alarm ──────────────────────────────────────────────────────────────
function playAlarm() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const freqs = [523, 659, 784, 659, 784];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = f;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.18 + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.18 + 0.15);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.2);
    });
  } catch {}
}

// ── Glass SVG ────────────────────────────────────────────────────────────────
function updateGlass() {
  const pct = count / TOTAL;
  const fillHeight = pct * 144; // max inner height ~144
  const waterY = 154 - fillHeight;
  const waterFill = document.getElementById('water-fill');
  const wave = document.getElementById('wave');
  const glassPct = document.getElementById('glass-pct');

  if (waterFill) {
    waterFill.setAttribute('y', waterY);
    waterFill.setAttribute('height', fillHeight);
  }
  if (wave && fillHeight > 0) {
    const mid = waterY;
    wave.setAttribute('d', `M10,${mid} Q30,${mid - 4} 60,${mid} Q90,${mid + 4} 110,${mid}`);
  }
  if (glassPct) glassPct.textContent = Math.round(pct * 100) + '%';
}

// ── Dots row ─────────────────────────────────────────────────────────────────
function renderDots() {
  const row = document.getElementById('dots-row');
  if (!row) return;
  row.innerHTML = '';
  for (let i = 0; i < TOTAL; i++) {
    const d = document.createElement('button');
    d.className = 'dot' + (i < count ? ' filled' : '');
    d.setAttribute('aria-label', `Glass ${i + 1} ${i < count ? 'done' : 'pending'}`);
    d.onclick = () => toggleDot(i);
    row.appendChild(d);
  }
}
function toggleDot(i) {
  if (i < count) count = i;
  else count = i + 1;
  if (count < 0) count = 0;
  if (count > TOTAL) count = TOTAL;
  alarmFired = false;
  saveState();
  renderAll();
  showToast(count > 0 ? `Glass ${count} logged! 💧 ${count * ML_PER_GLASS}ml` : 'Reset to 0');
}

// ── Main log button ───────────────────────────────────────────────────────────
function logWater() {
  if (count >= TOTAL) return;
  count++;
  alarmFired = false;
  saveState();
  renderAll();
  // Bounce the count
  const el = document.getElementById('count');
  el.classList.remove('celebrate');
  void el.offsetWidth;
  el.classList.add('celebrate');
  showToast(count >= TOTAL ? '🎉 You hit your goal today!' : `Glass ${count} logged! 💧 ${count * ML_PER_GLASS}ml`);
  if (count >= TOTAL) {
    fireNotification('Goal reached! 🎉', "You drank all 9 glasses today. Amazing work!");
    playAlarm();
  }
}

// ── Schedule list ─────────────────────────────────────────────────────────────
function renderSchedule() {
  const list = document.getElementById('schedule-list');
  if (!list) return;
  const now = Date.now();
  let nextIdx = -1;
  // find next undrunk item
  if (count < TOTAL) {
    for (let i = count; i < SCHEDULE.length; i++) {
      if (scheduleToMs(SCHEDULE[i].time) > now) { nextIdx = i; break; }
    }
    if (nextIdx === -1 && count < SCHEDULE.length) nextIdx = count;
  }
  list.innerHTML = SCHEDULE.map((s, i) => {
    const done = i < count;
    const isNext = i === nextIdx;
    const [h, m] = s.time.split(':').map(Number);
    const d = new Date(); d.setHours(h, m);
    const label12 = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return `<li class="schedule-item${done ? ' done' : ''}${isNext ? ' next-up' : ''}">
      <span class="sch-dot"></span>
      <span class="sch-time">${label12}</span>
      <span class="sch-label">${s.label}</span>
      ${isNext ? '<span class="sch-badge">Next</span>' : ''}
      ${done ? '<span class="sch-badge" style="background:rgba(26,158,128,0.15);color:#5FCFB0;border-color:rgba(26,158,128,0.3);">✓</span>' : ''}
    </li>`;
  }).join('');
}

// ── Progress bar & count ──────────────────────────────────────────────────────
function renderProgress() {
  const pct = count / TOTAL * 100;
  const fill = document.getElementById('ml-fill');
  const mlText = document.getElementById('ml-text');
  const countEl = document.getElementById('count');
  const logBtn = document.getElementById('btn-log');
  if (fill) fill.style.width = pct + '%';
  if (mlText) mlText.textContent = `${count * ML_PER_GLASS} ml / ${TOTAL * ML_PER_GLASS} ml`;
  if (countEl) countEl.textContent = count;
  if (logBtn) logBtn.disabled = count >= TOTAL;
}

// ── Timer tick ────────────────────────────────────────────────────────────────
function timerTick() {
  const card = document.getElementById('timer-card');
  const countdown = document.getElementById('timer-countdown');
  const timerLabel = document.getElementById('timer-label');
  const timerSublabel = document.getElementById('timer-sublabel');
  const ring = document.getElementById('ring-progress');

  if (count >= TOTAL) {
    if (card) { card.className = 'timer-card done-state'; }
    if (countdown) countdown.textContent = '✓ Done!';
    if (timerLabel) timerLabel.textContent = 'Daily goal complete';
    if (timerSublabel) timerSublabel.textContent = 'Amazing job! See you tomorrow.';
    if (ring) ring.style.strokeDashoffset = '0';
    return;
  }

  const next = getNextScheduleItem();
  if (!next) {
    if (countdown) countdown.textContent = '00:00:00';
    if (timerLabel) timerLabel.textContent = 'Drink now!';
    return;
  }

  const now = Date.now();
  const msUntil = next.ms - now;

  // Total interval between this and previous slot
  let intervalMs = 90 * 60 * 1000; // default 90min
  if (next.index > 0) {
    intervalMs = scheduleToMs(SCHEDULE[next.index].time) - scheduleToMs(SCHEDULE[next.index - 1].time);
    if (intervalMs <= 0) intervalMs = 90 * 60 * 1000;
  }

  const ringCircumference = 157;
  const progress = Math.max(0, Math.min(1, 1 - msUntil / intervalMs));

  if (ring) ring.style.strokeDashoffset = ringCircumference * (1 - progress);

  if (msUntil <= 0) {
    // Time to drink!
    if (countdown) countdown.textContent = 'Drink now!';
    if (timerLabel) timerLabel.textContent = `Glass ${next.index + 1} of ${TOTAL}`;
    if (timerSublabel) timerSublabel.textContent = SCHEDULE[next.index].label;
    if (card) card.className = 'timer-card urgent';
    if (!alarmFired) {
      alarmFired = true;
      playAlarm();
      fireNotification('Time to drink water! 💧', `Glass ${next.index + 1}: ${SCHEDULE[next.index].label}`);
      showToast('⏰ Time to drink your water!');
    }
  } else {
    if (countdown) countdown.textContent = formatCountdown(msUntil);
    if (timerLabel) timerLabel.textContent = `Glass ${next.index + 1} in`;
    if (timerSublabel) timerSublabel.textContent = SCHEDULE[next.index].label;
    if (card) card.className = 'timer-card' + (msUntil < 5 * 60 * 1000 ? ' urgent' : '');
    alarmFired = false;
  }
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Render all ────────────────────────────────────────────────────────────────
function renderAll() {
  renderProgress();
  updateGlass();
  renderDots();
  renderSchedule();
  timerTick();
}

// ── Reset ─────────────────────────────────────────────────────────────────────
function resetAll() {
  if (!confirm('Reset your water count for today?')) return;
  count = 0;
  alarmFired = false;
  saveState();
  renderAll();
  showToast('Day reset. Stay hydrated! 💧');
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderAll();
  requestNotifications();

  // Timer ticks every second
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(timerTick, 1000);

  // Re-render schedule every minute (in case day changes)
  setInterval(() => { renderSchedule(); }, 60 * 1000);
});

// Expose to HTML inline handlers
window.logWater = logWater;
window.resetAll = resetAll;