<template>
  <div class="chart">
    <div class="page-header">
      <div>
        <h1 class="page-title">数据洞察</h1>
        <p class="page-subtitle">追踪你的专注趋势</p>
      </div>
      <div class="segmented-control">
        <button class="segment" :class="{ 'segment--selected': period === 7 }" @click="changePeriod(7)">7 天</button>
        <button class="segment" :class="{ 'segment--selected': period === 30 }" @click="changePeriod(30)">30 天</button>
      </div>
    </div>

    <div class="content-grid">
      <section class="chart-section">
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
                <div v-for="(item, idx) in chartData" :key="idx" class="chart-bar-group">
                  <div class="chart-bar-wrapper">
                    <div
                      class="chart-bar"
                      :class="{ 'chart-bar--today': isToday(item.date) }"
                      :style="{ height: barHeight(item.minutes) + '%' }"
                    ></div>
                    <span class="chart-tooltip">{{ item.minutes }}分钟</span>
                  </div>
                  <span class="chart-label">{{ formatDate(item.date, idx) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="summary-row">
          <div class="card summary-card">
            <div class="summary-icon summary-icon--blue">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <div class="summary-label">总计时长</div>
              <div class="summary-value">{{ formatDuration(totalMinutes) }}</div>
            </div>
          </div>
          <div class="card summary-card">
            <div class="summary-icon summary-icon--green">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
            </div>
            <div>
              <div class="summary-label">总计次数</div>
              <div class="summary-value">{{ totalCount }} 次</div>
            </div>
          </div>
          <div class="card summary-card">
            <div class="summary-icon summary-icon--purple">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
            <div>
              <div class="summary-label">日均时长</div>
              <div class="summary-value">{{ formatDuration(avgMinutes) }}</div>
            </div>
          </div>
        </div>
      </section>

      <aside class="tag-section">
        <div class="card">
          <div class="card-title">标签分布</div>
          <div v-if="tagStats.length === 0" class="empty-tags">
            <p>暂无数据</p>
          </div>
          <div v-else class="tag-list">
            <div v-for="tag in tagStats" :key="tag.tag" class="tag-item">
              <div class="tag-header">
                <span class="tag-name">{{ tag.tag }}</span>
                <span class="tag-value">{{ formatDuration(tag.total_minutes) }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: tagPercent(tag.total_minutes) + '%' }"></div>
              </div>
              <div class="tag-sub">{{ tag.session_count }} 次</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onActivated } from 'vue';
import { api } from '../api';

const period = ref(7);
const chartData = ref([]);
const tagStats = ref([]);

const maxTagMinutes = computed(() => tagStats.value.length ? Math.max(...tagStats.value.map(t => t.total_minutes), 1) : 1);
const maxMinutes = computed(() => chartData.value.length ? Math.ceil(Math.max(...chartData.value.map(d => d.minutes), 1) / 10) * 10 || 10 : 10);
const totalMinutes = computed(() => chartData.value.reduce((s, d) => s + d.minutes, 0));
const totalCount = computed(() => chartData.value.reduce((s, d) => s + d.count, 0));
const avgMinutes = computed(() => {
  const activeDays = chartData.value.filter(d => d.minutes > 0);
  if (!activeDays.length) return 0;
  return Math.round(totalMinutes.value / activeDays.length);
});

function barHeight(minutes) { return maxMinutes.value ? (minutes / maxMinutes.value) * 100 : 0; }
function tagPercent(minutes) { return maxTagMinutes.value ? (minutes / maxTagMinutes.value) * 100 : 0; }

function isToday(dateStr) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return dateStr === today;
}

function formatDate(dateStr, index) {
  if (period.value === 30 && index % 5 !== 0 && index !== chartData.value.length - 1) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDuration(mins) {
  if (!mins) return '0 分钟';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h > 0 && m > 0) return `${h} 小时 ${m} 分`;
  if (h > 0) return `${h} 小时`;
  return `${m} 分钟`;
}

async function changePeriod(days) {
  period.value = days;
  await fetchChart();
}

async function fetchChart() {
  try { chartData.value = await api.getChart(period.value); } catch { /* silent */ }
}

async function fetchTags() {
  try { tagStats.value = await api.getTags(); } catch { /* silent */ }
}

onActivated(() => {
  fetchChart();
  fetchTags();
});
</script>

<style scoped>
.chart {
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
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--md-on-surface-variant);
  margin-top: 4px;
}

.segmented-control {
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
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--md-transition);
}

.segment:first-child {
  border-right: 1px solid var(--md-outline);
}

.segment--selected {
  background: var(--md-primary);
  color: var(--md-on-primary);
}

.segment:hover:not(.segment--selected) {
  background: rgba(95, 99, 104, 0.08);
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;
}

.card {
  background: var(--md-surface);
  border-radius: var(--md-radius-md);
  padding: 24px;
  box-shadow: var(--md-shadow-1);
  animation: fadeIn 0.3s ease;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--md-on-surface);
  margin-bottom: 24px;
}

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
  flex-shrink: 0;
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
}

.chart-bar:hover {
  opacity: 1;
}

.chart-bar--today {
  opacity: 1;
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
}

.chart-bar-wrapper:hover .chart-tooltip {
  opacity: 1;
}

.chart-label {
  font-size: 11px;
  color: var(--md-on-surface-variant);
  position: absolute;
  bottom: -24px;
}

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

.summary-icon--blue   { background: #e8f0fe; color: #1a73e8; }
.summary-icon--green  { background: #e6f4ea; color: #137333; }
.summary-icon--purple { background: #f3e8fd; color: #8430ce; }

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

.tag-section {
  position: sticky;
  top: 96px;
}

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
  font-weight: 500;
  color: var(--md-primary);
}

.tag-sub {
  font-size: 12px;
  color: var(--md-on-surface-variant);
}

.empty-tags {
  text-align: center;
  padding: 32px;
  color: var(--md-on-surface-variant);
}

@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .tag-section {
    position: static;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
