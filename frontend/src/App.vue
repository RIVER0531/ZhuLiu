<template>
  <div class="app-container" :class="{ 'app-bg-overlay': bgImage }" :data-theme="theme" :style="bgStyle">
    <div v-if="isElectron" class="titlebar">
      <div class="titlebar-drag-region"></div>
      <div class="titlebar-controls">
        <button class="tbc-btn" @click="winMinimize">
          <svg viewBox="0 0 12 12" width="12" height="12"><path d="M2 6h8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        </button>
        <button class="tbc-btn" @click="winMaximize">
          <svg viewBox="0 0 12 12" width="12" height="12"><rect x="1.5" y="1.5" width="9" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>
        </button>
        <button class="tbc-btn tbc-close" @click="winClose">
          <svg viewBox="0 0 12 12" width="12" height="12"><path d="M3 3l6 6M9 3l-6 6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>

    <header class="top-app-bar">
      <div class="app-bar-row">
        <div class="app-bar-leading">
          <div class="logo">
            <div class="logo-icon">
              <img src="/favicon.png" alt="逐流" class="logo-img" />
            </div>
            <span class="logo-text">逐流</span>
          </div>

          <div v-if="timerStore.state.isRunning" class="timer-badge">
            <span class="badge-dot"></span>
            <span class="badge-time">{{ formatBadgeTime(timerStore.state.elapsedSeconds) }}</span>
          </div>
        </div>

        <nav class="nav-tabs" v-if="authStore.state.token">
          <router-link v-for="tab in tabs" :key="tab.path" :to="tab.path" class="nav-tab" active-class="nav-tab--active">
            <svg class="nav-tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon"/>
            </svg>
            <span class="nav-tab-label">{{ tab.label }}</span>
          </router-link>
        </nav>

        <div class="app-bar-actions">
          <button v-if="authStore.state.token" class="theme-btn" title="更换背景" @click="showBgDialog = true">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </button>
          <button class="theme-btn" @click="toggleTheme" :aria-label="theme === 'dark' ? '切换亮色模式' : '切换暗色模式'">
            <svg v-if="theme === 'dark'" fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
            </svg>
            <svg v-else fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
            </svg>
          </button>
          <button v-if="authStore.state.token" class="theme-btn" title="退出登录" @click="handleLogout">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component"/>
        </keep-alive>
      </router-view>
    </main>

    <SoundPlayer v-if="authStore.state.token"/>

    <Teleport to="body">
      <Transition name="dialog">
        <div v-if="showBgDialog" class="bg-dialog-scrim" @click.self="showBgDialog = false">
          <div class="bg-dialog">
            <h3 class="bg-dialog-title">自定义背景</h3>
            <div class="bg-dialog-body">
              <div class="text-field">
                <label>背景图片 URL</label>
                <input v-model="bgUrl" type="text" placeholder="输入图片链接"/>
              </div>
              <div class="bg-presets">
                <span class="bg-preset-label">或选择预设</span>
                <div class="bg-preset-grid">
                  <button v-for="p in presets" :key="p" class="bg-preset" @click="bgUrl = p" :class="{ 'bg-preset--active': bgUrl === p }">
                    <img :src="p" alt="" @error="e => e.target.style.display='none'"/>
                  </button>
                </div>
              </div>
            </div>
            <div class="bg-dialog-actions">
              <button v-if="bgImage" class="btn btn--text" @click="clearBg">清除背景</button>
              <span style="flex:1"></span>
              <button class="btn btn--text" @click="showBgDialog = false">取消</button>
              <button class="btn btn--primary" @click="saveBg">保存</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, provide } from 'vue';
import { useRouter } from 'vue-router';
import { timerStore } from './stores/timer';
import { authStore } from './stores/auth';
import { api } from './api';
import SoundPlayer from './components/SoundPlayer.vue';

provide('timerStore', timerStore);
const router = useRouter();

const isElectron = ref(window.electronAPI?.isElectron ?? false);
const isMaximized = ref(true);

function winMinimize() { window.electronAPI?.window?.minimize(); }
function winMaximize() { window.electronAPI?.window?.maximize(); }
function winClose() { window.electronAPI?.window?.close(); }

const tabs = [
  { path: '/', label: '专注', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { path: '/pomodoro', label: '番茄', icon: 'M12 7v4l2.5 2.5M15 3h-6m3 0V1m6.36 3.64l-.71.71M20 12h-2M4 12H2m3.64-6.36l-.71-.71M12 21a7 7 0 100-14 7 7 0 000 14z' },
  { path: '/chart', label: '图表', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { path: '/stats', label: '统计', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { path: '/history', label: '历史', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
];

const theme = ref(localStorage.getItem('theme') || 'light');
const bgImage = ref(localStorage.getItem('riverflow_bg') || '');
const bgUrl = ref(bgImage.value);
const showBgDialog = ref(false);

const presets = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=60',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=60',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=60',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=60',
];

const bgStyle = computed(() => {
  if (!bgImage.value) return {};
  const isMobile = window.innerWidth <= 768;
  return {
    backgroundImage: `url(${bgImage.value})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: isMobile ? 'scroll' : 'fixed',
  };
});

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', theme.value);
  document.documentElement.setAttribute('data-theme', theme.value);
}

function saveBg() {
  bgImage.value = bgUrl.value.trim();
  localStorage.setItem('riverflow_bg', bgImage.value);
  showBgDialog.value = false;
}

function clearBg() {
  bgImage.value = '';
  bgUrl.value = '';
  localStorage.removeItem('riverflow_bg');
  showBgDialog.value = false;
}

function handleLogout() {
  authStore.logout();
  router.push('/login');
}

function formatBadgeTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

async function initAuth() {
  if (authStore.state.token) {
    try {
      const data = await api.getMe();
      if (data && data.id) {
        authStore.setAuth({ id: data.id, username: data.username }, authStore.state.token);
      } else {
        authStore.logout();
      }
    } catch {
      authStore.logout();
    }
  }
}

function requestNotification() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

onMounted(() => {
  timerStore.restore();
  initAuth();
  requestNotification();
  document.documentElement.setAttribute('data-theme', theme.value);

  window.electronAPI?.window?.onMaximized?.((val) => { isMaximized.value = val; });

  window.addEventListener('beforeunload', (e) => {
    if (timerStore.state.isRunning) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  window.addEventListener('auth:logout', () => {
    authStore.logout();
    router.push('/login');
  });
});
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
}

.app-container[style*="url"]::before {
  content: '';
  position: fixed;
  inset: 0;
  background: inherit;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  filter: brightness(0.35);
  z-index: -1;
}

.top-app-bar {
  background: var(--md-surface);
  box-shadow: var(--md-shadow-1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-bar-row {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 32px;
  height: 64px;
}

.app-bar-leading {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--md-primary-container);
  border-radius: var(--md-radius-sm);
  overflow: hidden;
}

.logo-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.logo-text {
  font-size: 20px;
  font-weight: 400;
  color: var(--md-on-surface);
  letter-spacing: -0.5px;
  white-space: nowrap;
}

.timer-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: var(--md-primary-container);
  border-radius: var(--md-radius-full);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--md-primary);
  animation: blink 1s ease-in-out infinite;
}

.badge-time {
  font-size: 13px;
  font-weight: 500;
  color: var(--md-primary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.nav-tabs {
  display: flex;
  gap: 4px;
  flex: 1;
  justify-content: center;
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  color: var(--md-on-surface-variant);
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--md-radius-full);
  text-decoration: none;
  transition: all var(--md-transition);
  white-space: nowrap;
}

.nav-tab:hover {
  background: rgba(95, 99, 104, 0.08);
}

.nav-tab--active {
  color: var(--md-primary);
  background: rgba(26, 115, 232, 0.08);
}

.nav-tab-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.app-bar-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.theme-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  color: var(--md-on-surface-variant);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--md-transition);
}

.theme-btn:hover {
  background: rgba(95, 99, 104, 0.08);
}

.main-content {
  flex: 1;
  padding: 32px;
}

.bg-dialog-scrim {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.bg-dialog {
  background: var(--md-surface);
  border-radius: var(--md-radius-xl);
  padding: 32px;
  width: 480px;
  max-width: 90vw;
  box-shadow: var(--md-shadow-3);
}

.bg-dialog-title {
  font-size: 20px;
  font-weight: 500;
  color: var(--md-on-surface);
  margin-bottom: 24px;
}

.bg-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.text-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.text-field label {
  font-size: 13px;
  color: var(--md-on-surface-variant);
}

.text-field input {
  padding: 12px 16px;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-radius-xs);
  font-size: 16px;
  background: var(--md-surface);
  color: var(--md-on-surface);
  outline: none;
  font-family: var(--md-font);
  transition: border-color var(--md-transition);
}

.text-field input:focus {
  border-color: var(--md-primary);
  border-width: 2px;
  padding: 11px 15px;
}

.bg-presets {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bg-preset-label {
  font-size: 13px;
  color: var(--md-on-surface-variant);
}

.bg-preset-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.bg-preset {
  aspect-ratio: 16/9;
  border: 2px solid var(--md-outline);
  border-radius: var(--md-radius-sm);
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  background: var(--md-surface-container);
  transition: border-color var(--md-transition);
}

.bg-preset img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bg-preset--active {
  border-color: var(--md-primary);
}

.bg-dialog-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 32px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 24px;
  border: none;
  border-radius: var(--md-radius-full);
  font-size: 14px;
  font-weight: 500;
  font-family: var(--md-font);
  cursor: pointer;
  transition: all var(--md-transition);
}

.btn--primary {
  background: var(--md-primary);
  color: var(--md-on-primary);
}

.btn--primary:hover {
  box-shadow: var(--md-shadow-2);
}

.btn--text {
  background: none;
  color: var(--md-primary);
}

.btn--text:hover {
  background: rgba(26, 115, 232, 0.08);
}

.dialog-enter-active { animation: fadeIn 0.2s ease; }
.dialog-leave-active { transition: opacity 0.15s ease; }
.dialog-leave-to { opacity: 0; }

/* ── 客户端标题栏 ── */

.titlebar {
  display: flex;
  align-items: center;
  height: 28px;
  background: var(--md-surface);
  -webkit-app-region: drag;
  user-select: none;
  flex-shrink: 0;
}

.titlebar-drag-region {
  flex: 1;
  height: 100%;
}

.titlebar-controls {
  display: flex;
  height: 100%;
  -webkit-app-region: no-drag;
}

.tbc-btn {
  width: 46px;
  height: 100%;
  border: none;
  background: transparent;
  color: var(--md-on-surface-variant);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}

.tbc-btn:hover {
  background: rgba(95, 99, 104, 0.12);
}

.tbc-close:hover {
  background: #c5221f;
  color: #fff;
}

@media (max-width: 768px) {
  .app-bar-row {
    padding: 8px 12px;
    height: auto;
    flex-wrap: wrap;
    gap: 8px;
  }

  .app-bar-leading {
    width: 100%;
    justify-content: space-between;
  }

  .logo-text { font-size: 17px; }
  .logo-icon { width: 30px; height: 30px; }

  .nav-tabs {
    width: 100%;
    justify-content: space-around;
    order: 3;
    gap: 2px;
  }

  .nav-tab {
    padding: 6px 10px;
    font-size: 12px;
  }

  .nav-tab-label {
    display: none;
  }

  .nav-tab-icon { width: 16px; height: 16px; }

  .app-bar-actions { gap: 0; }
  .theme-btn { width: 36px; height: 36px; }

  .main-content {
    padding: 12px;
  }

  .titlebar { height: 24px; }
  .tbc-btn { width: 40px; }
}
</style>

<style>
.app-bg-overlay .card,
.app-bg-overlay .heatmap-card,
.app-bg-overlay .login-card,
.app-bg-overlay .login-form,
.app-bg-overlay .sound-panel {
  background: rgba(255, 255, 255, 0.92) !important;
  backdrop-filter: blur(12px);
}

[data-theme="dark"].app-bg-overlay .card,
[data-theme="dark"].app-bg-overlay .heatmap-card,
[data-theme="dark"].app-bg-overlay .sound-panel {
  background: rgba(30, 30, 30, 0.88) !important;
}

.app-bg-overlay .top-app-bar {
  background: rgba(0, 0, 0, 0.3) !important;
  backdrop-filter: blur(12px);
}
</style>
