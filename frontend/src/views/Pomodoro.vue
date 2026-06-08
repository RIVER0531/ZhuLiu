<template>
  <div class="pomodoro-page">
    <div class="pomodoro-layout">
      <!-- 左侧：计时器 -->
      <div class="card timer-card">
        <h1 class="timer-title">番茄时钟</h1>
        <p class="phase-label">{{ phaseLabel }}</p>

        <!-- 环形进度 -->
        <div class="ring-container">
          <svg class="progress-ring" viewBox="0 0 120 120">
            <circle class="ring-bg" cx="60" cy="60" r="54" />
            <circle 
              class="ring-fill" 
              :class="{ break: currentPhase === 'break' }" 
              cx="60" cy="60" r="54" 
              :style="{ strokeDashoffset: strokeDashoffset }" 
            />
          </svg>
          <div class="ring-content">
            <span class="timer-value">{{ formattedMinutes }}</span>
            <span class="timer-sep">:</span>
            <span class="timer-value">{{ formattedSeconds }}</span>
          </div>
        </div>

        <!-- 控制按钮 -->
        <div class="controls">
          <button v-if="!isRunning" class="btn-start" @click="start">
            <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
            {{ currentPhase === 'work' ? '开始工作' : '开始休息' }}
          </button>
          <div v-else class="btn-group">
            <button class="btn-pause" @click="pause">
              <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
              暂停
            </button>
            <button class="btn-reset" @click="reset">
              <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"></path></svg>
              重置
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：设置和统计 -->
      <div class="side-panel">
        <!-- 番茄计数 -->
        <div class="card count-card">
          <div class="count-header">
            <span class="count-label">已完成番茄</span>
            <span class="count-emoji">🍅</span>
          </div>
          <div class="count-value">{{ completedPomodoros }}</div>
          <div v-if="todayPomodoros > 0" class="count-today">
            今日已完成 {{ todayPomodoros }} 个
          </div>
        </div>

        <!-- 设置 -->
        <div class="card settings-card">
          <div class="card-label">设置</div>
          <div class="setting-item">
            <label>工作时长</label>
            <select v-model.number="workMinutes" :disabled="isRunning">
              <option :value="15">15 分钟</option>
              <option :value="25">25 分钟</option>
              <option :value="30">30 分钟</option>
              <option :value="45">45 分钟</option>
              <option :value="60">60 分钟</option>
            </select>
          </div>
          <div class="setting-item">
            <label>休息时长</label>
            <select v-model.number="breakMinutes" :disabled="isRunning">
              <option :value="5">5 分钟</option>
              <option :value="10">10 分钟</option>
              <option :value="15">15 分钟</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const POMODORO_STATE_KEY = 'pomodoro_state';

const workMinutes = ref(25);
const breakMinutes = ref(5);
const totalSeconds = ref(25 * 60);
const remainingSeconds = ref(25 * 60);
const isRunning = ref(false);
const currentPhase = ref('work');
const completedPomodoros = ref(0);
const todayPomodoros = ref(parseInt(localStorage.getItem('pomodoro_today') || '0'));

let timerInterval = null;
let isCompleting = false;

const formattedMinutes = computed(() => Math.floor(remainingSeconds.value / 60).toString().padStart(2, '0'));
const formattedSeconds = computed(() => (remainingSeconds.value % 60).toString().padStart(2, '0'));
const phaseLabel = computed(() => currentPhase.value === 'work' ? '专注工作时间' : '休息放松时间');
const circumference = 2 * Math.PI * 54;
const strokeDashoffset = computed(() => circumference * (1 - remainingSeconds.value / totalSeconds.value));

const saveState = () => {
  localStorage.setItem(POMODORO_STATE_KEY, JSON.stringify({
    remainingSeconds: remainingSeconds.value,
    totalSeconds: totalSeconds.value,
    currentPhase: currentPhase.value,
    completedPomodoros: completedPomodoros.value,
    isRunning: isRunning.value,
    savedAt: Date.now()
  }));
};

const restoreState = () => {
  const saved = localStorage.getItem(POMODORO_STATE_KEY);
  if (!saved) return;
  
  try {
    const state = JSON.parse(saved);
    const elapsed = Math.floor((Date.now() - state.savedAt) / 1000);
    
    currentPhase.value = state.currentPhase;
    completedPomodoros.value = state.completedPomodoros;
    
    if (state.isRunning) {
      const newRemaining = state.remainingSeconds - elapsed;
      if (newRemaining > 0) {
        remainingSeconds.value = newRemaining;
        totalSeconds.value = state.totalSeconds;
        start();
      } else {
        remainingSeconds.value = 0;
        totalSeconds.value = state.totalSeconds;
        completePhase();
      }
    } else {
      remainingSeconds.value = state.remainingSeconds;
      totalSeconds.value = state.totalSeconds;
    }
  } catch (e) {
    localStorage.removeItem(POMODORO_STATE_KEY);
  }
};

const start = () => {
  isRunning.value = true;
  saveState();
  timerInterval = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--;
      if (remainingSeconds.value % 10 === 0) saveState();
    } else {
      completePhase();
    }
  }, 1000);
};

const pause = () => {
  isRunning.value = false;
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  saveState();
};

const reset = () => {
  pause();
  currentPhase.value = 'work';
  totalSeconds.value = workMinutes.value * 60;
  remainingSeconds.value = totalSeconds.value;
  localStorage.removeItem(POMODORO_STATE_KEY);
};

const completePhase = () => {
  if (isCompleting) return;
  isCompleting = true;
  
  pause();
  if (currentPhase.value === 'work') {
    completedPomodoros.value++;
    todayPomodoros.value++;
    localStorage.setItem('pomodoro_today', todayPomodoros.value.toString());
    playSound();
    currentPhase.value = 'break';
    totalSeconds.value = breakMinutes.value * 60;
  } else {
    currentPhase.value = 'work';
    totalSeconds.value = workMinutes.value * 60;
  }
  remainingSeconds.value = totalSeconds.value;
  saveState();
  
  isCompleting = false;
};

const playSound = () => {
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
  } catch (e) { console.log('无法播放提示音'); }
};

const checkNewDay = () => {
  const lastDate = localStorage.getItem('pomodoro_date');
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (lastDate !== today) {
    localStorage.setItem('pomodoro_date', today);
    localStorage.setItem('pomodoro_today', '0');
    todayPomodoros.value = 0;
    localStorage.removeItem(POMODORO_STATE_KEY);
  }
};

checkNewDay();
restoreState();
</script>

<style scoped>
.pomodoro-page {
  max-width: 900px;
  margin: 0 auto;
}

.pomodoro-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 32px;
  align-items: start;
}

/* 计时器卡片 */
.timer-card {
  text-align: center;
  padding: 48px 32px;
  background: var(--md-surface);
  border-radius: var(--md-radius-md);
  box-shadow: var(--md-shadow-1);
}

.timer-title {
  font-size: 28px;
  font-weight: 400;
  color: var(--md-on-surface);
  margin: 0;
}

.phase-label {
  font-size: 14px;
  color: var(--md-on-surface-variant);
  margin-top: 8px;
  margin-bottom: 32px;
}

/* 环形进度 */
.ring-container {
  position: relative;
  width: 240px;
  height: 240px;
  margin: 0 auto 48px;
}

.progress-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: var(--md-surface-container);
  stroke-width: 8;
}

.ring-fill {
  fill: none;
  stroke: var(--md-primary);
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 339.292;
  transition: stroke-dashoffset 1s linear;
}

.ring-fill.break {
  stroke: #137333;
}

.ring-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
}

.timer-value {
  font-size: 64px;
  font-weight: 200;
  color: var(--md-on-surface);
  font-variant-numeric: tabular-nums;
  font-family: var(--md-font);
}

.timer-sep {
  font-size: 48px;
  font-weight: 200;
  color: var(--md-outline);
  margin: 0 4px;
  padding-bottom: 16px;
}

/* 控制按钮 */
.controls {
  margin-bottom: 16px;
}

.btn-start {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 48px;
  border: none;
  border-radius: var(--md-radius-full);
  background: var(--md-primary);
  color: white;
  font-family: var(--md-font);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: var(--md-shadow-2);
  transition: all var(--md-transition);
}

.btn-start:hover {
  box-shadow: var(--md-shadow-3);
  transform: translateY(-1px);
}

.btn-start svg {
  width: 20px;
  height: 20px;
}

.btn-group {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-pause,
.btn-reset {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: var(--md-radius-full);
  font-family: var(--md-font);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--md-transition);
}

.btn-pause {
  border: 1px solid var(--md-outline);
  background: var(--md-surface);
  color: var(--md-primary);
}

.btn-pause:hover {
  background: rgba(26, 115, 232, 0.04);
}

.btn-reset {
  border: none;
  background: var(--md-error);
  color: white;
}

.btn-reset:hover {
  background: #d93025;
}

/* 侧边栏 */
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  background: var(--md-surface);
  border-radius: var(--md-radius-md);
  padding: 24px;
  box-shadow: var(--md-shadow-1);
}

/* 番茄计数 */
.count-card {
  text-align: center;
}

.count-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.count-label {
  font-size: 14px;
  color: var(--md-on-surface-variant);
}

.count-emoji {
  font-size: 24px;
}

.count-value {
  font-size: 56px;
  font-weight: 200;
  color: var(--md-primary);
  line-height: 1;
}

.count-today {
  font-size: 13px;
  color: var(--md-on-surface-variant);
  margin-top: 12px;
}

/* 设置 */
.card-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--md-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 20px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  font-size: 14px;
  color: var(--md-on-surface);
}

.setting-item select {
  padding: 8px 12px;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-radius-xs);
  background: var(--md-surface);
  color: var(--md-on-surface);
  font-family: var(--md-font);
  font-size: 14px;
  min-width: 100px;
}

.setting-item select:focus {
  outline: none;
  border-color: var(--md-primary);
}

@media (max-width: 700px) {
  .pomodoro-layout {
    grid-template-columns: 1fr;
  }
}
</style>
