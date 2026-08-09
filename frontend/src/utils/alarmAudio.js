// Procedural Web Audio Engine for MediBridge Alarms

let activeAudioCtx = null;
let activeLoopTimer = null;

export const SOUND_PROFILES = [
  { id: 'gentle_chime', name: '🎵 Gentle Chime', description: 'Harmonic soft arpeggio (Recommended)' },
  { id: 'digital_pulse', name: '📟 Digital Pulse', description: 'Modern medical monitor beep pattern' },
  { id: 'soft_bell', name: '🔔 Soft Bell', description: 'Calm dual-tone ambient chime' },
  { id: 'emergency_alert', name: '🚨 High Priority Alert', description: 'Urgent dual-frequency pulse pattern' },
];

function getAudioContext() {
  const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtxClass) return null;

  if (!activeAudioCtx || activeAudioCtx.state === 'closed') {
    activeAudioCtx = new AudioCtxClass();
  }
  if (activeAudioCtx.state === 'suspended') {
    activeAudioCtx.resume();
  }
  return activeAudioCtx;
}

function playNote(ctx, freq, startTime, duration, type = 'sine', peakGain = 0.15) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    // Envelope: Attack and Exponential Decay
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch (err) {
    console.error('Audio synthesis error:', err);
  }
}

export function playSoundTone(profile = 'gentle_chime', volumeLevel = 0.8) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const vol = Math.max(0, Math.min(1, volumeLevel));

  if (profile === 'gentle_chime') {
    // E5, G#5, B5, E6 warm arpeggio chime
    const notes = [659.25, 830.61, 987.77, 1318.51];
    notes.forEach((freq, idx) => {
      playNote(ctx, freq, now + idx * 0.14, 0.6, 'sine', 0.14 * vol);
    });
  } else if (profile === 'digital_pulse') {
    // Medical monitor double pulse (880Hz / 1760Hz)
    playNote(ctx, 880, now, 0.12, 'triangle', 0.2 * vol);
    playNote(ctx, 880, now + 0.16, 0.12, 'triangle', 0.2 * vol);
    playNote(ctx, 1760, now + 0.38, 0.2, 'sine', 0.18 * vol);
  } else if (profile === 'soft_bell') {
    // C5 + E5 dual gong
    playNote(ctx, 523.25, now, 1.2, 'sine', 0.15 * vol);
    playNote(ctx, 659.25, now + 0.1, 1.1, 'sine', 0.12 * vol);
  } else if (profile === 'emergency_alert') {
    // Urgent rapid alert pulse
    playNote(ctx, 1046.5, now, 0.1, 'sawtooth', 0.12 * vol);
    playNote(ctx, 1318.5, now + 0.12, 0.1, 'sawtooth', 0.12 * vol);
    playNote(ctx, 1046.5, now + 0.24, 0.1, 'sawtooth', 0.12 * vol);
    playNote(ctx, 1318.5, now + 0.36, 0.18, 'sawtooth', 0.15 * vol);
  } else {
    // Default fallback 880Hz beep
    playNote(ctx, 880, now, 0.8, 'sine', 0.15 * vol);
  }
}

export function startAlarmLoop(profile = 'gentle_chime', volumeLevel = 0.8) {
  stopAlarmLoop();
  playSoundTone(profile, volumeLevel);

  activeLoopTimer = window.setInterval(() => {
    playSoundTone(profile, volumeLevel);
  }, 2200);
}

export function stopAlarmLoop() {
  if (activeLoopTimer) {
    clearInterval(activeLoopTimer);
    activeLoopTimer = null;
  }
  if (activeAudioCtx && activeAudioCtx.state === 'running') {
    activeAudioCtx.suspend().catch(() => {});
  }
}

export function testSound(profile = 'gentle_chime', volumeLevel = 0.8) {
  stopAlarmLoop();
  playSoundTone(profile, volumeLevel);
}
