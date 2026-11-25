import { useCallback, useEffect, useMemo, useRef } from "react";

function createTerminalSounds() {
  let context = null;
  let output = null;
  let noiseBuffer = null;
  let resuming = false;
  let disposed = false;
  let lastTypingAt = Number.NEGATIVE_INFINITY;
  const voices = new Set();

  const getContext = () => {
    if (context) return context;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    context = new AudioContextClass();
    output = context.createGain();
    output.gain.value = 0.32;
    output.connect(context.destination);
    noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.16), context.sampleRate);
    const samples = noiseBuffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = Math.random() * 2 - 1;
    }
    return context;
  };

  const trackVoice = (source, nodes) => {
    const voice = { source, nodes };
    voices.add(voice);
    source.onended = () => {
      voices.delete(voice);
      nodes.forEach((node) => node.disconnect());
    };
  };

  const playNow = (kind, key) => {
    if (disposed || context?.state !== "running") return;
    const closing = kind === "close";
    const heavy = key === "Enter" || key === " ";
    const deleting = key === "Backspace" || key === "Delete";
    const variation = 0.94 + Math.random() * 0.12;
    const duration = closing ? 0.1 : heavy ? 0.045 : 0.032;
    const at = context.currentTime + 0.001;

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = noiseBuffer;
    source.playbackRate.value = variation;
    filter.type = "bandpass";
    filter.frequency.value = (closing ? 950 : deleting ? 2300 : heavy ? 1150 : 1750) * variation;
    filter.Q.value = 0.8;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(closing ? 0.32 : 0.24, at + 0.0015);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(filter).connect(gain).connect(output);
    trackVoice(source, [source, filter, gain]);
    source.start(at);
    source.stop(at + duration + 0.005);

    // A short low resonance gives the noise a soft mechanical keycap sound.
    // The close button uses a longer, downward thock rather than another key.
    const tone = context.createOscillator();
    const toneGain = context.createGain();
    const frequency = (closing ? 280 : heavy ? 145 : 205) * variation;
    tone.type = "sine";
    tone.frequency.setValueAtTime(frequency, at);
    tone.frequency.exponentialRampToValueAtTime(closing ? 105 : frequency * 0.72, at + duration);
    toneGain.gain.setValueAtTime(0.0001, at);
    toneGain.gain.linearRampToValueAtTime(closing ? 0.14 : 0.065, at + 0.002);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    tone.connect(toneGain).connect(output);
    trackVoice(tone, [tone, toneGain]);
    tone.start(at);
    tone.stop(at + duration + 0.005);
  };

  const play = (kind, key = "") => {
    if (disposed) return;
    const requestedAt = performance.now();
    if (kind === "typing") {
      if (requestedAt - lastTypingAt < 25) return;
      lastTypingAt = requestedAt;
    }

    try {
      const audio = getContext();
      if (!audio || audio.state === "closed") return;
      if (audio.state === "running") {
        playNow(kind, key);
      } else if (!resuming) {
        // Keep only this gesture while unlocking audio, never a queued burst.
        resuming = true;
        void audio.resume().then(() => {
          resuming = false;
          if (disposed || performance.now() - requestedAt > 150) return;
          try {
            playNow(kind, key);
          } catch {
            // Unsupported or interrupted audio must not affect the terminal.
          }
        }).catch(() => { resuming = false; });
      }
    } catch {
      // The terminal remains usable if Web Audio is unavailable or blocked.
    }
  };

  return {
    play,
    dispose() {
      disposed = true;
      voices.forEach(({ source, nodes }) => {
        source.onended = null;
        try { source.stop(); } catch { /* A completed voice may already be stopped. */ }
        nodes.forEach((node) => node.disconnect());
      });
      voices.clear();
      output?.disconnect();
      if (context && context.state !== "closed") void context.close().catch(() => {});
      context = output = noiseBuffer = null;
    },
  };
}

export default function useTerminalSounds(soundEnabled = false) {
  const playerRef = useRef(null);

  useEffect(() => {
    if (!soundEnabled) return undefined;
    const player = createTerminalSounds();
    playerRef.current = player;
    return () => {
      player.dispose();
      if (playerRef.current === player) playerRef.current = null;
    };
  }, [soundEnabled]);

  const playTyping = useCallback((key = "") => playerRef.current?.play("typing", key), []);
  const playClose = useCallback(() => playerRef.current?.play("close"), []);
  return useMemo(() => ({ playTyping, playClose }), [playTyping, playClose]);
}
