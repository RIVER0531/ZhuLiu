<template>
  <div class="login-page" :data-theme="theme">
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">
          <img src="/favicon.png" alt="逐流" class="login-logo-img" />
        </div>
        <h1 class="login-title">逐流</h1>
        <p class="login-subtitle">{{ isRegister ? '创建账号开始专注之旅' : '登录以继续你的专注之旅' }}</p>
      </div>

      <div class="login-tabs">
        <button class="login-tab" :class="{ 'login-tab--active': !isRegister }" @click="switchMode(false)">登录</button>
        <button class="login-tab" :class="{ 'login-tab--active': isRegister }" @click="switchMode(true)">注册</button>
      </div>

      <form class="login-form" @submit.prevent="submit">
        <div class="md-field">
          <input
            ref="usernameRef"
            v-model="username"
            type="text"
            id="login-username"
            autocomplete="username"
            required
            minlength="2"
            maxlength="20"
            class="md-input"
            placeholder=" "
          />
          <label for="login-username" class="md-label">用户名</label>
        </div>

        <div class="md-field">
          <input
            v-model="password"
            type="password"
            id="login-password"
            :autocomplete="isRegister ? 'new-password' : 'current-password'"
            required
            minlength="4"
            maxlength="64"
            class="md-input"
            placeholder=" "
          />
          <label for="login-password" class="md-label">密码</label>
        </div>

        <Transition name="error">
          <div v-if="error" class="login-error">
            <svg fill="currentColor" viewBox="0 0 20 20" width="16" height="16" class="error-icon">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <span>{{ error }}</span>
          </div>
        </Transition>

        <button type="submit" class="login-submit" :disabled="loading">
          <svg v-if="loading" class="submit-spinner" viewBox="0 0 24 24" width="20" height="20">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="31.4 31.4" stroke-linecap="round"/>
          </svg>
          <span v-else>{{ isRegister ? '创建账号' : '登录' }}</span>
        </button>
      </form>

      <button class="theme-toggle" @click="toggleTheme" :title="theme === 'dark' ? '切换亮色' : '切换暗色'">
        <svg v-if="theme === 'dark'" fill="currentColor" viewBox="0 0 20 20" width="18" height="18">
          <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
        </svg>
        <svg v-else fill="currentColor" viewBox="0 0 20 20" width="18" height="18">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { authStore } from '../stores/auth';

const router = useRouter();
const usernameRef = ref(null);
const isRegister = ref(false);
const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const theme = ref(localStorage.getItem('theme') || 'light');

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', theme.value);
  document.documentElement.setAttribute('data-theme', theme.value);
}

function switchMode(register) {
  isRegister.value = register;
  error.value = '';
  username.value = '';
  password.value = '';
  nextTick(() => usernameRef.value?.focus());
}

async function submit() {
  if (loading.value) return;
  error.value = '';
  loading.value = true;
  try {
    const fn = isRegister.value ? api.register : api.login;
    const data = await fn(username.value.trim(), password.value);
    authStore.setAuth({ id: data.userId, username: data.username }, data.token);
    router.replace('/');
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  document.documentElement.setAttribute('data-theme', theme.value);
  usernameRef.value?.focus();
});
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--md-surface-dim);
  position: relative;
}

.login-card {
  width: 400px;
  max-width: 100%;
  position: relative;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  width: 72px;
  height: 72px;
  margin: 0 auto 20px;
  background: var(--md-primary-container);
  border-radius: var(--md-radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: var(--md-shadow-1);
}

.login-logo-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.login-title {
  font-size: 24px;
  font-weight: 400;
  color: var(--md-on-surface);
  letter-spacing: -0.5px;
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: var(--md-on-surface-variant);
  line-height: 1.4;
}

.login-tabs {
  display: flex;
  background: var(--md-surface-container);
  border-radius: var(--md-radius-full);
  padding: 4px;
  margin-bottom: 28px;
}

.login-tab {
  flex: 1;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: var(--md-on-surface-variant);
  font-size: 14px;
  font-weight: 500;
  font-family: var(--md-font);
  cursor: pointer;
  border-radius: var(--md-radius-full);
  transition: all var(--md-transition);
}

.login-tab--active {
  background: var(--md-primary);
  color: var(--md-on-primary);
  box-shadow: var(--md-shadow-1);
}

.login-tab:hover:not(.login-tab--active) {
  background: rgba(95, 99, 104, 0.08);
}

.login-form {
  background: var(--md-surface);
  border-radius: var(--md-radius-xl);
  padding: 32px;
  box-shadow: var(--md-shadow-1);
}

.md-field {
  position: relative;
  margin-bottom: 20px;
}

.md-input {
  width: 100%;
  padding: 20px 16px 8px;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-radius-xs);
  font-size: 16px;
  font-family: var(--md-font);
  background: transparent;
  color: var(--md-on-surface);
  outline: none;
  transition: border-color var(--md-transition);
  box-sizing: border-box;
}

.md-input:focus {
  border-color: var(--md-primary);
  border-width: 2px;
  padding: 19px 15px 7px;
}

.md-label {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: var(--md-on-surface-variant);
  pointer-events: none;
  transition: all var(--md-transition);
  background: var(--md-surface);
  padding: 0 4px;
}

.md-input:focus ~ .md-label,
.md-input:not(:placeholder-shown) ~ .md-label {
  top: 0;
  transform: translateY(-50%) scale(0.75);
  color: var(--md-primary);
  font-weight: 500;
}

.md-input:not(:focus):not(:placeholder-shown) ~ .md-label {
  color: var(--md-on-surface-variant);
  font-weight: 400;
}

.login-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  background: var(--md-error-container);
  color: var(--md-error);
  border-radius: var(--md-radius-sm);
  font-size: 13px;
  margin-bottom: 20px;
  line-height: 1.4;
}

.error-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.error-enter-active {
  animation: fadeIn 0.2s ease;
}

.error-leave-active {
  transition: opacity 0.15s ease;
}

.error-leave-to {
  opacity: 0;
}

.login-submit {
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: var(--md-radius-full);
  font-size: 15px;
  font-weight: 500;
  font-family: var(--md-font);
  cursor: pointer;
  transition: all var(--md-transition);
  background: var(--md-primary);
  color: var(--md-on-primary);
  box-shadow: var(--md-shadow-1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
}

.login-submit:hover:not(:disabled) {
  box-shadow: var(--md-shadow-2);
  transform: translateY(-1px);
}

.login-submit:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: var(--md-shadow-1);
}

.login-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.theme-toggle {
  position: absolute;
  top: 0;
  right: 0;
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

.theme-toggle:hover {
  background: rgba(95, 99, 104, 0.08);
}

@media (max-width: 480px) {
  .login-page {
    padding: 16px;
    align-items: flex-start;
    padding-top: 15vh;
  }

  .login-form {
    padding: 24px;
  }

  .login-logo {
    width: 64px;
    height: 64px;
  }

  .login-logo-img {
    width: 36px;
    height: 36px;
  }
}
</style>
