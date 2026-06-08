import { reactive, readonly } from 'vue';

const STORAGE_KEY = 'riverflow_start_time';
const TAG_KEY = 'riverflow_tag';
const MAX_DURATION = 24 * 60 * 60 * 1000;

const state = reactive({
  isRunning: false,
  startTime: null,
  elapsedSeconds: 0,
  tag: localStorage.getItem(TAG_KEY) || '工作',
});

let timerInterval = null;

function tick() {
  if (!state.startTime) return;
  state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
}

function start(tag) {
  state.isRunning = true;
  state.startTime = Date.now();
  state.tag = tag || state.tag;
  localStorage.setItem(STORAGE_KEY, state.startTime.toString());
  localStorage.setItem(TAG_KEY, state.tag);

  tick();
  clearInterval(timerInterval);
  timerInterval = setInterval(tick, 1000);
}

function stop() {
  clearInterval(timerInterval);
  timerInterval = null;

  const endTime = Date.now();
  const durationMinutes = Math.floor(state.elapsedSeconds / 60);
  const tag = state.tag;

  state.isRunning = false;
  state.elapsedSeconds = 0;
  state.startTime = null;
  localStorage.removeItem(STORAGE_KEY);

  return { endTime, durationMinutes, tag };
}

function restore() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = parseInt(saved, 10);
    if (parsed && Date.now() - parsed < MAX_DURATION) {
      state.startTime = parsed;
      state.isRunning = true;
      tick();
      clearInterval(timerInterval);
      timerInterval = setInterval(tick, 1000);
      return true;
    }
    localStorage.removeItem(STORAGE_KEY);
  }
  return false;
}

function setTag(tag) {
  state.tag = tag;
  localStorage.setItem(TAG_KEY, tag);
}

function cleanup() {
  clearInterval(timerInterval);
  timerInterval = null;
}

export const timerStore = {
  state: readonly(state),
  start,
  stop,
  restore,
  setTag,
  cleanup,
};
