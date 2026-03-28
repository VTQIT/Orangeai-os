import { useCallback, useRef } from 'react';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/** Short swoosh sound for folder/category changes */
export function playSwoosh() {
  try {
    const ctx = getAudioContext();
    const duration = 0.18;
    const now = ctx.currentTime;

    // White noise burst filtered with a bandpass sweep
    const bufferSize = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(3000, now + duration * 0.3);
    filter.frequency.exponentialRampToValueAtTime(600, now + duration);
    filter.Q.value = 1.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);
  } catch {}
}

/** Subtle drawer open/close sound */
export function playDrawerSound(opening: boolean) {
  try {
    const ctx = getAudioContext();
    const duration = 0.25;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';

    if (opening) {
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + duration);
    } else {
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + duration);
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  } catch {}
}

/** Iconic intro chime for Orange AI OS */
export function playIntroSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Three-note ascending chime
    const notes = [
      { freq: 523.25, start: 0, dur: 0.6 },      // C5
      { freq: 659.25, start: 0.15, dur: 0.5 },    // E5
      { freq: 783.99, start: 0.3, dur: 0.8 },     // G5
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.12, now + start + 0.05);
      gain.gain.setValueAtTime(0.12, now + start + dur * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur);
    });

    // Subtle shimmer overtone
    const shimmer = ctx.createOscillator();
    shimmer.type = 'triangle';
    shimmer.frequency.value = 1046.5; // C6
    const sGain = ctx.createGain();
    sGain.gain.setValueAtTime(0, now + 0.4);
    sGain.gain.linearRampToValueAtTime(0.05, now + 0.5);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    shimmer.connect(sGain).connect(ctx.destination);
    shimmer.start(now + 0.4);
    shimmer.stop(now + 1.2);
  } catch {}
}

/** Celebratory chime for order confirmations */
export function playCelebrationSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Ascending fanfare notes
    const notes = [
      { freq: 523.25, start: 0, dur: 0.25 },     // C5
      { freq: 659.25, start: 0.12, dur: 0.25 },   // E5
      { freq: 783.99, start: 0.24, dur: 0.25 },   // G5
      { freq: 1046.5, start: 0.36, dur: 0.6 },    // C6 (hold)
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.15, now + start + 0.03);
      gain.gain.setValueAtTime(0.15, now + start + dur * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur);
    });

    // Sparkle overtones
    [1318.5, 1568].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      const s = 0.5 + i * 0.15;
      gain.gain.setValueAtTime(0, now + s);
      gain.gain.linearRampToValueAtTime(0.06, now + s + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + s + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + s);
      osc.stop(now + s + 0.4);
    });
  } catch {}
}
