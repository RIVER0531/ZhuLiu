<template>
  <div class="pomodoro">
    <div class="pomodoro-layout">
      <section class="card timer-card">
        <h1 class="timer-title">番茄时钟</h1>
        <p class="phase-label">{{ phaseLabel }}</p>

        <div class="ring-container">
          <svg class="progress-ring" viewBox="0 0 120 120">
            <circle class="ring-bg" cx="60" cy="60" r="54"/>
            <circle class="ring-fill" :class="{ 'ring-fill--break': currentPhase === 'break' }" cx="60" cy="60" r="54" :style="{ strokeDashoffset }"/>
          </svg>
          <div class="ring-content">
            <span class="timer-value">{{ formattedMinutes }}</span><span class="timer-sep">:</span><span class="timer-value">{{ formattedSeconds }}</span>
          </div>
        </div>

        <div class="controls">
          <button v-if="!isRunning" class="btn btn--primary btn--lg" @click="start">
            <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/></svg>
            {{ currentPhase === 'work' ? '开始工作' : '开始休息' }}
          </button>
          <div v-else class="btn-group">
            <button class="btn btn--outline" @click="pause">暂停</button>
            <button class="btn btn--danger" @click="reset">重置</button>
          </div>
        </div>
      </section>

      <aside class="side-panel">
        <div class="card count-card">
          <div class="count-header"><span class="count-label">已完成番茄</span><span class="count-emoji">🍅</span></div>
          <div class="count-value">{{ completedPomodoros }}</div>
          <div v-if="todayPomodoros > 0" class="count-today">今日已完成 {{ todayPomodoros }} 个</div>
        </div>

        <div class="card settings-card">
          <div class="card-label">设置</div>
          <div class="setting-item">
            <label>工作时长</label>
            <select v-model.number="workMinutes" :disabled="isRunning">
              <option :value="15">15 分钟</option><option :value="25">25 分钟</option><option :value="30">30 分钟</option><option :value="45">45 分钟</option><option :value="60">60 分钟</option>
            </select>
          </div>
          <div class="setting-item">
            <label>休息时长</label>
            <select v-model.number="breakMinutes" :disabled="isRunning">
              <option :value="5">5 分钟</option><option :value="10">10 分钟</option><option :value="15">15 分钟</option>
            </select>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onActivated } from 'vue';

const STORAGE_KEY = 'pomodoro_state';

const workMinutes = ref(25);
const breakMinutes = ref(5);
const totalSeconds = ref(25 * 60);
const remainingSeconds = ref(25 * 60);
const isRunning = ref(false);
const currentPhase = ref('work');
const completedPomodoros = ref(0);
const todayPomodoros = ref(parseInt(localStorage.getItem('pomodoro_today') || '0', 10));

let timerInterval = null;
let completing = false;

const formattedMinutes = computed(() => String(Math.floor(remainingSeconds.value / 60)).padStart(2, '0'));
const formattedSeconds = computed(() => String(remainingSeconds.value % 60).padStart(2, '0'));
const phaseLabel = computed(() => currentPhase.value === 'work' ? '专注工作时间' : '休息放松时间');
const circumference = 2 * Math.PI * 54;
const strokeDashoffset = computed(() => circumference * (1 - remainingSeconds.value / totalSeconds.value));

function notify(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.png' });
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    remainingSeconds: remainingSeconds.value, totalSeconds: totalSeconds.value,
    currentPhase: currentPhase.value, completedPomodoros: completedPomodoros.value,
    isRunning: isRunning.value, savedAt: Date.now(),
  }));
}

function restoreState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const state = JSON.parse(saved);
    const elapsed = Math.floor((Date.now() - state.savedAt) / 1000);
    currentPhase.value = state.currentPhase;
    completedPomodoros.value = state.completedPomodoros;
    if (state.isRunning) {
      const newRemaining = state.remainingSeconds - elapsed;
      if (newRemaining > 0) { remainingSeconds.value = newRemaining; totalSeconds.value = state.totalSeconds; start(); }
      else { remainingSeconds.value = 0; totalSeconds.value = state.totalSeconds; completePhase(); }
    } else { remainingSeconds.value = state.remainingSeconds; totalSeconds.value = state.totalSeconds; }
  } catch { localStorage.removeItem(STORAGE_KEY); }
}

function start() {
  isRunning.value = true;
  saveState();
  timerInterval = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--;
      if (remainingSeconds.value % 10 === 0) saveState();
    } else { completePhase(); }
  }, 1000);
}

function pause() { isRunning.value = false; clearInterval(timerInterval); timerInterval = null; saveState(); }

function reset() {
  pause();
  currentPhase.value = 'work';
  totalSeconds.value = workMinutes.value * 60;
  remainingSeconds.value = totalSeconds.value;
  localStorage.removeItem(STORAGE_KEY);
}

function completePhase() {
  if (completing) return;
  completing = true;
  pause();

  if (currentPhase.value === 'work') {
    completedPomodoros.value++;
    todayPomodoros.value++;
    localStorage.setItem('pomodoro_today', String(todayPomodoros.value));
    beep();
    notify('番茄完成！🍅', '该休息一下了');
    currentPhase.value = 'break';
    totalSeconds.value = breakMinutes.value * 60;
  } else {
    notify('休息结束', '开始新的番茄钟吧');
    currentPhase.value = 'work';
    totalSeconds.value = workMinutes.value * 60;
  }
  remainingSeconds.value = totalSeconds.value;
  saveState();
  completing = false;
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch { /* ignore */ }
}

function checkNewDay() {
  const lastDate = localStorage.getItem('pomodoro_date');
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (lastDate !== today) {
    localStorage.setItem('pomodoro_date', today);
    localStorage.setItem('pomodoro_today', '0');
    todayPomodoros.value = 0;
    localStorage.removeItem(STORAGE_KEY);
  }
}

watch([workMinutes, breakMinutes], ([w, b]) => {
  if (!isRunning.value) {
    totalSeconds.value = (currentPhase.value === 'work' ? w : b) * 60;
    remainingSeconds.value = totalSeconds.value;
  }
});

checkNewDay();
restoreState();

onActivated(() => {
  checkNewDay();
});
</script>

<style scoped>
.pomodoro { max-width: 900px; margin: 0 auto; }
.pomodoro-layout { display: grid; grid-template-columns: 1fr 300px; gap: 32px; align-items: start; }

.card { background: var(--md-surface); border-radius: var(--md-radius-md); box-shadow: var(--md-shadow-1); animation: fadeIn 0.3s ease; }
.timer-card { text-align: center; padding: 48px 32px; }
.timer-title { font-size: 28px; font-weight: 400; color: var(--md-on-surface); letter-spacing: -0.5px; }
.phase-label { font-size: 14px; color: var(--md-on-surface-variant); margin: 8px 0 32px; }

.ring-container { position: relative; width: 240px; height: 240px; margin: 0 auto 48px; }
.progress-ring { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-bg { fill: none; stroke: var(--md-surface-container); stroke-width: 8; }
.ring-fill { fill: none; stroke: var(--md-primary); stroke-width: 8; stroke-linecap: round; stroke-dasharray: 339.292; transition: stroke-dashoffset 1s linear; }
.ring-fill--break { stroke: var(--md-tertiary); }
.ring-content { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; }
.timer-value { font-size: 64px; font-weight: 200; color: var(--md-on-surface); font-variant-numeric: tabular-nums; }
.timer-sep { font-size: 48px; font-weight: 200; color: var(--md-outline); margin: 0 4px; padding-bottom: 16px; }

.controls { margin-bottom: 16px; }
.btn { display: inline-flex; align-items: center; gap: 10px; padding: 12px 24px; border: none; border-radius: var(--md-radius-full); font-size: 14px; font-weight: 500; font-family: var(--md-font); cursor: pointer; transition: all var(--md-transition); }
.btn--lg { padding: 16px 48px; font-size: 16px; }
.btn--primary { background: var(--md-primary); color: var(--md-on-primary); box-shadow: var(--md-shadow-2); }
.btn--primary:hover { box-shadow: var(--md-shadow-3); transform: translateY(-1px); }
.btn--outline { border: 1px solid var(--md-outline); background: var(--md-surface); color: var(--md-primary); }
.btn--outline:hover { background: rgba(26,115,232,0.04); }
.btn--danger { background: var(--md-error); color: white; }
.btn--danger:hover { background: #d93025; }
.btn-group { display: flex; gap: 12px; justify-content: center; }

.side-panel { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 96px; }
.count-card { text-align: center; padding: 24px; }
.count-header { display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 16px; }
.count-label { font-size: 14px; color: var(--md-on-surface-variant); }
.count-emoji { font-size: 24px; }
.count-value { font-size: 56px; font-weight: 200; color: var(--md-primary); line-height: 1; }
.count-today { font-size: 13px; color: var(--md-on-surface-variant); margin-top: 12px; }

.settings-card { padding: 24px; }
.card-label { font-size: 13px; font-weight: 500; color: var(--md-on-surface-variant); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px; }
.setting-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.setting-item:last-child { margin-bottom: 0; }
.setting-item label { font-size: 14px; color: var(--md-on-surface); }
.setting-item select { padding: 8px 12px; border: 1px solid var(--md-outline); border-radius: var(--md-radius-xs); background: var(--md-surface); color: var(--md-on-surface); font-size: 14px; font-family: var(--md-font); min-width: 100px; cursor: pointer; outline: none; }
.setting-item select:focus { border-color: var(--md-primary); }

@media (max-width: 700px) { .pomodoro-layout { grid-template-columns: 1fr; } .side-panel { position: static; } }
</style>
