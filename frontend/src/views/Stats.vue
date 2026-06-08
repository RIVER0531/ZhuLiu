<template>
  <div class="stats-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">你的专注旅程</h1>
        <p class="page-subtitle">坚持就是胜利</p>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else class="stats-content">
      <!-- 目标进度 -->
      <div class="card goal-card">
        <div class="goal-header">
          <div>
            <div class="card-label">今日目标</div>
            <div class="goal-value">
              {{ formatTime(stats.daily) }}
              <span class="goal-target">/ {{ formatTime(stats.daily_goal) }}</span>
            </div>
          </div>
          <div class="goal-ring" :class="{ complete: goalPercent >= 100 }">
            <svg viewBox="0 0 36 36">
              <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path class="ring-fill" :stroke-dasharray="`${Math.min(goalPercent, 100)}, 100`" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <span class="ring-text">{{ Math.round(goalPercent) }}%</span>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :class="{ complete: goalPercent >= 100 }" :style="{ width: Math.min(goalPercent, 100) + '%' }"></div>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="stat-grid">
        <div class="card stat-card">
          <div class="stat-icon blue">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">今日专注</div>
            <div class="stat-value">{{ formatTime(stats.daily) }}</div>
            <div class="stat-count">{{ stats.daily_count || 0 }} 次</div>
          </div>
        </div>

        <div class="card stat-card">
          <div class="stat-icon red">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">本月专注</div>
            <div class="stat-value">{{ formatTime(stats.monthly) }}</div>
          </div>
        </div>

        <div class="card stat-card">
          <div class="stat-icon green">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">累计专注</div>
            <div class="stat-value">{{ formatTime(stats.total) }}</div>
            <div class="stat-count">共 {{ stats.total_count || 0 }} 次</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from 'vue';

const API_BASE = '/api';

const stats = ref({
  daily: 0, monthly: 0, total: 0,
  daily_count: 0, total_count: 0, daily_goal: 120
});
const loading = ref(true);
const error = ref(null);

const goalPercent = computed(() => stats.value.daily_goal ? (stats.value.daily / stats.value.daily_goal) * 100 : 0);

const fetchStats = async () => {
  try {
    const response = await fetch(`${API_BASE}/stats`);
    if (!response.ok) throw new Error('获取失败');
    stats.value = await response.json();
  } catch (err) {
    console.error(err);
    error.value = '无法加载统计数据，请确保服务器正在运行';
  } finally {
    loading.value = false;
  }
};

const formatTime = (minutes) => {
  if (!minutes || minutes === 0) return '0 分钟';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} 小时 ${m} 分钟`;
  if (h > 0) return `${h} 小时`;
  return `${m} 分钟`;
};

onMounted(() => { fetchStats(); });
onActivated(() => { fetchStats(); });
</script>

<style scoped>
.stats-page {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 400;
  color: var(--md-on-surface);
  margin: 0;
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--md-on-surface-variant);
  margin-top: 4px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px;
  color: var(--md-on-surface-variant);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--md-outline-variant);
  border-top-color: var(--md-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  padding: 16px;
  background: var(--md-error-container);
  color: var(--md-error);
  border-radius: var(--md-radius-sm);
  text-align: center;
}

/* 目标卡片 */
.card {
  background: var(--md-surface);
  border-radius: var(--md-radius-md);
  padding: 24px;
  box-shadow: var(--md-shadow-1);
}

.goal-card {
  margin-bottom: 24px;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--md-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.goal-value {
  font-size: 28px;
  font-weight: 400;
  color: var(--md-on-surface);
}

.goal-target {
  font-size: 14px;
  color: var(--md-on-surface-variant);
}

.goal-ring {
  position: relative;
  width: 64px;
  height: 64px;
}

.goal-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: var(--md-surface-container);
  stroke-width: 3;
}

.ring-fill {
  fill: none;
  stroke: var(--md-primary);
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s ease;
}

.goal-ring.complete .ring-fill {
  stroke: #137333;
}

.ring-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  font-weight: 500;
  color: var(--md-on-surface);
}

/* 统计网格 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--md-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 28px;
  height: 28px;
}

.stat-icon.blue {
  background: #e8f0fe;
  color: #1a73e8;
}

.stat-icon.red {
  background: #fce8e6;
  color: #ea4335;
}

.stat-icon.green {
  background: #e6f4ea;
  color: #137333;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--md-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 20px;
  font-weight: 500;
  color: var(--md-on-surface);
}

.stat-count {
  font-size: 12px;
  color: var(--md-on-surface-variant);
}

@media (max-width: 600px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
