<template>
  <div class="login">
    <div class="login-card">
      <div class="login-logo">
        <div class="login-logo-icon">
          <img src="/favicon.png" alt="逐流" class="login-logo-img" />
        </div>
        <h1 class="login-title">逐流</h1>
      </div>

      <div class="login-tabs">
        <button class="login-tab" :class="{ 'login-tab--active': !isRegister }" @click="switchMode(false)">
          登录
        </button>
        <button class="login-tab" :class="{ 'login-tab--active': isRegister }" @click="switchMode(true)">
          注册
        </button>
      </div>

      <div class="login-form">
        <div class="text-field">
          <label>用户名</label>
          <input v-model="username" type="text" autocomplete="username" placeholder="输入用户名" required minlength="2"/>
        </div>
        <div class="text-field">
          <label>密码</label>
          <input v-model="password" type="password" :autocomplete="isRegister ? 'new-password' : 'current-password'" placeholder="输入密码" required/>
        </div>

        <div v-if="error" class="login-error">{{ error }}</div>

        <button type="submit" class="btn btn--primary btn--full" :disabled="loading" @click="submit">
          {{ loading ? '...' : (isRegister ? '创建账号' : '登录') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { authStore } from '../stores/auth';

const router = useRouter();
const isRegister = ref(false);
const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

function switchMode(register) {
  isRegister.value = register;
  error.value = '';
  username.value = '';
  password.value = '';
}

async function submit() {
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
</script>

<style scoped>
.login {
  min-height: calc(100vh - 64px - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.login-card {
  width: 400px;
  max-width: 100%;
}

.login-logo {
  text-align: center;
  margin-bottom: 24px;
}

.login-logo-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  background: var(--md-primary-container);
  border-radius: var(--md-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.login-logo-img {
  width: 32px;
  height: 32px;
  display: block;
  border-radius: 6px;
  object-fit: contain;
}

.login-title {
  font-size: 28px;
  font-weight: 400;
  color: var(--md-on-surface);
  letter-spacing: -0.5px;
}

.login-tabs {
  display: flex;
  background: var(--md-surface-container);
  border-radius: var(--md-radius-full);
  padding: 4px;
  margin-bottom: 24px;
}

.login-tab {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  color: var(--md-on-surface-variant);
  font-size: 15px;
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

.text-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
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

.login-error {
  padding: 10px 14px;
  background: var(--md-error-container);
  color: var(--md-error);
  border-radius: var(--md-radius-sm);
  font-size: 13px;
  margin-bottom: 16px;
}

.btn {
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

.btn--primary:hover:not(:disabled) {
  box-shadow: var(--md-shadow-2);
}

.btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--full {
  width: 100%;
  padding: 14px;
}
</style>
