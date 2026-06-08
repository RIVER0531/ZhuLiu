import { reactive, readonly } from 'vue';

const state = reactive({
  user: null,
  token: localStorage.getItem('riverflow_token') || null,
});

function setAuth(user, token) {
  state.user = user;
  state.token = token;
  if (token) {
    localStorage.setItem('riverflow_token', token);
  }
}

function logout() {
  state.user = null;
  state.token = null;
  localStorage.removeItem('riverflow_token');
}

function restore() {
  return !!state.token;
}

export const authStore = {
  state: readonly(state),
  setAuth,
  logout,
  restore,
};
