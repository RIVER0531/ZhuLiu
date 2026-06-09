<template>
  <div class="history">
    <div class="page-header">
      <div>
        <h1 class="page-title">专注历史</h1>
        <p class="page-subtitle">查看你的专注记录</p>
      </div>
      <button class="btn btn--outline" @click="exportCSV">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        导出 CSV
      </button>
    </div>

    <Transition name="snackbar">
      <div v-if="exportMessage" class="snackbar snackbar--error" @click="exportMessage = ''">{{ exportMessage }}</div>
    </Transition>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error-banner">
      {{ error }}
      <button class="btn btn--text btn--sm" @click="loadData">重试</button>
    </div>

    <div v-else-if="sessions.length === 0" class="empty-state">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="64" height="64" style="color: var(--md-outline)">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p>还没有专注记录</p>
      <router-link to="/" class="btn btn--primary">开始第一次专注</router-link>
    </div>

    <div v-else class="history-content">
      <div class="card table-card">
        <table class="history-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>时间</th>
              <th>标签</th>
              <th>时长</th>
              <th class="col-action"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sessions" :key="s.id">
              <td class="cell-date">{{ formatDate(s.start_time) }}</td>
              <td class="cell-time">{{ formatRange(s.start_time, s.end_time) }}</td>
              <td>
                <span class="tag-chip">{{ tagIcons[s.tag] || '✨' }} {{ s.tag }}</span>
              </td>
              <td class="cell-duration">{{ s.duration }} 分钟</td>
              <td>
                <button class="btn-icon" @click="confirmDelete(s.id)" title="删除">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="pagination.totalPages > 1" class="pagination">
        <button class="btn btn--outline btn--sm" :disabled="pagination.page <= 1" @click="loadData(pagination.page - 1)">上一页</button>
        <span class="page-info">{{ pagination.page }} / {{ pagination.totalPages }}</span>
        <button class="btn btn--outline btn--sm" :disabled="pagination.page >= pagination.totalPages" @click="loadData(pagination.page + 1)">下一页</button>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="dialog">
        <div v-if="showDeleteDialog" class="dialog-scrim" @click.self="showDeleteDialog = false">
          <div class="dialog">
            <h3 class="dialog-title">确认删除</h3>
            <p class="dialog-desc">确定要删除这条专注记录吗？此操作不可撤销。</p>
            <p v-if="deleteError" class="dialog-error">{{ deleteError }}</p>
            <div class="dialog-actions">
              <button class="btn btn--text" @click="showDeleteDialog = false">取消</button>
              <button class="btn btn--danger" @click="executeDelete">删除</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onActivated } from 'vue';
import { api } from '../api';
import { TAG_ICONS } from '../constants/tags';

const tagIcons = TAG_ICONS;

const sessions = ref([]);
const loading = ref(false);
const error = ref(null);
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 });
const showDeleteDialog = ref(false);
const deleteTargetId = ref(null);
const deleteError = ref('');
const exportMessage = ref('');

async function loadData(page = 1) {
  if (!sessions.value.length) loading.value = true;
  error.value = null;
  try {
    const data = await api.getSessions(page, pagination.value.limit);
    sessions.value = data.data;
    pagination.value = data.pagination;
  } catch (err) {
    error.value = '无法加载历史记录，请确保服务器正在运行';
  } finally {
    loading.value = false;
  }
}

function confirmDelete(id) {
  deleteTargetId.value = id;
  deleteError.value = '';
  showDeleteDialog.value = true;
}

async function executeDelete() {
  if (!deleteTargetId.value) return;
  try {
    await api.deleteSession(deleteTargetId.value);
    showDeleteDialog.value = false;
    deleteTargetId.value = null;
    const page = sessions.value.length === 1 && pagination.value.page > 1
      ? pagination.value.page - 1
      : pagination.value.page;
    await loadData(page);
  } catch {
    deleteError.value = '删除失败，请稍后重试';
  }
}

async function exportCSV() {
  const token = localStorage.getItem('riverflow_token');
  try {
    const res = await fetch('/api/export', {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    });
    if (res.status === 401) {
      localStorage.removeItem('riverflow_token');
      window.dispatchEvent(new Event('auth:logout'));
      return;
    }
    if (!res.ok) { exportMessage.value = '导出失败'; setTimeout(() => { exportMessage.value = ''; }, 5000); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'riverflow-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    exportMessage.value = '导出失败，请检查网络连接';
    setTimeout(() => { exportMessage.value = ''; }, 5000);
  }
}

function parseLocal(str) {
  if (!str) return new Date();
  return new Date(str.replace(/-/g, '/'));
}

function formatDate(timeStr) {
  if (!timeStr) return '';
  const d = parseLocal(timeStr);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
}

function formatRange(startStr, endStr) {
  if (!startStr || !endStr) return '';
  const s = parseLocal(startStr);
  const e = parseLocal(endStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(s.getHours())}:${pad(s.getMinutes())} - ${pad(e.getHours())}:${pad(e.getMinutes())}`;
}

onActivated(() => loadData());
</script>

<style scoped>
.history {
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

.error-banner {
  padding: 16px 20px;
  background: var(--md-error-container);
  color: var(--md-error);
  border-radius: var(--md-radius-sm);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px;
  gap: 16px;
  color: var(--md-on-surface-variant);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border: none;
  border-radius: var(--md-radius-full);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all var(--md-transition);
}

.btn--outline {
  border: 1px solid var(--md-outline);
  background: var(--md-surface);
  color: var(--md-primary);
}

.btn--outline:hover {
  background: rgba(26, 115, 232, 0.04);
}

.btn--primary {
  background: var(--md-primary);
  color: var(--md-on-primary);
}

.btn--text {
  background: none;
  color: var(--md-primary);
}

.btn--text:hover {
  background: rgba(26, 115, 232, 0.08);
}

.btn--sm {
  padding: 8px 20px;
}

.btn:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.card {
  background: var(--md-surface);
  border-radius: var(--md-radius-md);
  box-shadow: var(--md-shadow-1);
  overflow-x: auto;
  animation: fadeIn 0.3s ease;
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

.col-action {
  width: 48px;
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

.cell-date {
  font-weight: 500;
}

.cell-time {
  color: var(--md-on-surface-variant);
}

.cell-duration {
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

.btn-icon {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: var(--md-on-surface-variant);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--md-transition);
}

.btn-icon:hover {
  background: var(--md-error-container);
  color: var(--md-error);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.page-info {
  font-size: 14px;
  color: var(--md-on-surface-variant);
}

.snackbar { padding: 12px 20px; border-radius: var(--md-radius-sm); font-size: 14px; margin-bottom: 16px; cursor: pointer; }
.snackbar--success { background: #e6f4ea; color: #137333; }
.snackbar--error { background: #fce8e6; color: #c5221f; }
.snackbar--warning { background: #fef7e0; color: #b06000; }
.snackbar-enter-active { animation: fadeIn 0.3s ease; }
.snackbar-leave-active { transition: opacity 0.2s; }
.snackbar-leave-to { opacity: 0; }

.dialog-scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.dialog { background: var(--md-surface); border-radius: var(--md-radius-xl); padding: 32px; width: 400px; max-width: 90vw; box-shadow: var(--md-shadow-3); }
.dialog-title { font-size: 20px; font-weight: 500; color: var(--md-on-surface); margin-bottom: 12px; }
.dialog-desc { font-size: 14px; color: var(--md-on-surface-variant); margin-bottom: 16px; }
.dialog-error { font-size: 13px; color: var(--md-error); margin-bottom: 12px; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.dialog-enter-active { animation: fadeIn 0.2s ease; }
.dialog-leave-active { transition: opacity 0.15s ease; }
.dialog-leave-to { opacity: 0; }
</style>
