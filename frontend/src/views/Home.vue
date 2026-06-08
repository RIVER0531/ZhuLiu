<template>
  <div class="home">
    <div class="home-layout">
      <section class="timer-section">
        <div class="card timer-card">
          <div class="timer-header">
            <h1 class="timer-title">专注心流</h1>
            <p class="timer-subtitle" v-if="!timerStore.state.isRunning">准备好进入状态了吗，{{ username }}？</p>
            <p class="timer-subtitle timer-subtitle--running" v-else>
              <span class="running-dot"></span>{{ runningHint }}
            </p>
          </div>

          <div class="chip-group">
            <button v-for="tag in tags" :key="tag" class="chip" :class="{ 'chip--selected': currentTag === tag }" :disabled="timerStore.state.isRunning" @click="selectTag(tag)">
              <span class="chip-emoji">{{ tagIcons[tag] }}</span><span>{{ tag }}</span>
            </button>
          </div>

          <div class="timer-display">
            <div class="time-segment">
              <span class="time-value">{{ hh }}</span><span class="time-label">小时</span>
            </div>
            <span class="time-colon">:</span>
            <div class="time-segment">
              <span class="time-value">{{ mm }}</span><span class="time-label">分钟</span>
            </div>
            <span class="time-colon">:</span>
            <div class="time-segment">
              <span class="time-value">{{ ss }}</span><span class="time-label">秒</span>
            </div>
          </div>

          <div class="controls">
            <button v-if="!timerStore.state.isRunning" class="btn btn--primary btn--lg" @click="startTimer">
              <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/></svg>
              开始专注
            </button>
            <button v-else class="btn btn--danger btn--lg" @click="stopTimer">
              <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd"/></svg>
              停止并保存
            </button>
          </div>

          <p class="shortcut-hint">按 空格键 {{ timerStore.state.isRunning ? '停止' : '开始' }}</p>

          <Transition name="snackbar">
            <div v-if="message" class="snackbar" :class="`snackbar--${messageType}`">{{ message }}</div>
          </Transition>
        </div>

        <p class="signature">Development from Peng Xiujiang</p>
      </section>

      <aside class="side-section">
        <div class="card goal-card">
          <div class="goal-header">
            <div>
              <div class="card-label">今日目标</div>
              <div class="goal-progress-text">
                {{ formatDuration(stats.daily) }}<span class="goal-target"> / {{ formatDuration(stats.daily_goal) }}</span>
              </div>
            </div>
            <div class="goal-badge" :class="{ 'goal-badge--complete': goalPercent >= 100 }">{{ Math.round(goalPercent) }}%</div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :class="{ complete: goalPercent >= 100 }" :style="{ width: Math.min(goalPercent, 100) + '%' }"></div>
          </div>
          <button class="link-btn" @click="showGoalSettings = true">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            设置目标
          </button>
        </div>

        <div class="card stats-card">
          <div class="card-label">快速统计</div>
          <div class="stats-rows">
            <div class="stat-row"><span class="stat-row-label">今日专注</span><span class="stat-row-value">{{ formatDuration(stats.daily) }}</span></div>
            <div class="stat-row"><span class="stat-row-label">本周专注</span><span class="stat-row-value">{{ formatDuration(stats.weekly) }}</span></div>
            <div class="stat-row"><span class="stat-row-label">本月专注</span><span class="stat-row-value">{{ formatDuration(stats.monthly) }}</span></div>
            <div class="stat-row"><span class="stat-row-label">累计专注</span><span class="stat-row-value">{{ formatDuration(stats.total) }}</span></div>
          </div>
        </div>
      </aside>
    </div>

    <div v-if="heatmap.length" class="heatmap-section">
      <div class="card heatmap-card">
        <div class="heatmap-header">
          <span class="card-label">专注热力图</span>
          <span class="heatmap-total">过去一年 {{ heatmapTotal }} 小时</span>
        </div>
        <div class="heatmap-grid-wrapper">
          <div class="heatmap-months" :style="{ gridTemplateColumns: `repeat(${cookedWeeks.length}, 14px)` }">
            <span v-for="m in monthLabels" :key="m.key" :style="{ gridColumn: m.col }" class="heatmap-month">{{ m.label }}</span>
          </div>
          <div class="heatmap-body">
            <div class="heatmap-day-col">
              <span class="heatmap-day-label">一</span>
              <span class="heatmap-day-label">三</span>
              <span class="heatmap-day-label">五</span>
              <span class="heatmap-day-label">日</span>
            </div>
            <div class="heatmap-grid" :style="{ gridTemplateColumns: `repeat(${cookedWeeks.length}, 14px)` }">
              <template v-for="dow in 7" :key="dow">
                <div v-for="(week, wi) in cookedWeeks" :key="`${wi}-${dow}`"
                     class="heatmap-cell"
                     :class="cellClass(week[dow - 1])"
                     :title="cellTitle(week[dow - 1])">
                </div>
              </template>
            </div>
          </div>
          <div class="heatmap-legend">
            <span class="heatmap-legend-label">少</span>
            <span class="heatmap-legend-cell heatmap-legend-cell--l0"></span>
            <span class="heatmap-legend-cell heatmap-legend-cell--l1"></span>
            <span class="heatmap-legend-cell heatmap-legend-cell--l2"></span>
            <span class="heatmap-legend-cell heatmap-legend-cell--l3"></span>
            <span class="heatmap-legend-cell heatmap-legend-cell--l4"></span>
            <span class="heatmap-legend-label">多</span>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="dialog">
        <div v-if="showGoalSettings" class="dialog-scrim" @click.self="showGoalSettings = false">
          <div class="dialog">
            <h3 class="dialog-title">设置专注目标</h3>
            <div class="dialog-body">
              <div class="text-field">
                <label>每日目标（分钟）</label>
                <input type="number" v-model.number="goalForm.daily_minutes" min="1" max="1440"/>
              </div>
              <div class="text-field">
                <label>每周目标（分钟）</label>
                <input type="number" v-model.number="goalForm.weekly_minutes" min="1" max="10080"/>
              </div>
            </div>
            <div class="dialog-actions">
              <button class="btn btn--text" @click="showGoalSettings = false">取消</button>
              <button class="btn btn--primary" @click="saveGoals">保存</button>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="dialog">
        <div v-if="showNoteDialog" class="dialog-scrim" @click.self="saveNote">
          <div class="dialog">
            <h3 class="dialog-title">记录专注笔记</h3>
            <div class="dialog-body">
              <p class="note-hint">{{ savedDuration }} 分钟的{{ savedTag }}，做了什么？</p>
              <textarea ref="noteRef" v-model="noteText" class="note-textarea" rows="3" placeholder="写点什么..." @keydown.enter.ctrl="saveNote"></textarea>
            </div>
            <div class="dialog-actions">
              <button class="btn btn--text" @click="saveNote">跳过</button>
              <button class="btn btn--primary" @click="saveNote">保存</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, inject, ref, onActivated, onDeactivated } from 'vue';
import { api } from '../api';
import { authStore } from '../stores/auth';

const timerStore = inject('timerStore');

const tags = ['工作', '学习', '阅读', '运动', '创作', '其他'];
const tagIcons = { '工作': '💼', '学习': '📚', '阅读': '📖', '运动': '🏃', '创作': '🎨', '其他': '✨' };

const currentTag = ref(timerStore.state.tag || '工作');

const username = computed(() => authStore.state.user?.username || '');

const runningHints = {
  '工作': '深度工作进行中...',
  '学习': '正在汲取养分中...',
  '阅读': '正在充实自己中...',
  '运动': '该用户正在锻炼身体...',
  '创作': '天马行空中...',
  '其他': '正在专注中...',
};
const runningHint = computed(() => runningHints[currentTag.value] || '深度工作进行中...');

const message = ref('');
const messageType = ref('success');
const showGoalSettings = ref(false);
const showNoteDialog = ref(false);
const noteText = ref('');
const savedDuration = ref(0);
const savedTag = ref('');
const stats = ref({ daily: 0, weekly: 0, monthly: 0, total: 0, daily_goal: 120 });
const goalForm = ref({ daily_minutes: 120, weekly_minutes: 600 });
const heatmap = ref([]);

const hh = computed(() => String(Math.floor(timerStore.state.elapsedSeconds / 3600)).padStart(2, '0'));
const mm = computed(() => String(Math.floor((timerStore.state.elapsedSeconds % 3600) / 60)).padStart(2, '0'));
const ss = computed(() => String(timerStore.state.elapsedSeconds % 60).padStart(2, '0'));
const goalPercent = computed(() => stats.value.daily_goal ? (stats.value.daily / stats.value.daily_goal) * 100 : 0);
const heatmapTotal = computed(() => {
  const total = heatmap.value.reduce((s, c) => s + c.minutes, 0);
  return Math.round(total / 60);
});

const cookedWeeks = computed(() => {
  const data = heatmap.value;
  if (!data.length) return [];
  const first = new Date(data[0].date);
  const padStart = (first.getDay() + 6) % 7;
  const entries = [];
  for (let i = 0; i < padStart; i++) entries.push(null);
  data.forEach(d => entries.push(d));

  const weeks = [];
  for (let i = 0; i < entries.length; i += 7) {
    const w = [];
    for (let d = 0; d < 7; d++) w.push(entries[i + d] || null);
    weeks.push(w);
  }
  return weeks;
});

const cellLevel = (cell) => {
  if (!cell || !cell.minutes) return 'heatmap-cell--l0';
  if (cell.minutes < 30) return 'heatmap-cell--l1';
  if (cell.minutes < 60) return 'heatmap-cell--l2';
  if (cell.minutes < 120) return 'heatmap-cell--l3';
  return 'heatmap-cell--l4';
};

const cellClass = (cell) => cellLevel(cell);

const cellTitle = (cell) => {
  if (!cell) return '';
  return `${cell.date}: ${cell.minutes} 分钟`;
};

const monthLabels = computed(() => {
  if (!heatmap.value.length) return [];
  const labels = [];
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  let prevMonth = -1;
  const data = heatmap.value;
  const first = new Date(data[0].date);
  const padStart = (first.getDay() + 6) % 7;

  cookedWeeks.value.forEach((week, wi) => {
    const firstCell = week.find(c => c !== null);
    if (!firstCell) return;
    const m = new Date(firstCell.date).getMonth();
    if (m !== prevMonth) {
      labels.push({ key: `m${wi}`, col: wi + 1, label: monthNames[m] });
      prevMonth = m;
    }
  });
  return labels;
});

function selectTag(tag) {
  if (!timerStore.state.isRunning) { currentTag.value = tag; timerStore.setTag(tag); }
}

function startTimer() { message.value = ''; timerStore.start(currentTag.value); }

async function stopTimer() {
  if (!timerStore.state.isRunning) return;
  const savedStartTime = timerStore.state.startTime;
  const { endTime, durationMinutes, tag } = timerStore.stop();

  if (durationMinutes < 1) { showMessage('专注时间不足 1 分钟，未保存', 'warning'); return; }

  pendingSession.value = {
    startTime: new Date(savedStartTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    duration: durationMinutes,
    tag,
  };
  savedDuration.value = durationMinutes;
  savedTag.value = tag;
  noteText.value = '';
  showNoteDialog.value = true;
}

const pendingSession = ref(null);

async function saveNote() {
  showNoteDialog.value = false;
  if (!pendingSession.value) return;

  try {
    await api.createSession({ ...pendingSession.value, note: noteText.value.trim() || null });
    pendingSession.value = null;
    noteText.value = '';
    showMessage(`已保存 ${savedDuration.value} 分钟的${savedTag.value}记录`, 'success');
    await loadStats();
  } catch (err) { showMessage(err.message, 'error'); }
}

function showMessage(text, type) {
  message.value = text;
  messageType.value = type;
  setTimeout(() => { message.value = ''; }, 5000);
}

function formatDuration(mins) {
  if (!mins) return '0 分钟';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h} 小时 ${m} 分钟`;
  if (h > 0) return `${h} 小时`;
  return `${m} 分钟`;
}

async function loadStats() { try { stats.value = await api.getStats(); } catch { /* ignore */ } }
async function loadGoals() { try { goalForm.value = await api.getGoals(); } catch { /* ignore */ } }
async function loadHeatmap() { try { heatmap.value = await api.getHeatmap(365); } catch { /* ignore */ } }

async function saveGoals() {
  try { await api.updateGoals(goalForm.value); showGoalSettings.value = false; await loadStats(); } catch (err) { showMessage(err.message, 'error'); }
}

function handleKey(e) {
  if (e.code === 'Space' && e.target === document.body) {
    if (showGoalSettings.value || showNoteDialog.value) return;
    e.preventDefault();
    timerStore.state.isRunning ? stopTimer() : startTimer();
  }
}

onActivated(() => { loadStats(); loadGoals(); loadHeatmap(); document.addEventListener('keydown', handleKey); });
onDeactivated(() => { document.removeEventListener('keydown', handleKey); });
</script>

<style scoped>
.home { max-width: 1000px; margin: 0 auto; }

.home-layout { display: grid; grid-template-columns: 1fr 340px; gap: 32px; align-items: start; }

.card { background: var(--md-surface); border-radius: var(--md-radius-md); padding: 24px; box-shadow: var(--md-shadow-1); animation: fadeIn 0.3s ease; }

.timer-card { text-align: center; padding: 48px 32px; }
.timer-header { margin-bottom: 32px; }
.timer-title { font-size: 28px; font-weight: 400; color: var(--md-on-surface); letter-spacing: -0.5px; }
.timer-subtitle { font-size: 14px; color: var(--md-on-surface-variant); margin-top: 8px; }
.timer-subtitle--running { color: var(--md-primary); display: flex; align-items: center; justify-content: center; gap: 8px; }
.running-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--md-primary); animation: blink 1s infinite; }

.chip-group { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 40px; }
.chip { display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; border: 1px solid var(--md-outline); border-radius: var(--md-radius-full); background: var(--md-surface); color: var(--md-on-surface-variant); font-size: 14px; font-weight: 500; cursor: pointer; transition: all var(--md-transition); }
.chip:hover:not(:disabled) { background: rgba(95,99,104,0.08); }
.chip--selected { background: var(--md-primary); color: var(--md-on-primary); border-color: var(--md-primary); }
.chip:disabled { opacity: 0.6; cursor: not-allowed; }
.chip-emoji { font-size: 16px; line-height: 1; }

.timer-display { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 48px; }
.time-segment { display: flex; flex-direction: column; align-items: center; min-width: 100px; }
.time-value { font-size: 72px; font-weight: 200; line-height: 1; color: var(--md-on-surface); font-variant-numeric: tabular-nums; }
.time-label { font-size: 12px; color: var(--md-on-surface-variant); margin-top: 8px; text-transform: uppercase; letter-spacing: 1px; }
.time-colon { font-size: 64px; font-weight: 200; color: var(--md-outline); padding-bottom: 32px; }

.controls { margin-bottom: 16px; }
.btn { display: inline-flex; align-items: center; gap: 10px; border: none; border-radius: var(--md-radius-full); font-size: 14px; font-weight: 500; font-family: var(--md-font); cursor: pointer; transition: all var(--md-transition); padding: 10px 24px; }
.btn--lg { padding: 16px 48px; font-size: 16px; }
.btn--primary { background: var(--md-primary); color: var(--md-on-primary); box-shadow: var(--md-shadow-2); }
.btn--primary:hover { box-shadow: var(--md-shadow-3); transform: translateY(-1px); }
.btn--danger { background: var(--md-error); color: white; }
.btn--danger:hover { background: #d93025; }
.btn--text { background: none; color: var(--md-primary); }
.btn--text:hover { background: rgba(26,115,232,0.08); }

.shortcut-hint { font-size: 12px; color: var(--md-on-surface-variant); opacity: 0.6; }
.signature { text-align: center; font-size: 11px; color: var(--md-on-surface-variant); opacity: 0.4; margin-top: 16px; letter-spacing: 0.5px; }

.snackbar { margin-top: 24px; padding: 12px 20px; border-radius: var(--md-radius-sm); font-size: 14px; }
.snackbar--success { background: #e6f4ea; color: #137333; }
.snackbar--error { background: #fce8e6; color: #c5221f; }
.snackbar--warning { background: #fef7e0; color: #b06000; }
.snackbar-enter-active { animation: fadeIn 0.3s ease; }
.snackbar-leave-active { transition: opacity 0.2s; }
.snackbar-leave-to { opacity: 0; }

.side-section { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 96px; }
.card-label { font-size: 13px; font-weight: 500; color: var(--md-on-surface-variant); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
.goal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.goal-progress-text { font-size: 24px; font-weight: 400; color: var(--md-on-surface); margin-top: 4px; }
.goal-target { font-size: 14px; color: var(--md-on-surface-variant); }
.goal-badge { width: 56px; height: 56px; border-radius: 50%; background: var(--md-primary-container); color: var(--md-primary); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 500; flex-shrink: 0; }
.goal-badge--complete { background: #e6f4ea; color: #137333; }
.link-btn { display: inline-flex; align-items: center; gap: 6px; margin-top: 16px; padding: 0; border: none; background: none; color: var(--md-primary); font-size: 13px; font-weight: 500; cursor: pointer; }
.link-btn:hover { text-decoration: underline; }
.stats-rows { display: flex; flex-direction: column; gap: 16px; }
.stat-row { display: flex; justify-content: space-between; align-items: center; }
.stat-row-label { font-size: 14px; color: var(--md-on-surface-variant); }
.stat-row-value { font-size: 14px; font-weight: 500; color: var(--md-on-surface); }

.heatmap-section { margin-top: 32px; }
.heatmap-card { padding: 24px; }
.heatmap-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.heatmap-total { font-size: 13px; color: var(--md-on-surface-variant); }
.heatmap-grid-wrapper { overflow-x: auto; }

.heatmap-months { display: grid; gap: 2px; margin-bottom: 4px; margin-left: 24px; }
.heatmap-month { font-size: 10px; color: var(--md-on-surface-variant); }

.heatmap-body { display: flex; align-items: flex-start; }
.heatmap-day-col {
  display: grid;
  grid-template-rows: repeat(7, 14px);
  gap: 2px;
  width: 20px;
  flex-shrink: 0;
  margin-right: 4px;
}
.heatmap-day-label { font-size: 10px; color: var(--md-on-surface-variant); line-height: 14px; height: 14px; }
.heatmap-day-label:nth-child(1) { grid-row: 1; }
.heatmap-day-label:nth-child(2) { grid-row: 3; }
.heatmap-day-label:nth-child(3) { grid-row: 5; }
.heatmap-day-label:nth-child(4) { grid-row: 7; }

.heatmap-grid { display: grid; grid-template-rows: repeat(7, 14px); gap: 2px; }
.heatmap-cell { width: 14px; height: 14px; border-radius: 2px; }
.heatmap-cell--l0 { background: var(--md-surface-container); }
.heatmap-cell--l1 { background: #9be9a8; }
.heatmap-cell--l2 { background: #40c463; }
.heatmap-cell--l3 { background: #30a14e; }
.heatmap-cell--l4 { background: #216e39; }
[data-theme="dark"] .heatmap-cell--l0 { background: var(--md-surface-container); }
[data-theme="dark"] .heatmap-cell--l1 { background: #0e4429; }
[data-theme="dark"] .heatmap-cell--l2 { background: #006d32; }
[data-theme="dark"] .heatmap-cell--l3 { background: #26a641; }
[data-theme="dark"] .heatmap-cell--l4 { background: #39d353; }

.heatmap-legend { display: flex; align-items: center; gap: 4px; justify-content: flex-end; margin-top: 8px; }
.heatmap-legend-label { font-size: 11px; color: var(--md-on-surface-variant); }
.heatmap-legend-cell { width: 12px; height: 12px; border-radius: 2px; }
.heatmap-legend-cell--l0 { background: var(--md-surface-container); }
.heatmap-legend-cell--l1 { background: #9be9a8; }
.heatmap-legend-cell--l2 { background: #40c463; }
.heatmap-legend-cell--l3 { background: #30a14e; }
.heatmap-legend-cell--l4 { background: #216e39; }
[data-theme="dark"] .heatmap-legend-cell--l1 { background: #0e4429; }
[data-theme="dark"] .heatmap-legend-cell--l2 { background: #006d32; }
[data-theme="dark"] .heatmap-legend-cell--l3 { background: #26a641; }
[data-theme="dark"] .heatmap-legend-cell--l4 { background: #39d353; }

.dialog-scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.dialog { background: var(--md-surface); border-radius: var(--md-radius-xl); padding: 32px; width: 400px; max-width: 90vw; box-shadow: var(--md-shadow-3); }
.dialog-title { font-size: 20px; font-weight: 500; color: var(--md-on-surface); margin-bottom: 24px; }
.dialog-body { display: flex; flex-direction: column; gap: 20px; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }
.text-field { display: flex; flex-direction: column; gap: 8px; }
.text-field label { font-size: 13px; color: var(--md-on-surface-variant); }
.text-field input { padding: 12px 16px; border: 1px solid var(--md-outline); border-radius: var(--md-radius-xs); font-size: 16px; background: var(--md-surface); color: var(--md-on-surface); outline: none; font-family: var(--md-font); transition: border-color var(--md-transition); }
.text-field input:focus { border-color: var(--md-primary); border-width: 2px; padding: 11px 15px; }
.note-hint { font-size: 14px; color: var(--md-on-surface-variant); }
.note-textarea { padding: 12px; border: 1px solid var(--md-outline); border-radius: var(--md-radius-sm); font-size: 14px; font-family: var(--md-font); background: var(--md-surface); color: var(--md-on-surface); outline: none; resize: vertical; }
.note-textarea:focus { border-color: var(--md-primary); }
.dialog-enter-active { animation: fadeIn 0.2s ease; }
.dialog-leave-active { transition: opacity 0.15s ease; }
.dialog-leave-to { opacity: 0; }

@media (max-width: 800px) {
  .home-layout { grid-template-columns: 1fr; }
  .side-section { position: static; }
  .time-value { font-size: 56px; }
  .time-colon { font-size: 48px; }
  .heatmap-grid-wrapper { max-width: calc(100vw - 48px); }
}
</style>
