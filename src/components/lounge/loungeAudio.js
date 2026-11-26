// All lounge audio is generated locally. The AudioContext is only created from
// unlock(), which the game calls in response to a keyboard or pointer gesture.
export function createLoungeAudio() {
  let context = null;
  let output = null;
  let noise = null;
  let enabled = false;
  let paused = false;
  let music = false;
  let disposed = false;
  let unlocked = false;
  let pendingResume = null;
  let timer = null;
  let nextBeatAt = 0;
  let beat = 0;
  const voices = new Set();
  const lastPlayed = new Map();
  const beatLength = 60 / 76;
  const chords = [
    [48, 60, 64, 67, 71],
    [45, 57, 60, 64, 67],
    [41, 57, 60, 64, 69],
    [43, 55, 59, 62, 67],
  ];
  const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);
  const active = () => !disposed && enabled && !paused && context?.state === "running";

  function forget(voice) {
    voices.delete(voice);
    for (const node of voice.nodes) {
      try { node.disconnect(); } catch { /* A closing context can disconnect first. */ }
    }
  }

  function register(source, envelope, nodes, group) {
    const voice = { source, envelope, nodes, group };
    voices.add(voice);
    source.onended = () => forget(voice);
  }

  function stopVoices(group, immediately = false) {
    if (!context) return;
    const now = context.currentTime;
    for (const voice of voices) {
      if (group && voice.group !== group) continue;
      try {
        voice.envelope.gain.cancelScheduledValues(now);
        voice.envelope.gain.setTargetAtTime(0, now, 0.006);
        voice.source.stop(immediately ? now : now + 0.025);
      } catch {
        // A voice can finish between the control event and this iteration.
        forget(voice);
      }
    }
  }

  function tone(hz, duration, volume = 0.12, options = {}) {
    if (!active()) return;
    const at = options.at ?? context.currentTime + (options.delay ?? 0);
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const filter = context.createBiquadFilter();
    oscillator.type = options.type ?? "sine";
    oscillator.frequency.setValueAtTime(hz, at);
    if (options.endHz) oscillator.frequency.exponentialRampToValueAtTime(options.endHz, at + duration);
    filter.type = "lowpass";
    filter.frequency.value = options.filter ?? 2400;
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(volume, at + Math.min(0.012, duration / 5));
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(filter).connect(envelope).connect(output);
    register(oscillator, envelope, [oscillator, filter, envelope], options.group ?? "effect");
    oscillator.start(at);
    oscillator.stop(at + duration + 0.01);
  }

  function rustle(duration, volume = 0.1, options = {}) {
    if (!active() || !noise) return;
    const at = options.at ?? context.currentTime + (options.delay ?? 0);
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    source.buffer = noise;
    source.loop = true;
    filter.type = options.type ?? "bandpass";
    filter.frequency.setValueAtTime(options.hz ?? 900, at);
    filter.Q.value = options.q ?? 0.65;
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(volume, at + Math.min(duration / 4, 0.015));
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(filter).connect(envelope).connect(output);
    register(source, envelope, [source, filter, envelope], options.group ?? "effect");
    source.start(at, Math.random() * noise.duration);
    source.stop(at + duration + 0.01);
  }

  function clearMusicTimer() {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
  }

  function scheduleMusic() {
    clearMusicTimer();
    if (!active() || !music) return;
    const now = context.currentTime;
    // Restart the phrase after a suspended tab; never replay missed beats.
    if (nextBeatAt < now - 0.15) nextBeatAt = now + 0.045;
    while (nextBeatAt < now + 0.18) {
      const chord = chords[Math.floor(beat / 8) % chords.length];
      const localBeat = beat % 8;
      if (localBeat === 0 || localBeat === 4) {
        chord.slice(1).forEach((note, index) => {
          tone(frequency(note), 1.65, 0.028, {
            at: nextBeatAt + index * 0.021, type: "triangle", filter: 1100, group: "music",
          });
        });
        tone(frequency(chord[0]), 0.85, 0.07, { at: nextBeatAt, filter: 300, group: "music" });
      }
      const melodyNote = chord[1 + [2, 1, 3, 2, 1, 3, 2, 0][localBeat]] + 12;
      if (localBeat !== 3 && localBeat !== 7) {
        tone(frequency(melodyNote), 0.52, 0.018, { at: nextBeatAt + 0.03, filter: 1600, group: "music" });
      }
      // Quiet brushed hats and a round kick keep the loop relaxed.
      rustle(0.055, 0.017, { at: nextBeatAt + 0.025, hz: 4300, type: "highpass", group: "music" });
      if (localBeat % 2 === 0) {
        tone(105, 0.15, 0.05, { at: nextBeatAt, endHz: 44, group: "music" });
      } else {
        rustle(0.09, 0.023, { at: nextBeatAt + 0.025, hz: 1500, group: "music" });
      }
      beat += 1;
      nextBeatAt += beatLength;
    }
    timer = window.setTimeout(scheduleMusic, 90);
  }

  function syncState() {
    clearMusicTimer();
    if (!context || disposed) return;
    const audible = enabled && !paused;
    const now = context.currentTime;
    output.gain.cancelScheduledValues(now);
    output.gain.setTargetAtTime(audible ? 0.42 : 0, now, 0.012);
    if (!audible) {
      stopVoices();
      nextBeatAt = 0;
      return;
    }
    if (context.state === "running") scheduleMusic();
  }

  function resume() {
    if (!context || disposed || !enabled || paused) return Promise.resolve(false);
    if (context.state === "running") {
      syncState();
      return Promise.resolve(true);
    }
    if (pendingResume) return pendingResume;
    try {
      pendingResume = context.resume().then(() => {
        pendingResume = null;
        if (disposed) return false;
        syncState();
        return active();
      }).catch(() => {
        pendingResume = null;
        return false;
      });
      return pendingResume;
    } catch {
      return Promise.resolve(false);
    }
  }

  function unlock() {
    if (disposed) return Promise.resolve(false);
    unlocked = true;
    if (!context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return Promise.resolve(false);
      try {
        context = new AudioContextClass();
        output = context.createGain();
        output.gain.value = 0;
        output.connect(context.destination);
        noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.4), context.sampleRate);
        const data = noise.getChannelData(0);
        for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
      } catch {
        if (context && context.state !== "closed") void context.close().catch(() => {});
        context = output = noise = null;
        return Promise.resolve(false);
      }
    }
    return resume();
  }

  function play(kind) {
    if (!active()) return;
    const now = context.currentTime;
    const cooldown = kind === "step" ? 0.12 : kind === "collision" ? 0.3 : 0.07;
    if (now - (lastPlayed.get(kind) ?? -Infinity) < cooldown) return;
    lastPlayed.set(kind, now);
    try {
      switch (kind) {
        case "step":
          rustle(0.045, 0.1, { hz: 360 + Math.random() * 130 });
          tone(95 + Math.random() * 25, 0.055, 0.06, { endHz: 65 });
          break;
        case "collision":
          tone(150, 0.08, 0.06, { endHz: 75 });
          rustle(0.035, 0.04, { hz: 280 });
          break;
        case "coin":
          tone(1108, 0.15, 0.1);
          tone(1661, 0.23, 0.065, { delay: 0.075 });
          break;
        case "dispense":
          rustle(0.38, 0.14, { hz: 430 });
          tone(95, 0.28, 0.06, { type: "triangle", endHz: 55 });
          tone(190, 0.075, 0.12, { delay: 0.28, endHz: 85 });
          break;
        case "snack":
          [0, 0.055, 0.15].forEach((delay) => rustle(0.1, 0.1, { delay, hz: 1900 }));
          tone(220, 0.07, 0.05, { delay: 0.18, endHz: 100 });
          break;
        case "sit":
          rustle(0.18, 0.07, { hz: 450 });
          tone(170, 0.14, 0.06, { endHz: 85 });
          break;
        case "stand":
          rustle(0.12, 0.05, { hz: 600 });
          tone(110, 0.1, 0.04, { endHz: 180 });
          break;
        case "toggle":
          tone(650, 0.06, 0.07, { type: "triangle" });
          tone(950, 0.08, 0.04, { delay: 0.045 });
          break;
        case "water":
          [420, 650, 510, 880, 740].forEach((hz, index) => {
            tone(hz, 0.13, 0.07, { delay: index * 0.065, endHz: hz * 1.8 });
          });
          rustle(0.35, 0.035, { hz: 2800 });
          break;
        case "arcade":
          [60, 64, 67, 72, 76, 79].forEach((note, index) => {
            tone(frequency(note), 0.14, 0.055, { delay: index * 0.075, type: "square", filter: 1800 });
          });
          break;
        case "page":
          rustle(0.14, 0.1, { hz: 1700 });
          rustle(0.12, 0.06, { delay: 0.1, hz: 2300 });
          break;
        case "plant":
          [740, 988, 1175].forEach((hz, index) => tone(hz, 0.3, 0.045, { delay: index * 0.09 }));
          break;
        case "hello":
          [392, 494, 587].forEach((hz, index) => tone(hz, 0.15, 0.055, { delay: index * 0.09 }));
          break;
        default:
          tone(520, 0.09, 0.06);
      }
    } catch {
      // Audio interruptions must never interrupt input or gameplay.
    }
  }

  return {
    unlock,
    play,
    setEnabled(value) {
      enabled = Boolean(value);
      syncState();
      if (enabled && unlocked) void resume();
    },
    setPaused(value) {
      paused = Boolean(value);
      syncState();
      if (!paused && unlocked) void resume();
    },
    setMusic(value) {
      const next = Boolean(value);
      if (music === next) return;
      music = next;
      nextBeatAt = 0;
      if (!music) stopVoices("music");
      syncState();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      clearMusicTimer();
      stopVoices(undefined, true);
      for (const voice of voices) {
        voice.source.onended = null;
        forget(voice);
      }
      lastPlayed.clear();
      output?.disconnect();
      if (context && context.state !== "closed") void context.close().catch(() => {});
      context = output = noise = null;
    },
  };
}
