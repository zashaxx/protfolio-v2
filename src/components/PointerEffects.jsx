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
    let pointerActive = false;
    let refreshUntil = 0;
    let currentColor = "";
    const page = document.querySelector(".portfolio-page");
    const frame = document.querySelector(".page-frame");
    const sidebar = document.querySelector(".desktop-sidebar");
    const colors = new Map();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const paint = canvas.getContext("2d", { willReadFrequently: true });
    const hasPopover = typeof cursor.showPopover === "function";

    if (!hasPopover) cursor.removeAttribute("popover");

    const parseColor = (value) => {
      if (colors.has(value)) return colors.get(value);
      if (!paint) return [255, 255, 255, 1];
      paint.clearRect(0, 0, 1, 1);
      paint.fillStyle = value;
      paint.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = paint.getImageData(0, 0, 1, 1).data;
      const color = [r, g, b, a / 255];
      if (colors.size >= 256) colors.clear();
      colors.set(value, color);
      return color;
    };

    const surfaceAt = (target) => {
      let r = 0, g = 0, b = 0, alpha = 0;
      for (let element = target; element; element = element.parentElement) {
        const style = window.getComputedStyle(element);
        if (alpha < 0.999) {
          const color = parseColor(style.backgroundColor);
          const coverage = color[3] * (1 - alpha);
          r += color[0] * coverage;
          g += color[1] * coverage;
          b += color[2] * coverage;
          alpha += coverage;
        }
        const opacity = Number(style.opacity);
        r *= opacity; g *= opacity; b *= opacity; alpha *= opacity;
      }
      return [r + 255 * (1 - alpha), g + 255 * (1 - alpha), b + 255 * (1 - alpha)];
    };

    const visibleSurfaceAt = (target) => {
      const background = surfaceAt(target);
      if (target?.closest("dialog[open]")) return background;

      // The fixed frame and inverse corner fills ignore pointer events, so
      // hit-testing alone would report the page behind these painted surfaces.
      let frameStyle;
      if (frame && frame.getClientRects().length) {
        frameStyle = window.getComputedStyle(frame);
        const bounds = frame.getBoundingClientRect();
        const thickness = parseFloat(frameStyle.borderTopWidth);
        const outerRadius = parseFloat(frameStyle.borderTopLeftRadius);
        const outerDx = Math.max(bounds.left + outerRadius - pointerX, 0, pointerX - (bounds.right - outerRadius));
        const outerDy = Math.max(bounds.top + outerRadius - pointerY, 0, pointerY - (bounds.bottom - outerRadius));
        if (outerDx * outerDx + outerDy * outerDy > outerRadius * outerRadius) {
          return frameStyle.boxShadow === "none" ? background : parseColor(frameStyle.borderTopColor);
        }
        const radius = Math.max(0, outerRadius - thickness);
        const left = bounds.left + thickness, right = bounds.right - thickness;
        const top = bounds.top + thickness, bottom = bounds.bottom - thickness;
        const dx = Math.max(left + radius - pointerX, 0, pointerX - (right - radius));
        const dy = Math.max(top + radius - pointerY, 0, pointerY - (bottom - radius));
        if (
          pointerX < left || pointerX > right || pointerY < top || pointerY > bottom ||
          dx * dx + dy * dy > radius * radius
        ) return parseColor(frameStyle.borderTopColor);
      }

      if (sidebar && page?.classList.contains("is-sidebar-collapsed")) {
        const bounds = sidebar.getBoundingClientRect();
        if (bounds.width > 0 && pointerX >= bounds.right - 1 && pointerX <= bounds.right + 32) {
          for (const pseudo of ["::before", "::after"]) {
            const style = window.getComputedStyle(sidebar, pseudo);
            const width = parseFloat(style.width), height = parseFloat(style.height);
            const left = bounds.right - parseFloat(style.right) - width;
            const top = pseudo === "::before"
              ? bounds.top + parseFloat(style.top)
              : bounds.bottom - parseFloat(style.bottom) - height;
            if (pointerX < left || pointerX > left + width || pointerY < top || pointerY > top + height) continue;
            const cy = pseudo === "::before" ? top + height : top;
            if (Math.hypot(pointerX - (left + width), pointerY - cy) < height - 0.5) continue;
            const color = parseColor(window.getComputedStyle(sidebar).getPropertyValue("--frame-color").trim());
            const opacity = Number(style.opacity) * color[3];
            return background.map((channel, index) => channel * (1 - opacity) + color[index] * opacity);
          }
        }
      }
      return background;
    };

    const ensureTopLayer = (reorder = false) => {
      if (!hasPopover) return;
      if (reorder && cursor.matches(":popover-open")) cursor.hidePopover();
      if (!cursor.matches(":popover-open")) cursor.showPopover();
    };

    const showCursor = () => {
      pointerActive = true;
      ensureTopLayer();
      document.documentElement.dataset.cursor = "dot";
      cursor.classList.add("is-visible");
    };

    const hideCursor = () => {
      pointerActive = false;
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = 0;
      cursor.classList.remove("is-visible", "is-interactive", "is-pressed");
      document.documentElement.removeAttribute("data-cursor");
      if (hasPopover && cursor.matches(":popover-open")) cursor.hidePopover();
    };

    const renderCursor = () => {
      frameId = 0;
      if (!pointerActive) return;
      const target = document.elementFromPoint(pointerX, pointerY);
      const channels = visibleSurfaceAt(target).slice(0, 3).map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      const color = luminance > 0.179 ? "#000" : "#fff";
      if (color !== currentColor) {
        cursor.style.setProperty("--cursor-color", color);
        currentColor = color;
      }
      cursor.classList.toggle("is-interactive", Boolean(isInteractive(target)));
      cursor.style.left = `${pointerX}px`;
      cursor.style.top = `${pointerY}px`;
      if (performance.now() < refreshUntil) frameId = window.requestAnimationFrame(renderCursor);
    };

    const requestRender = () => {
      if (pointerActive && !frameId) frameId = window.requestAnimationFrame(renderCursor);
    };

    const refreshAppearance = () => {
      // Follow live CSS color/width transitions, including a stationary pointer.
      refreshUntil = performance.now() + 650;
      requestRender();
    };

    const handlePointerMove = (event) => {
      if (
        !finePointer.matches || event.pointerType === "touch" ||
        (event.target instanceof Element && event.target.closest(".terminal-window__resize")) ||
        (!hasPopover && document.querySelector("dialog[open]"))
      ) {
        hideCursor();
        return;
      }
      pointerX = event.clientX;
      pointerY = event.clientY;
      showCursor();
      requestRender();
    };

    const handlePointerDown = (event) => {
      if (isInteractive(event.target)) {
        cursor.classList.add("is-pressed");
      }
    };

    const handlePointerUp = () => cursor.classList.remove("is-pressed");
    const handleCapabilityChange = () => { if (!finePointer.matches) hideCursor(); };
    const appearanceObserver = new MutationObserver(refreshAppearance);
    appearanceObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    if (page) appearanceObserver.observe(page, { attributes: true, attributeFilter: ["class"] });
    const dialogObserver = new MutationObserver((records) => {
      if (!records.some((record) => record.target instanceof HTMLDialogElement)) return;
      if (!hasPopover && document.querySelector("dialog[open]")) {
        hideCursor();
        return;
      }
      if (pointerActive) ensureTopLayer(true);
      refreshAppearance();
    });
    dialogObserver.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });

    document.documentElement.dataset.cursor = "dot";
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerUp, { passive: true });
    window.addEventListener("pointerleave", hideCursor);
    window.addEventListener("blur", hideCursor);
    window.addEventListener("scroll", requestRender, { passive: true, capture: true });
    window.addEventListener("resize", refreshAppearance, { passive: true });
    finePointer.addEventListener("change", handleCapabilityChange);

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
      window.removeEventListener("scroll", requestRender, true);
      window.removeEventListener("resize", refreshAppearance);
      finePointer.removeEventListener("change", handleCapabilityChange);
      appearanceObserver.disconnect();
      dialogObserver.disconnect();
      if (hasPopover && cursor.matches(":popover-open")) cursor.hidePopover();
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
      if (!target || target === previousTarget || target.closest("[data-ui-sound]")) {
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
      if (pressedTarget?.closest("[data-ui-sound]")) {
        pressedTarget = null;
        return;
      }
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

  return <div ref={cursorRef} className="cursor-dot" popover="manual" aria-hidden="true" />;
}
