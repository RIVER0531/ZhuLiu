<template>
  <div class="sound-player" v-if="showControls">
    <div class="player-header">
      <h4 class="title-medium">专注音效</h4>
      <button class="icon-button-sm" @click="showControls = false">
        <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
      </button>
    </div>
    <div class="sound-grid">
      <button 
        v-for="sound in sounds" :key="sound.id"
        class="sound-chip"
        :class="{ active: currentSound === sound.id && isPlaying }"
        @click="toggleSound(sound)"
      >
        <span class="sound-chip-icon">{{ sound.icon }}</span>
        <span class="sound-chip-label body-small">{{ sound.name }}</span>
      </button>
    </div>
    <div class="volume-row">
      <svg fill="currentColor" viewBox="0 0 20 20" width="18" height="18" style="color: var(--md-on-surface-variant)">
        <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd"></path>
      </svg>
      <input type="range" min="0" max="100" v-model.number="volume" class="volume-slider" />
      <span class="body-small volume-value">{{ volume }}%</span>
    </div>
  </div>
  <button v-else class="fab-sound" @click="showControls = true">
    <svg fill="currentColor" viewBox="0 0 20 20" width="24" height="24">
      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"></path>
    </svg>
  </button>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';

const sounds = [
  { id: 'rain', name: '雨声', icon: '🌧️', frequency: 'pink' },
  { id: 'forest', name: '森林', icon: '🌲', frequency: 'brown' },
  { id: 'cafe', name: '咖啡厅', icon: '☕', frequency: 'pink' },
  { id: 'waves', name: '海浪', icon: '🌊', frequency: 'brown' },
  { id: 'fire', name: '篝火', icon: '🔥', frequency: 'brown' },
  { id: 'wind', name: '风声', icon: '💨', frequency: 'pink' }
];

const showControls = ref(false);
const currentSound = ref(null);
const isPlaying = ref(false);
const volume = ref(30);

let audioCtx = null;
let noiseNode = null;
let gainNode = null;

const createNoise = (type) => {
  if (audioCtx) audioCtx.close();
  
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  gainNode = audioCtx.createGain();
  gainNode.connect(audioCtx.destination);
  gainNode.gain.value = volume.value / 100;
  
  const bufferSize = 2 * audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  
  if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  } else {
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
  }
  
  noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = buffer;
  noiseNode.loop = true;
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  
  noiseNode.connect(filter);
  filter.connect(gainNode);
  noiseNode.start();
};

const toggleSound = (sound) => {
  if (currentSound.value === sound.id && isPlaying.value) {
    stopSound();
  } else {
    currentSound.value = sound.id;
    createNoise(sound.frequency);
    isPlaying.value = true;
  }
};

const stopSound = () => {
  if (noiseNode) { noiseNode.stop(); noiseNode = null; }
  if (audioCtx) { audioCtx.close(); audioCtx = null; }
  isPlaying.value = false;
  currentSound.value = null;
};

watch(volume, (newVal) => {
  if (gainNode) gainNode.gain.value = newVal / 100;
});

onUnmounted(() => {
  stopSound();
});
</script>

<style scoped>
/* Material Design 排版 */
.title-medium { font-size: 16px; font-weight: 500; line-height: 24px; letter-spacing: 0.15px; }
.body-small { font-size: 12px; font-weight: 400; line-height: 16px; letter-spacing: 0.4px; }

/* Material Design FAB */
.fab-sound {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: var(--md-radius-lg);
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--md-shadow-3);
  z-index: 100;
  transition: all var(--md-transition);
}

.fab-sound:hover {
  box-shadow: var(--md-shadow-2);
  transform: scale(1.05);
}

/* 播放器面板 */
.sound-player {
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

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.player-header .title-medium {
  color: var(--md-on-surface);
}

.icon-button-sm {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--md-on-surface-variant);
  border-radius: var(--md-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--md-transition);
}

.icon-button-sm:hover {
  background-color: rgba(95, 99, 104, 0.08);
}

/* 音效芯片网格 */
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
  font-family: var(--md-font);
}

.sound-chip:hover {
  background: rgba(95, 99, 104, 0.08);
  border-color: var(--md-primary);
}

.sound-chip.active {
  background: var(--md-primary-container);
  border-color: var(--md-primary);
}

.sound-chip-icon {
  font-size: 24px;
}

.sound-chip-label {
  color: var(--md-on-surface-variant);
}

.sound-chip.active .sound-chip-label {
  color: var(--md-on-primary-container);
}

/* 音量控制 */
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
  color: var(--md-on-surface-variant);
  min-width: 32px;
  text-align: right;
}
</style>
