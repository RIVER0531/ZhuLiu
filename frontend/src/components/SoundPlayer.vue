<template>
  <Transition name="fab">
    <div v-if="show" class="sound-panel">
      <div class="panel-header">
        <h4 class="panel-title">专注音效</h4>
        <button class="icon-btn" @click="show = false" aria-label="关闭">
          <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>

      <div class="sound-grid">
        <button
          v-for="s in sounds" :key="s.id"
          class="sound-chip"
          :class="{ 'sound-chip--active': active === s.id && playing }"
          @click="toggle(s)"
        >
          <span class="sound-chip-emoji">{{ s.icon }}</span>
          <span class="sound-chip-label">{{ s.name }}</span>
        </button>
      </div>

      <div class="volume-row">
        <svg fill="currentColor" viewBox="0 0 20 20" width="18" height="18" style="color: var(--md-on-surface-variant); flex-shrink: 0;">
          <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd"/>
        </svg>
        <input type="range" min="0" max="100" v-model.number="volume" class="volume-slider"/>
        <span class="volume-value">{{ volume }}%</span>
      </div>
    </div>
  </Transition>

  <button v-if="!show" class="fab" @click="show = true" aria-label="音效">
    <svg fill="currentColor" viewBox="0 0 20 20" width="24" height="24">
      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
    </svg>
  </button>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';

const sounds = [
  { id: 'rain',   name: '雨声',   icon: '🌧️', type: 'pink' },
  { id: 'forest', name: '森林',   icon: '🌲', type: 'brown' },
  { id: 'cafe',   name: '咖啡厅', icon: '☕',  type: 'pink' },
  { id: 'waves',  name: '海浪',   icon: '🌊', type: 'brown' },
  { id: 'fire',   name: '篝火',   icon: '🔥', type: 'brown' },
  { id: 'wind',   name: '风声',   icon: '💨', type: 'pink' },
];

const show = ref(false);
const active = ref(null);
const playing = ref(false);
const volume = ref(30);

let ctx = null;
let source = null;
let gain = null;

function createNoise(type) {
  if (ctx) ctx.close();

  ctx = new (window.AudioContext || window.webkitAudioContext)();
  gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.value = volume.value / 100;

  const size = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < size; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  } else {
    let last = 0;
    for (let i = 0; i < size; i++) {
      const w = Math.random() * 2 - 1;
      data[i] = (last + (0.02 * w)) / 1.02;
      last = data[i];
      data[i] *= 3.5;
    }
  }

  source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;

  source.connect(filter);
  filter.connect(gain);
  source.start();
}

function toggle(sound) {
  if (active.value === sound.id && playing.value) {
    stop();
  } else {
    active.value = sound.id;
    createNoise(sound.type);
    playing.value = true;
  }
}

function stop() {
  if (source) { try { source.stop(); } catch { /* ignore */ } source = null; }
  if (ctx) { ctx.close(); ctx = null; }
  playing.value = false;
  active.value = null;
}

watch(volume, (v) => {
  if (gain) gain.gain.value = v / 100;
});

onUnmounted(stop);
</script>

<style scoped>
.fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: var(--md-radius-lg);
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--md-shadow-3);
  z-index: 100;
  cursor: pointer;
  transition: all var(--md-transition);
}

.fab:hover {
  box-shadow: var(--md-shadow-2);
  transform: scale(1.05);
}

.sound-panel {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--md-surface);
  border-radius: var(--md-radius-xl);
  padding: 20px;
  box-shadow: var(--md-shadow-3);
  z-index: 100;
  width: 280px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--md-on-surface);
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: var(--md-on-surface-variant);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color var(--md-transition);
}

.icon-btn:hover {
  background: rgba(95, 99, 104, 0.08);
}

.sound-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.sound-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-radius-md);
  background: var(--md-surface);
  cursor: pointer;
  transition: all var(--md-transition);
}

.sound-chip:hover {
  background: rgba(95, 99, 104, 0.08);
  border-color: var(--md-primary);
}

.sound-chip--active {
  background: var(--md-primary-container);
  border-color: var(--md-primary);
}

.sound-chip-emoji {
  font-size: 24px;
  line-height: 1;
}

.sound-chip-label {
  font-size: 12px;
  color: var(--md-on-surface-variant);
}

.sound-chip--active .sound-chip-label {
  color: var(--md-on-primary-container);
}

.volume-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.volume-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--md-surface-container-high);
  border-radius: var(--md-radius-full);
  outline: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--md-primary);
  cursor: pointer;
  box-shadow: var(--md-shadow-1);
}

.volume-value {
  font-size: 12px;
  color: var(--md-on-surface-variant);
  min-width: 32px;
  text-align: right;
}

.fab-enter-active,
.fab-leave-active {
  transition: all 0.2s ease;
}

.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
