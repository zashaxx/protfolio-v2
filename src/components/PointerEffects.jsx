import { useEffect, useRef } from "react";

const interactiveSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [role="button"], [role="tab"], [tabindex="0"]';

const isInteractive = (target) =>
  target instanceof Element ? target.closest(interactiveSelector) : null;

export default function PointerEffects({ soundEnabled = false }) {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    if (!cursor || !finePointer.matches) {
      return undefined;
    }

    let frameId = 0;
    let pointerX = 0;
    let pointerY = 0;

    const showCursor = () => {
      document.documentElement.dataset.cursor = "dot";
      cursor.classList.add("is-visible");
    };

    const hideCursor = () => {
      cursor.classList.remove("is-visible", "is-interactive", "is-pressed");
      document.documentElement.removeAttribute("data-cursor");
    };

    const renderCursor = () => {
      frameId = 0;
      cursor.style.left = `${pointerX}px`;
      cursor.style.top = `${pointerY}px`;
    };

    const handlePointerMove = (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      showCursor();
      cursor.classList.toggle("is-interactive", Boolean(isInteractive(event.target)));

      if (!frameId) {
        frameId = window.requestAnimationFrame(renderCursor);
      }
    };

    const handlePointerDown = (event) => {
      if (isInteractive(event.target)) {
        cursor.classList.add("is-pressed");
      }
    };

    const handlePointerUp = () => cursor.classList.remove("is-pressed");

    document.documentElement.dataset.cursor = "dot";
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerUp, { passive: true });
    window.addEventListener("pointerleave", hideCursor);
    window.addEventListener("blur", hideCursor);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("pointerleave", hideCursor);
      window.removeEventListener("blur", hideCursor);
      document.documentElement.removeAttribute("data-cursor");
    };
  }, []);

  useEffect(() => {
    if (!soundEnabled) {
      return undefined;
    }

    let audioContext = null;
    let lastHoverAt = Number.NEGATIVE_INFINITY;
    let pressedTarget = null;
    let disposed = false;

    const getContext = () => {
      if (audioContext) {
        return audioContext;
      }

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        return null;
      }

      audioContext = new AudioContextClass();
      return audioContext;
    };

    const unlockContext = async () => {
      const context = getContext();
      if (!context || disposed) {
        return null;
      }

      if (context.state === "suspended") {
        try {
          await context.resume();
        } catch {
          return null;
        }
      }

      return context.state === "running" && !disposed ? context : null;
    };

    const addNoise = (context, output, options, startAt) => {
      const duration = options.attack + options.decay + 0.05;
      const frameCount = Math.max(1, Math.floor(duration * context.sampleRate));
      const buffer = context.createBuffer(1, frameCount, context.sampleRate);
      const samples = buffer.getChannelData(0);

      for (let index = 0; index < frameCount; index += 1) {
        samples[index] = Math.random() * 2 - 1;
      }

      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = buffer;
      filter.type = "bandpass";
      filter.frequency.value = options.frequency;
      filter.Q.value = options.q;
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(options.peak, startAt + options.attack);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        startAt + options.attack + options.decay,
      );
      source.connect(filter).connect(gain).connect(output);
      source.start(startAt);
      source.stop(startAt + duration);
    };

    const addTone = (context, output, options, startAt) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(options.frequency, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(options.peak, startAt + options.attack);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        startAt + options.attack + options.decay,
      );
      oscillator.connect(gain).connect(output);
      oscillator.start(startAt);
      oscillator.stop(startAt + options.attack + options.decay + 0.05);
    };

    const play = async (name) => {
      const context = await unlockContext();
      if (!context) {
        return;
      }

      const output = context.createGain();
      output.gain.value = 2.4;
      output.connect(context.destination);
      const startAt = context.currentTime + 0.001;

      if (name === "tick") {
        addNoise(
          context,
          output,
          { frequency: 5400, q: 1.8, attack: 0.001, decay: 0.018, peak: 0.14 },
          startAt,
        );
        addTone(
          context,
          output,
          { frequency: 2600, attack: 0.001, decay: 0.012, peak: 0.018 },
          startAt,
        );
      } else if (name === "press") {
        addNoise(
          context,
          output,
          { frequency: 1700, q: 1.4, attack: 0.001, decay: 0.02, peak: 0.13 },
          startAt,
        );
      } else {
        addNoise(
          context,
          output,
          { frequency: 4600, q: 1.8, attack: 0.001, decay: 0.016, peak: 0.12 },
          startAt,
        );
        addTone(
          context,
          output,
          { frequency: 3200, attack: 0.001, decay: 0.05, peak: 0.02 },
          startAt + 0.006,
        );
      }

      window.setTimeout(() => output.disconnect(), 120);
    };

    const isFineMouse = (event) =>
      event.pointerType === "mouse" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const handlePointerOver = (event) => {
      if (!isFineMouse(event)) {
        return;
      }

      const target = isInteractive(event.target);
      const previousTarget = isInteractive(event.relatedTarget);
      if (!target || target === previousTarget) {
        return;
      }

      const now = performance.now();
      if (now - lastHoverAt < 150) {
        return;
      }
      lastHoverAt = now;
      void play("tick");
    };

    const handlePointerDown = (event) => {
      if (!isFineMouse(event)) {
        return;
      }
      pressedTarget = isInteractive(event.target);
      if (pressedTarget) {
        void play("press");
      }
    };

    const handlePointerUp = (event) => {
      if (pressedTarget && isFineMouse(event)) {
        void play("release");
      }
      pressedTarget = null;
    };

    document.addEventListener("pointerover", handlePointerOver, { passive: true });
    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("pointercancel", handlePointerUp, { passive: true });

    return () => {
      disposed = true;
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);
      if (audioContext && audioContext.state !== "closed") {
        void audioContext.close();
      }
    };
  }, [soundEnabled]);

  return <div ref={cursorRef} className="cursor-dot" aria-hidden="true" />;
}
