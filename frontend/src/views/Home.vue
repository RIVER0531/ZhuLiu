<template>
  <div class="home-page">
    <div class="home-grid">
      <!-- 左侧：计时器 -->
      <div class="timer-section">
        <div class="card timer-card">
          <div class="timer-header">
            <h1 class="timer-title">专注心流</h1>
            <p class="timer-subtitle" v-if="!timerStore.state.isRunning">准备好进入状态了吗？</p>
            <p class="timer-subtitle running" v-else>
              <span class="running-dot"></span>
              深度工作进行中...
            </p>
          </div>
          
          <!-- 标签选择 -->
          <div class="chip-group">
            <button 
              v-for="t in tags" :key="t" 
              class="chip" 
              :class="{ selected: currentTag === t }"
              @click="selectTag(t)"
              :disabled="timerStore.state.isRunning"
            >
              <span class="chip-icon">{{ tagIcons[t] }}</span>
              <span>{{ t }}</span>
            </button>
          </div>
          
          <!-- 计时器 -->
          <div class="timer-display">
            <div class="time-segment">
              <span class="time-value">{{ formattedHours }}</span>
              <span class="time-label">小时</span>
            </div>
            <span class="time-colon">:</span>
            <div class="time-segment">
              <span class="time-value">{{ formattedMinutes }}</span>
              <span class="time-label">分钟</span>
            </div>
            <span class="time-colon">:</span>
            <div class="time-segment">
              <span class="time-value">{{ formattedSeconds }}</span>
              <span class="time-label">秒</span>
            </div>
          </div>

          <!-- 控制按钮 -->
          <div class="controls">
            <button v-if="!timerStore.state.isRunning" class="btn-start" @click="startTimer">
              <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
              开始专注
            </button>
            <button v-else class="btn-stop" @click="stopTimer">
              <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd"></path></svg>
              停止并保存
            </button>
          </div>

          <p class="shortcut-hint">按 空格键 {{ timerStore.state.isRunning ? '停止' : '开始' }}</p>
          
          <!-- 消息 -->
          <div v-if="message" class="snackbar" :class="messageType">
            {{ message }}
          </div>
        </div>

        <p class="signature">Development from Peng Xiujiang</p>
      </div>

      <!-- 右侧：目标和统计 -->
      <div class="side-section">
        <!-- 今日目标 -->
        <div class="card goal-card">
          <div class="goal-header">
            <div>
              <div class="card-title">今日目标</div>
              <div class="goal-progress-text">
                {{ formatMinutes(stats.daily) }}
                <span class="goal-target">/ {{ formatMinutes(stats.daily_goal) }}</span>
              </div>
            </div>
            <div class="goal-badge" :class="{ complete: goalPercent >= 100 }">
              {{ Math.round(goalPercent) }}%
            </div>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :class="{ complete: goalPercent >= 100 }" 
              :style="{ width: Math.min(goalPercent, 100) + '%' }"
            ></div>
          </div>
          <button class="settings-link" @click="showGoalSettings = true">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            设置目标
          </button>
        </div>

        <!-- 快速统计 -->
        <div class="card stats-card">
          <div class="card-title">快速统计</div>
          <div class="stats-list">
            <div class="stat-row">
              <span class="stat-label">今日专注</span>
              <span class="stat-value">{{ formatMinutes(stats.daily) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">本月专注</span>
              <span class="stat-value">{{ formatMinutes(stats.monthly) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">累计专注</span>
              <span class="stat-value">{{ formatMinutes(stats.total) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 目标设置对话框 -->
    <div v-if="showGoalSettings" class="dialog-scrim" @click.self="showGoalSettings = false">
      <div class="dialog">
        <h3 class="dialog-title">设置专注目标</h3>
        <div class="dialog-content">
          <div class="text-field">
            <label>每日目标（分钟）</label>
            <input type="number" v-model.number="goalForm.daily_minutes" min="1" max="1440" />
          </div>
          <div class="text-field">
            <label>每周目标（分钟）</label>
            <input type="number" v-model.number="goalForm.weekly_minutes" min="1" max="10080" />
          </div>
        </div>
        <div class="dialog-actions">
          <button class="btn-cancel" @click="showGoalSettings = false">取消</button>
          <button class="btn-save" @click="saveGoals">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref, onActivated, onDeactivated } from 'vue';

const API_BASE = '/api';
const timerStore = inject('timerStore');

const tags = ['工作', '学习', '阅读', '运动', '创作', '其他'];
const tagIcons = {
  '工作': '💼', '学习': '📚', '阅读': '📖',
  '运动': '🏃', '创作': '🎨', '其他': '✨'
};

const currentTag = ref(timerStore.state.tag || '工作');
const message = ref('');
const messageType = ref('success');
const showGoalSettings = ref(false);
const stats = ref({ daily: 0, monthly: 0, total: 0, daily_goal: 120 });
const goalForm = ref({ daily_minutes: 120, weekly_minutes: 600 });

const formattedHours = computed(() => Math.floor(timerStore.state.elapsedSeconds / 3600).toString().padStart(2, '0'));
const formattedMinutes = computed(() => Math.floor((timerStore.state.elapsedSeconds % 3600) / 60).toString().padStart(2, '0'));
const formattedSeconds = computed(() => (timerStore.state.elapsedSeconds % 60).toString().padStart(2, '0'));
const goalPercent = computed(() => stats.value.daily_goal ? (stats.value.daily / stats.value.daily_goal) * 100 : 0);

const selectTag = (tag) => {
  if (!timerStore.state.isRunning) {
    currentTag.value = tag;
    timerStore.setTag(tag);
  }
};

const startTimer = () => {
  message.value = '';
  timerStore.start(currentTag.value);
};

const stopTimer = async () => {
  if (!timerStore.state.isRunning) return;
  const savedStartTime = timerStore.state.startTime;
  const { endTime, durationMinutes, tag } = timerStore.stop();
  
  if (durationMinutes > 0) {
    try {
      const response = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: new Date(savedStartTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          duration: durationMinutes,
          tag: tag
        })
      });
      if (response.ok) {
        message.value = `已保存 ${durationMinutes} 分钟的${tag}记录`;
        messageType.value = 'success';
        fetchStats();
      } else {
        message.value = '保存失败，请稍后重试';
        messageType.value = 'error';
      }
    } catch (err) {
      message.value = '连接服务器失败';
      messageType.value = 'error';
    }
  } else {
    message.value = '专注时间不足 1 分钟，未保存';
    messageType.value = 'warning';
  }
  setTimeout(() => { message.value = ''; }, 5000);
};

const formatMinutes = (mins) => {
  if (!mins) return '0 分钟';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h} 小时 ${m} 分钟`;
  if (h > 0) return `${h} 小时`;
  return `${m} 分钟`;
};

const fetchStats = async () => {
  try {
    const response = await fetch(`${API_BASE}/stats`);
    if (response.ok) stats.value = await response.json();
  } catch (err) { console.error(err); }
};

const fetchGoals = async () => {
  try {
    const response = await fetch(`${API_BASE}/goals`);
    if (response.ok) goalForm.value = await response.json();
  } catch (err) { console.error(err); }
};

const saveGoals = async () => {
  try {
    await fetch(`${API_BASE}/goals`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goalForm.value)
    });
    showGoalSettings.value = false;
    fetchStats();
  } catch (err) { console.error(err); }
};

const handleKeydown = (e) => {
  if (e.code === 'Space' && e.target === document.body) {
    e.preventDefault();
    timerStore.state.isRunning ? stopTimer() : startTimer();
  }
};

onActivated(() => {
  fetchStats();
  fetchGoals();
  document.addEventListener('keydown', handleKeydown);
});

onDeactivated(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.home-page {
  max-width: 1000px;
  margin: 0 auto;
}

.home-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 32px;
  align-items: start;
}

/* 计时器卡片 */
.timer-card {
  text-align: center;
  padding: 48px 32px;
}

.timer-header {
  margin-bottom: 32px;
}

.timer-title {
  font-size: 28px;
  font-weight: 400;
  color: var(--md-on-surface);
  margin: 0;
  letter-spacing: -0.5px;
}

.timer-subtitle {
  font-size: 14px;
  color: var(--md-on-surface-variant);
  margin-top: 8px;
}

.timer-subtitle.running {
  color: var(--md-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.running-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--md-primary);
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* 标签组 */
.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 40px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-radius-full);
  background: var(--md-surface);
  color: var(--md-on-surface-variant);
  font-size: 14px;
  font-weight: 500;
  font-family: var(--md-font);
  cursor: pointer;
  transition: all var(--md-transition);
}

.chip:hover:not(:disabled) {
  background: rgba(95, 99, 104, 0.08);
}

.chip.selected {
  background: var(--md-primary);
  color: white;
  border-color: var(--md-primary);
}

.chip-icon {
  font-size: 16px;
}

/* 计时器显示 */
.timer-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 48px;
}

.time-segment {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
}

.time-value {
  font-size: 72px;
  font-weight: 200;
  line-height: 1;
  color: var(--md-on-surface);
  font-variant-numeric: tabular-nums;
  font-family: var(--md-font);
}

.time-label {
  font-size: 12px;
  color: var(--md-on-surface-variant);
  margin-top: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.time-colon {
  font-size: 64px;
  font-weight: 200;
  color: var(--md-outline);
  padding-bottom: 32px;
}

/* 控制按钮 */
.controls {
  margin-bottom: 16px;
}

.btn-start,
.btn-stop {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 48px;
  border: none;
  border-radius: var(--md-radius-full);
  font-family: var(--md-font);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--md-transition);
}

.btn-start {
  background: var(--md-primary);
  color: white;
  box-shadow: var(--md-shadow-2);
}

.btn-start:hover {
  box-shadow: var(--md-shadow-3);
  transform: translateY(-1px);
}

.btn-stop {
  background: var(--md-error);
  color: white;
}

.btn-stop:hover {
  background: #d93025;
}

.btn-start svg,
.btn-stop svg {
  width: 20px;
  height: 20px;
}

.shortcut-hint {
  font-size: 12px;
  color: var(--md-on-surface-variant);
  opacity: 0.6;
}

.signature {
  text-align: center;
  font-size: 11px;
  color: var(--md-on-surface-variant);
  opacity: 0.4;
  margin-top: 16px;
  letter-spacing: 0.5px;
}

/* 消息条 */
.snackbar {
  margin-top: 24px;
  padding: 12px 20px;
  border-radius: var(--md-radius-sm);
  font-size: 14px;
}

.snackbar.success {
  background: #e6f4ea;
  color: #137333;
}

.snackbar.error {
  background: #fce8e6;
  color: #c5221f;
}

.snackbar.warning {
  background: #fef7e0;
  color: #b06000;
}

/* 侧边栏 */
.side-section {
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

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--md-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
}

/* 目标卡片 */
.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.goal-progress-text {
  font-size: 24px;
  font-weight: 400;
  color: var(--md-on-surface);
  margin-top: 4px;
}

.goal-target {
  font-size: 14px;
  color: var(--md-on-surface-variant);
}

.goal-badge {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--md-primary-container);
  color: var(--md-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 500;
}

.goal-badge.complete {
  background: #e6f4ea;
  color: #137333;
}

.settings-link {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  padding: 0;
  border: none;
  background: none;
  color: var(--md-primary);
  font-family: var(--md-font);
  font-size: 13px;
  cursor: pointer;
}

.settings-link:hover {
  text-decoration: underline;
}

/* 统计卡片 */
.stats-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: var(--md-on-surface-variant);
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--md-on-surface);
}

/* 对话框 */
.dialog-scrim {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--md-surface);
  border-radius: var(--md-radius-xl);
  padding: 32px;
  width: 400px;
  max-width: 90vw;
}

.dialog-title {
  font-size: 20px;
  font-weight: 500;
  color: var(--md-on-surface);
  margin-bottom: 24px;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.text-field label {
  display: block;
  font-size: 13px;
  color: var(--md-on-surface-variant);
  margin-bottom: 8px;
}

.text-field input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-radius-xs);
  font-family: var(--md-font);
  font-size: 16px;
  background: var(--md-surface);
  color: var(--md-on-surface);
  outline: none;
  transition: border-color var(--md-transition);
}

.text-field input:focus {
  border-color: var(--md-primary);
  border-width: 2px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
}

.btn-cancel {
  padding: 10px 24px;
  border: none;
  background: none;
  color: var(--md-primary);
  font-family: var(--md-font);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--md-radius-full);
}

.btn-cancel:hover {
  background: rgba(26, 115, 232, 0.08);
}

.btn-save {
  padding: 10px 24px;
  border: none;
  background: var(--md-primary);
  color: white;
  font-family: var(--md-font);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--md-radius-full);
}

.btn-save:hover {
  box-shadow: var(--md-shadow-1);
}

/* 响应式 */
@media (max-width: 800px) {
  .home-grid {
    grid-template-columns: 1fr;
  }
  
  .time-value {
    font-size: 56px;
  }
  
  .time-colon {
    font-size: 48px;
  }
}
</style>
