<template>
  <div class="history-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">专注历史</h1>
        <p class="page-subtitle">查看你的专注记录</p>
      </div>
      <button class="btn-export" @click="exportCSV">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        导出 CSV
      </button>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else-if="sessions.length === 0" class="empty-state">
      <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <p>还没有专注记录</p>
      <router-link to="/" class="btn-start">开始第一次专注</router-link>
    </div>

    <div v-else class="history-content">
      <!-- 表格 -->
      <div class="card table-card">
        <table class="history-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>时间</th>
              <th>标签</th>
              <th>时长</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in sessions" :key="session.id">
              <td class="date-cell">{{ formatDate(session.start_time) }}</td>
              <td class="time-cell">{{ formatTimeRange(session.start_time, session.end_time) }}</td>
              <td>
                <span class="tag-chip">
                  {{ getTagIcon(session.tag) }} {{ session.tag }}
                </span>
              </td>
              <td class="duration-cell">{{ session.duration }} 分钟</td>
              <td>
                <button class="btn-delete" @click="deleteSession(session.id)">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button 
          class="btn-page" 
          :disabled="pagination.page <= 1"
          @click="loadSessions(pagination.page - 1)"
        >
          上一页
        </button>
        <span class="page-info">{{ pagination.page }} / {{ pagination.totalPages }}</span>
        <button 
          class="btn-page" 
          :disabled="pagination.page >= pagination.totalPages"
          @click="loadSessions(pagination.page + 1)"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated } from 'vue';

const API_BASE = '/api';
const sessions = ref([]);
const loading = ref(true);
const error = ref(null);
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 });

const tagIcons = { '工作': '💼', '学习': '📚', '阅读': '📖', '运动': '🏃', '创作': '🎨', '其他': '✨' };
const getTagIcon = (tag) => tagIcons[tag] || '✨';

const loadSessions = async (page = 1) => {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch(`${API_BASE}/sessions?page=${page}&limit=${pagination.value.limit}`);
    if (!response.ok) throw new Error('加载失败');
    const data = await response.json();
    sessions.value = data.data;
    pagination.value = data.pagination;
  } catch (err) {
    error.value = '无法加载历史记录，请确保服务器正在运行';
  } finally {
    loading.value = false;
  }
};

const deleteSession = async (id) => {
  if (!confirm('确定要删除这条记录吗？')) return;
  try {
    const response = await fetch(`${API_BASE}/sessions/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('删除失败');
    loadSessions(pagination.value.page);
  } catch (err) { alert('删除失败，请稍后重试'); }
};

const exportCSV = () => { window.open(`${API_BASE}/export`, '_blank'); };

const formatDate = (isoStr) => {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${month}月${day}日 ${weekdays[date.getDay()]}`;
};

const formatTimeRange = (startStr, endStr) => {
  if (!startStr || !endStr) return '';
  const start = new Date(startStr);
  const end = new Date(endStr);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${pad(start.getHours())}:${pad(start.getMinutes())} - ${pad(end.getHours())}:${pad(end.getMinutes())}`;
};

onMounted(() => { loadSessions(); });
onActivated(() => { loadSessions(); });
</script>

<style scoped>
.history-page {
  max-width: 1000px;
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

.btn-export {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-radius-full);
  background: var(--md-surface);
  color: var(--md-primary);
  font-family: var(--md-font);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--md-transition);
}

.btn-export:hover {
  background: rgba(26, 115, 232, 0.04);
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px;
  color: var(--md-on-surface-variant);
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  color: var(--md-outline);
}

.btn-start {
  margin-top: 16px;
  padding: 10px 24px;
  background: var(--md-primary);
  color: white;
  border-radius: var(--md-radius-full);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

/* 表格 */
.card {
  background: var(--md-surface);
  border-radius: var(--md-radius-md);
  box-shadow: var(--md-shadow-1);
  overflow: hidden;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
}

.history-table th {
  text-align: left;
  padding: 14px 20px;
  font-size: 12px;
  font-weight: 500;
  color: var(--md-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--md-outline-variant);
  background: var(--md-surface-container-low);
}

.history-table td {
  padding: 16px 20px;
  font-size: 14px;
  color: var(--md-on-surface);
  border-bottom: 1px solid var(--md-outline-variant);
}

.history-table tr:last-child td {
  border-bottom: none;
}

.history-table tr:hover td {
  background: rgba(95, 99, 104, 0.04);
}

.date-cell {
  font-weight: 500;
}

.time-cell {
  color: var(--md-on-surface-variant);
}

.duration-cell {
  font-weight: 500;
  color: var(--md-primary);
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: var(--md-secondary-container);
  color: var(--md-on-secondary-container);
  border-radius: var(--md-radius-full);
  font-size: 12px;
  font-weight: 500;
}

.btn-delete {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: var(--md-on-surface-variant);
  border-radius: 50%;
  transition: all var(--md-transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete:hover {
  background: var(--md-error-container);
  color: var(--md-error);
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.btn-page {
  padding: 8px 20px;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-radius-full);
  background: var(--md-surface);
  color: var(--md-primary);
  font-family: var(--md-font);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--md-transition);
}

.btn-page:hover:not(:disabled) {
  background: rgba(26, 115, 232, 0.04);
}

.btn-page:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: var(--md-on-surface-variant);
}
</style>
