<template>
  <div class="stats">
    <div class="page-header">
      <div>
        <h1 class="page-title">你的专注旅程</h1>
        <p class="page-subtitle">坚持就是胜利</p>
      </div>
      <div class="period-toggle">
        <button class="period-btn" :class="{ 'period-btn--active': period === 'day' }" @click="switchPeriod('day')">日</button>
        <button class="period-btn" :class="{ 'period-btn--active': period === 'week' }" @click="switchPeriod('week')">周</button>
        <button class="period-btn" :class="{ 'period-btn--active': period === 'month' }" @click="switchPeriod('month')">月</button>
      </div>
    </div>

    <div v-if="loading" class="loading-container"><div class="loading-spinner"></div><p>加载中...</p></div>
    <div v-else-if="error" class="error-banner">{{ error }}<button class="btn btn--text btn--sm" @click="loadStats">重试</button></div>

    <div v-else class="stats-content">
      <div class="card goal-card">
        <div class="goal-header">
          <div>
            <div class="card-label">{{ periodLabel }}目标</div>
            <div class="goal-value">
              {{ formatDuration(currentValue) }}<span class="goal-target"> / {{ formatDuration(currentGoal) }}</span>
            </div>
          </div>
          <div class="goal-ring" :class="{ 'goal-ring--complete': goalPercent >= 100 }">
            <svg viewBox="0 0 36 36">
              <path class="goal-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
              <path class="goal-ring-fill" :stroke-dasharray="`${Math.min(goalPercent, 100)}, 100`" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            </svg>
            <span class="goal-ring-text">{{ Math.round(goalPercent) }}%</span>
          </div>
        </div>
        <div class="progress-bar"><div class="progress-fill" :class="{ complete: goalPercent >= 100 }" :style="{ width: Math.min(goalPercent, 100) + '%' }"></div></div>
        <div v-if="period !== 'day'" class="goal-sub">{{ currentCount }} 次专注</div>
      </div>

      <div class="stat-grid">
        <div class="card stat-card">
          <div class="stat-icon stat-icon--blue">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="28" height="28"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div class="stat-info"><div class="stat-label">今日专注</div><div class="stat-value">{{ formatDuration(stats.daily) }}</div><div class="stat-sub">{{ stats.daily_count || 0 }} 次</div></div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon stat-icon--red">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="28" height="28"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <div class="stat-info"><div class="stat-label">本月专注</div><div class="stat-value">{{ formatDuration(stats.monthly) }}</div></div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon stat-icon--green">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="28" height="28"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
          </div>
          <div class="stat-info"><div class="stat-label">累计专注</div><div class="stat-value">{{ formatDuration(stats.total) }}</div><div class="stat-sub">共 {{ stats.total_count || 0 }} 次</div></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onActivated } from 'vue';
import { api } from '../api';

const period = ref('month');
const stats = ref({ daily: 0, weekly: 0, monthly: 0, total: 0, daily_count: 0, total_count: 0, weekly_count: 0, daily_goal: 120, weekly_goal: 600 });
const loading = ref(true);
const error = ref(null);

const periodLabel = computed(() => ({ day: '今日', week: '本周', month: '本月' })[period.value]);
const currentValue = computed(() => stats.value[period.value === 'day' ? 'daily' : period.value === 'week' ? 'weekly' : 'monthly'] || 0);
const currentGoal = computed(() => period.value === 'day' ? stats.value.daily_goal : stats.value.weekly_goal);
const currentCount = computed(() => period.value === 'week' ? stats.value.weekly_count : period.value === 'month' ? stats.value.monthly_count : stats.value.daily_count);
const goalPercent = computed(() => currentGoal.value ? (currentValue.value / currentGoal.value) * 100 : 0);

async function loadStats() {
  loading.value = true; error.value = null;
  try { stats.value = await api.getStats(period.value); } catch (err) { error.value = '无法加载统计数据，请确保服务器正在运行'; } finally { loading.value = false; }
}

function switchPeriod(p) { period.value = p; loadStats(); }

function formatDuration(mins) {
  if (!mins) return '0 分钟';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h} 小时 ${m} 分钟`;
  if (h > 0) return `${h} 小时`;
  return `${m} 分钟`;
}

onActivated(() => loadStats());
</script>

<style scoped>
.stats { max-width: 900px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
.page-title { font-size: 28px; font-weight: 400; color: var(--md-on-surface); letter-spacing: -0.5px; }
.page-subtitle { font-size: 14px; color: var(--md-on-surface-variant); margin-top: 4px; }

.period-toggle { display: flex; border: 1px solid var(--md-outline); border-radius: var(--md-radius-full); overflow: hidden; }
.period-btn { padding: 8px 22px; border: none; background: var(--md-surface); color: var(--md-on-surface-variant); font-size: 14px; font-weight: 500; font-family: var(--md-font); cursor: pointer; transition: all var(--md-transition); }
.period-btn:not(:last-child) { border-right: 1px solid var(--md-outline); }
.period-btn--active { background: var(--md-primary); color: var(--md-on-primary); }
.period-btn:hover:not(.period-btn--active) { background: rgba(95,99,104,0.08); }

.loading-container { display: flex; flex-direction: column; align-items: center; padding: 64px; color: var(--md-on-surface-variant); }
.error-banner { padding: 16px 20px; background: var(--md-error-container); color: var(--md-error); border-radius: var(--md-radius-sm); display: flex; justify-content: space-between; align-items: center; }

.card { background: var(--md-surface); border-radius: var(--md-radius-md); box-shadow: var(--md-shadow-1); animation: fadeIn 0.3s ease; }
.goal-card { padding: 24px; margin-bottom: 24px; }
.goal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.card-label { font-size: 13px; font-weight: 500; color: var(--md-on-surface-variant); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
.goal-value { font-size: 28px; font-weight: 400; color: var(--md-on-surface); }
.goal-target { font-size: 14px; color: var(--md-on-surface-variant); }
.goal-ring { position: relative; width: 64px; height: 64px; flex-shrink: 0; }
.goal-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.goal-ring-bg { fill: none; stroke: var(--md-surface-container); stroke-width: 3; }
.goal-ring-fill { fill: none; stroke: var(--md-primary); stroke-width: 3; stroke-linecap: round; transition: stroke-dasharray 0.3s ease; }
.goal-ring--complete .goal-ring-fill { stroke: var(--md-tertiary); }
.goal-ring-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 14px; font-weight: 500; color: var(--md-on-surface); }
.goal-sub { font-size: 13px; color: var(--md-on-surface-variant); margin-top: 12px; }

.stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.stat-card { display: flex; align-items: center; gap: 20px; padding: 24px; }
.stat-icon { width: 56px; height: 56px; border-radius: var(--md-radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-icon--blue { background: #e8f0fe; color: #1a73e8; }
.stat-icon--red { background: #fce8e6; color: #ea4335; }
.stat-icon--green { background: #e6f4ea; color: #137333; }
.stat-info { display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 12px; font-weight: 500; color: var(--md-on-surface-variant); text-transform: uppercase; letter-spacing: 0.5px; }
.stat-value { font-size: 20px; font-weight: 500; color: var(--md-on-surface); }
.stat-sub { font-size: 12px; color: var(--md-on-surface-variant); }

.btn { display: inline-flex; align-items: center; padding: 8px 16px; border: none; border-radius: var(--md-radius-full); font-size: 13px; font-weight: 500; font-family: var(--md-font); cursor: pointer; }
.btn--text { background: none; color: var(--md-error); }
.btn--text:hover { background: rgba(197,34,31,0.08); }

@media (max-width: 600px) {
  .stat-grid { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
}
</style>
