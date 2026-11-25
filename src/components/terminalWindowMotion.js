const SLICE_COUNT = 14;
const DURATION = 300;
const FRAME_COUNT = 42;

const clamp = (value) => Math.max(0, Math.min(1, value));
const ease = (value) => value * value * (3 - 2 * value);
const mix = (from, to, progress) => from + (to - from) * progress;

// A rectangle-to-trapezoid projection. Neighboring strips share the same edge,
// so the window bends into a continuous funnel rather than shrinking as a box.
function projectStrip(left, right, width, height) {
  const perspective = left.height / right.height - 1;
  const a = right.x * (1 + perspective) - left.x;
  const b = right.top * (1 + perspective) - left.top;
  return `matrix3d(${a / width},${b / width},0,${perspective / width},0,${left.height / height},0,0,0,0,1,0,${left.x},${left.top},0,1)`;
}

function makeSnapshot(source, rect) {
  const snapshot = source.cloneNode(true);
  const style = getComputedStyle(source);
  snapshot.className = "terminal-motion__snapshot";
  snapshot.removeAttribute("data-window-state");
  snapshot.removeAttribute("role");
  snapshot.style.cssText = "";
  Object.assign(snapshot.style, {
    position: "absolute", top: "0", width: `${rect.width}px`, height: `${rect.height}px`,
    minHeight: "0", maxHeight: "none", margin: "0", boxSizing: "border-box",
    display: "flex", flexDirection: "column", overflow: "hidden",
    visibility: "visible", opacity: "1", transform: "none", animation: "none", transition: "none",
    border: style.border, borderRadius: style.borderRadius, background: style.background,
    color: style.color, fontFamily: style.fontFamily, fontSize: style.fontSize,
    fontWeight: style.fontWeight, lineHeight: style.lineHeight, letterSpacing: style.letterSpacing,
    boxShadow: style.boxShadow, pointerEvents: "none",
  });

  for (const element of [snapshot, ...snapshot.querySelectorAll("*")]) {
    element.removeAttribute("id");
    element.removeAttribute("autofocus");
    element.removeAttribute("aria-labelledby");
    element.removeAttribute("aria-describedby");
    element.removeAttribute("aria-controls");
  }
  const fields = source.querySelectorAll("input, textarea, select");
  snapshot.querySelectorAll("input, textarea, select").forEach((field, index) => {
    field.value = fields[index].value;
    if (field instanceof HTMLInputElement) field.setAttribute("value", field.value);
    if (field instanceof HTMLTextAreaElement) field.textContent = field.value;
  });
  const canvases = source.querySelectorAll("canvas");
  snapshot.querySelectorAll("canvas").forEach((canvas, index) => {
    try {
      const image = document.createElement("img");
      image.src = canvases[index].toDataURL();
      image.width = canvas.width; image.height = canvas.height;
      image.className = canvas.className;
      image.style.cssText = canvas.style.cssText;
      image.alt = "";
      canvas.replaceWith(image);
    } catch {
      // A restricted canvas can stay blank without interrupting minimization.
    }
  });
  return snapshot;
}

/**
 * Animate a frozen window into its navigation icon, or reverse that same path.
 * The caller owns the real window's visibility and open/minimized state.
 * finished resolves true on completion, false when canceled. cancel is idempotent.
 */
export default function animateTerminalWindow(source, launcher, direction = "minimize") {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches) return { finished: Promise.resolve(true), cancel() {} };
  if (!source?.isConnected || !launcher?.isConnected || document.hidden) {
    return { finished: Promise.resolve(false), cancel() {} };
  }
  const rect = source.getBoundingClientRect();
  const icon = launcher.querySelector(".sidebar-nav__icon") ?? launcher;
  const dock = icon.getBoundingClientRect();
  const launcherBounds = launcher.getBoundingClientRect();
  if (!rect.width || !rect.height || !dock.width || !dock.height) {
    return { finished: Promise.resolve(false), cancel() {} };
  }

  const overlay = document.createElement("div");
  overlay.dataset.terminalMotion = direction;
  overlay.setAttribute("aria-hidden", "true");
  overlay.inert = true;
  Object.assign(overlay.style, {
    position: "fixed", inset: "0", zIndex: "12002", overflow: "hidden",
    pointerEvents: "none", contain: "strict",
  });
  const template = makeSnapshot(source, rect);
  const dockX = dock.left + dock.width / 2;
  const dockY = dock.top + dock.height / 2;
  const targetWidth = Math.max(12, Math.min(24, dock.width));
  const targetHeight = Math.max(12, Math.min(24, dock.height));
  const entersFromLeft = dockX < rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const edgeAt = (u, time) => {
    const distance = entersFromLeft ? u : 1 - u;
    const lag = distance * 0.3;
    const progress = ease(clamp((time - lag) / (1 - lag)));
    const height = mix(rect.height, targetHeight, progress);
    return {
      x: mix(rect.left + rect.width * u, dockX + (u - 0.5) * targetWidth, progress),
      top: mix(centerY, dockY, progress) - height / 2,
      height,
    };
  };
  const slices = [];
  const animations = [];
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < SLICE_COUNT; index += 1) {
    const start = index / SLICE_COUNT;
    // Keep two source pixels under the next strip so perspective resampling
    // cannot expose bright seams against a light page while the funnel narrows.
    const end = Math.min(1, (index + 1) / SLICE_COUNT + 2 / rect.width);
    const width = (end - start) * rect.width;
    const slice = document.createElement("div");
    Object.assign(slice.style, {
      position: "absolute", left: "0", top: "0", width: `${width}px`, height: `${rect.height}px`,
      overflow: "hidden", transformOrigin: "0 0", willChange: "transform", backfaceVisibility: "hidden",
    });
    const snapshot = template.cloneNode(true);
    snapshot.style.left = `${-start * rect.width}px`;
    slice.append(snapshot);
    fragment.append(slice);
    const keyframes = Array.from({ length: FRAME_COUNT + 1 }, (_, frame) => {
      const time = frame / FRAME_COUNT;
      return {
        offset: time,
        transform: projectStrip(edgeAt(start, time), edgeAt(end, time), width, rect.height),
        opacity: time > 0.91 ? 1 - (time - 0.91) / 0.09 : 1,
      };
    });
    slices.push({ slice, snapshot, keyframes });
  }
  overlay.append(fragment);
  document.body.append(overlay);
  const scrollSource = source.querySelector(".terminal-window__body");
  if (scrollSource) {
    for (const { snapshot } of slices) {
      const body = snapshot.querySelector(".terminal-window__body");
      if (body) { body.scrollTop = scrollSource.scrollTop; body.scrollLeft = scrollSource.scrollLeft; }
    }
  }

  let settled = false;
  let resolve;
  const finished = new Promise((done) => { resolve = done; });
  const finish = (completed) => {
    if (settled) return;
    settled = true;
    observer.disconnect();
    launcherObserver.disconnect();
    window.removeEventListener("resize", cancel);
    window.removeEventListener("pagehide", cancel);
    document.removeEventListener("visibilitychange", onVisibility);
    motion.removeEventListener("change", onMotion);
    animations.forEach((animation) => animation.cancel());
    overlay.remove();
    resolve(completed);
  };
  const cancel = () => finish(false);
  const onVisibility = () => { if (document.hidden) cancel(); };
  const onMotion = () => { if (motion.matches) finish(true); };
  const observer = new MutationObserver(() => {
    if (!source.isConnected || !launcher.isConnected) cancel();
  });
  const launcherObserver = new ResizeObserver(() => {
    const current = launcher.getBoundingClientRect();
    if (Math.abs(current.width - launcherBounds.width) > 0.5
      || Math.abs(current.height - launcherBounds.height) > 0.5) cancel();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  launcherObserver.observe(launcher);
  window.addEventListener("resize", cancel);
  window.addEventListener("pagehide", cancel);
  document.addEventListener("visibilitychange", onVisibility);
  motion.addEventListener("change", onMotion);
  try {
    for (const { slice, keyframes } of slices) {
      animations.push(slice.animate(keyframes, {
        duration: DURATION, easing: "linear", fill: "both",
        direction: direction === "restore" ? "reverse" : "normal",
      }));
    }
    Promise.all(animations.map((animation) => animation.finished)).then(() => finish(true), cancel);
  } catch {
    cancel();
  }
  return { finished, cancel };
}
