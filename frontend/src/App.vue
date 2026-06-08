<template>
  <div class="app-container" :data-theme="theme">
    <header class="top-app-bar">
      <div class="app-bar-content">
        <div class="app-bar-leading">
          <div class="logo">
            <div class="logo-icon-box">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <span class="logo-text">逐流</span>
          </div>
          <div v-if="timerStore.state.isRunning" class="timer-badge">
            <span class="badge-dot"></span>
            <span class="badge-time">{{ formatBadgeTime(timerStore.state.elapsedSeconds) }}</span>
          </div>
        </div>
        
        <nav class="nav-tabs">
          <router-link 
            v-for="tab in tabs" 
            :key="tab.path" 
            :to="tab.path" 
            class="nav-tab"
            active-class="active"
          >
            <svg class="tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon"></path>
            </svg>
            <span>{{ tab.label }}</span>
          </router-link>
        </nav>

        <button class="theme-btn" @click="toggleTheme">
          <svg v-if="theme === 'dark'" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path></svg>
          <svg v-else fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
        </button>
      </div>
    </header>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>

    <SoundPlayer />
  </div>
</template>

<script setup>
import { ref, onMounted, provide } from 'vue';
import { timerStore } from './stores/timer';
import SoundPlayer from './components/SoundPlayer.vue';

provide('timerStore', timerStore);

const tabs = [
  { path: '/', label: '专注', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { path: '/pomodoro', label: '番茄', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { path: '/chart', label: '图表', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { path: '/stats', label: '统计', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { path: '/history', label: '历史', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
];

const theme = ref(localStorage.getItem('theme') || 'light');

const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', theme.value);
  document.documentElement.setAttribute('data-theme', theme.value);
};

const formatBadgeTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

onMounted(() => {
  timerStore.restore();
  document.documentElement.setAttribute('data-theme', theme.value);
});
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
}

/* 顶部导航栏 */
.top-app-bar {
  background: var(--md-surface);
  box-shadow: var(--md-shadow-1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-bar-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 64px;
}

.app-bar-leading {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon-box {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--md-primary-container);
  border-radius: var(--md-radius-sm);
}

.logo-icon-box svg {
  width: 20px;
  height: 20px;
  color: var(--md-primary);
}

.logo-text {
  font-size: 20px;
  font-weight: 400;
  color: var(--md-on-surface);
  letter-spacing: -0.5px;
}

/* 计时徽章 */
.timer-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: var(--md-primary-container);
  border-radius: var(--md-radius-full);
  animation: pulse 2s infinite;
}

.badge-dot {
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

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.badge-time {
  font-size: 13px;
  font-weight: 500;
  color: var(--md-primary);
  font-variant-numeric: tabular-nums;
}

/* 导航标签 */
.nav-tabs {
  display: flex;
  gap: 2px;
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  text-decoration: none;
  color: var(--md-on-surface-variant);
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--md-radius-full);
  transition: all var(--md-transition);
}

.nav-tab:hover {
  background: rgba(95, 99, 104, 0.08);
}

.nav-tab.active {
  color: var(--md-primary);
  background: rgba(26, 115, 232, 0.08);
}

.tab-icon {
  width: 18px;
  height: 18px;
}

/* 主题按钮 */
.theme-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--md-on-surface-variant);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--md-transition);
}

.theme-btn:hover {
  background: rgba(95, 99, 104, 0.08);
}

.theme-btn svg {
  width: 20px;
  height: 20px;
}

/* 主内容 */
.main-content {
  flex: 1;
  padding: 32px;
}

@media (max-width: 768px) {
  .app-bar-content {
    padding: 0 16px;
    height: auto;
    flex-wrap: wrap;
    padding-top: 12px;
    padding-bottom: 12px;
    gap: 12px;
  }

  .app-bar-leading {
    width: 100%;
    justify-content: space-between;
  }

  .nav-tabs {
    width: 100%;
    justify-content: space-around;
  }

  .nav-tab {
    padding: 8px 12px;
    font-size: 12px;
  }

  .main-content {
    padding: 16px;
  }
}
</style>
