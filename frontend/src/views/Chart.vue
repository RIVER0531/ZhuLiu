<template>
  <div class="chart-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">数据洞察</h1>
        <p class="page-subtitle">追踪你的专注趋势</p>
      </div>
      <div class="segmented-button">
        <button 
          class="segment" 
          :class="{ selected: period === 7 }" 
          @click="changePeriod(7)"
        >7 天</button>
        <button 
          class="segment" 
          :class="{ selected: period === 30 }" 
          @click="changePeriod(30)"
        >30 天</button>
      </div>
    </div>

    <div class="content-grid">
      <!-- 左侧：图表 -->
      <div class="chart-section">
        <div class="card">
          <div class="card-title">专注趋势</div>
          <div class="chart-wrapper">
            <div class="chart-y-axis">
              <span>{{ maxMinutes }}分钟</span>
              <span>{{ Math.round(maxMinutes / 2) }}分钟</span>
              <span>0</span>
            </div>
            <div class="chart-area">
              <div class="chart-bars">
                <div v-for="(item, index) in chartData" :key="index" class="chart-bar-group">
                  <div class="chart-bar-wrapper">
                    <div 
                      class="chart-bar" 
                      :style="{ height: getBarHeight(item.minutes) + '%' }"
                      :class="{ today: isToday(item.date) }"
                    ></div>
                    <span class="chart-tooltip">{{ item.minutes }}分钟</span>
                  </div>
                  <span class="chart-label">{{ formatDate(item.date) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 统计摘要 -->
        <div class="summary-row">
          <div class="card summary-card">
            <div class="summary-icon blue">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <div class="summary-label">总计时长</div>
              <div class="summary-value">{{ formatMinutes(totalMinutes) }}</div>
            </div>
          </div>
          <div class="card summary-card">
            <div class="summary-icon green">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            </div>
            <div>
              <div class="summary-label">总计次数</div>
              <div class="summary-value">{{ totalCount }} 次</div>
            </div>
          </div>
          <div class="card summary-card">
            <div class="summary-icon purple">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            </div>
            <div>
              <div class="summary-label">日均时长</div>
              <div class="summary-value">{{ formatMinutes(avgMinutes) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：标签分布 -->
      <div class="tag-section">
        <div class="card">
          <div class="card-title">标签分布</div>
          <div v-if="tagStats.length === 0" class="empty-tags">
            <p>暂无数据</p>
          </div>
          <div v-else class="tag-list">
            <div v-for="tag in tagStats" :key="tag.tag" class="tag-item">
              <div class="tag-header">
                <span class="tag-name">{{ tag.tag }}</span>
                <span class="tag-value">{{ formatMinutes(tag.total_minutes) }}</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: getTagPercent(tag.total_minutes) + '%' }"
                ></div>
              </div>
              <div class="tag-count">{{ tag.session_count }} 次</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from 'vue';

const API_BASE = '/api';
const period = ref(7);
const chartData = ref([]);
const tagStats = ref([]);

const maxTagMinutes = computed(() => {
  if (tagStats.value.length === 0) return 1;
  return Math.max(...tagStats.value.map(t => t.total_minutes), 1);
});

const maxMinutes = computed(() => {
  if (chartData.value.length === 0) return 10;
  const max = Math.max(...chartData.value.map(d => d.minutes), 1);
  return Math.ceil(max / 10) * 10 || 10;
});

const totalMinutes = computed(() => chartData.value.reduce((sum, d) => sum + d.minutes, 0));
const totalCount = computed(() => chartData.value.reduce((sum, d) => sum + d.count, 0));
const avgMinutes = computed(() => chartData.value.length ? Math.round(totalMinutes.value / chartData.value.length) : 0);

const getBarHeight = (minutes) => {
  if (!maxMinutes.value) return 0;
  return (minutes / maxMinutes.value) * 100;
};

const getTagPercent = (minutes) => {
  if (!maxTagMinutes.value) return 0;
  return (minutes / maxTagMinutes.value) * 100;
};

const isToday = (dateStr) => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return dateStr === today;
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const formatMinutes = (mins) => {
  if (!mins) return '0 分钟';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h} 小时 ${m} 分`;
  if (h > 0) return `${h} 小时`;
  return `${m} 分钟`;
};

const changePeriod = (days) => {
  period.value = days;
  fetchChart();
};

const fetchChart = async () => {
  try {
    const response = await fetch(`${API_BASE}/chart?days=${period.value}`);
    if (response.ok) chartData.value = await response.json();
  } catch (err) { console.error(err); }
};

const fetchTags = async () => {
  try {
    const response = await fetch(`${API_BASE}/tags`);
    if (response.ok) tagStats.value = await response.json();
  } catch (err) { console.error(err); }
};

onMounted(() => { fetchChart(); fetchTags(); });
onActivated(() => { fetchChart(); fetchTags(); });
</script>

<style scoped>
.chart-page {
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
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

/* 分段按钮 */
.segmented-button {
  display: flex;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-radius-full);
  overflow: hidden;
}

.segment {
  padding: 10px 28px;
  border: none;
  background: var(--md-surface);
  color: var(--md-on-surface);
  font-family: var(--md-font);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--md-transition);
}

.segment:first-child {
  border-right: 1px solid var(--md-outline);
}

.segment.selected {
  background: var(--md-primary);
  color: white;
}

.segment:hover:not(.selected) {
  background: rgba(95, 99, 104, 0.08);
}

/* 内容网格 */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}

/* 卡片 */
.card {
  background: var(--md-surface);
  border-radius: var(--md-radius-md);
  padding: 24px;
  box-shadow: var(--md-shadow-1);
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--md-on-surface);
  margin-bottom: 24px;
}

/* 图表 */
.chart-wrapper {
  display: flex;
  gap: 16px;
  height: 240px;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 60px;
  text-align: right;
  font-size: 12px;
  color: var(--md-on-surface-variant);
  padding-bottom: 24px;
}

.chart-area {
  flex: 1;
  display: flex;
  align-items: flex-end;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  width: 100%;
  height: 100%;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--md-outline-variant);
}

.chart-bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  position: relative;
}

.chart-bar-wrapper {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
}

.chart-bar {
  width: 70%;
  max-width: 48px;
  background: var(--md-primary);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.3s ease;
  opacity: 0.6;
  cursor: pointer;
}

.chart-bar:hover {
  opacity: 1;
}

.chart-bar.today {
  opacity: 1;
  background: var(--md-primary);
}

.chart-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--md-on-surface);
  color: var(--md-surface);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--md-transition);
  margin-bottom: 4px;
}

.chart-bar:hover + .chart-tooltip,
.chart-bar-wrapper:hover .chart-tooltip {
  opacity: 1;
}

.chart-label {
  font-size: 11px;
  color: var(--md-on-surface-variant);
  margin-top: 8px;
  position: absolute;
  bottom: -24px;
}

/* 摘要卡片 */
.summary-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.summary-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--md-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-icon svg {
  width: 24px;
  height: 24px;
}

.summary-icon.blue {
  background: #e8f0fe;
  color: #1a73e8;
}

.summary-icon.green {
  background: #e6f4ea;
  color: #137333;
}

.summary-icon.purple {
  background: #f3e8fd;
  color: #8430ce;
}

.summary-label {
  font-size: 12px;
  color: var(--md-on-surface-variant);
  margin-bottom: 4px;
}

.summary-value {
  font-size: 18px;
  font-weight: 500;
  color: var(--md-on-surface);
}

/* 标签分布 */
.tag-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tag-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tag-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--md-on-surface);
}

.tag-value {
  font-size: 14px;
  color: var(--md-primary);
  font-weight: 500;
}

.tag-count {
  font-size: 12px;
  color: var(--md-on-surface-variant);
}

.empty-tags {
  text-align: center;
  padding: 32px;
  color: var(--md-on-surface-variant);
}

/* 响应式 */
@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
