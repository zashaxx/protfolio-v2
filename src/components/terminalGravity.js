import Matter from "matter-js";
import { measureScene, textFragments } from "./terminalGravityScene";

const { Bodies, Body, Bounds, Composite, Engine, Events, Mouse, MouseConstraint, Sleeping } = Matter;
const STEP = 1000 / 60;
const MAX_STEPS = 2;
const MAX_CANVAS_PIXELS = 3_000_000;
let finishPreviousScene = null;

export default function startGravity(onViewportChange) {
  finishPreviousScene?.();
  const root = document.documentElement;
  const main = document.querySelector("#main-content");
  const terminal = document.querySelector(".terminal-window");
  const launcher = document.querySelector(".terminal-widget");
  if (!main || !terminal || !launcher) return () => {};

  const width = window.innerWidth, height = window.innerHeight;
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(MAX_CANVAS_PIXELS / (width * height)));
  const canvas = document.createElement("canvas");
  canvas.className = "terminal-effect terminal-effect--gravity";
  canvas.setAttribute("aria-label", "Gravity scene. Drag letters and blocks. Escape restores the page.");
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
  const context = canvas.getContext("2d");
  if (!context) return () => {};

  const roots = [main, document.querySelector(".desktop-sidebar")].filter(Boolean);
  const { blocks, runs } = measureScene(roots, width, height);
  const bodyBudget = Math.min(420, Math.max(220, Math.round(width * height / 4000)));
  const fragments = textFragments(runs, Math.max(1, bodyBudget - blocks.length));
  const textSources = new Set(fragments.map((fragment) => fragment.source));
  const engine = Engine.create({ enableSleeping: true, positionIterations: 6, velocityIterations: 4 });
  engine.gravity.y = 1.1;
  const items = [];
  const touching = new Set();
  const fontMetrics = new Map();
  const measure = document.createElement("canvas").getContext("2d");
  const atlas = document.createElement("canvas");
  const atlasContext = atlas.getContext("2d");
  const settledLayer = document.createElement("canvas");
  settledLayer.className = "terminal-effect terminal-effect--gravity-resting";
  settledLayer.setAttribute("aria-hidden", "true");
  settledLayer.style.width = `${width}px`; settledLayer.style.height = `${height}px`;
  let settledContext = null, settledDirty = true, settledBounds = null, paintBounds = null;

  for (const fragment of fragments) {
    const body = Bodies.rectangle(fragment.origin.x, fragment.origin.y, Math.max(2, fragment.width * 0.9), Math.max(4, fragment.size * 0.72), {
      restitution: 0.08, friction: 0.6, frictionStatic: 0.9, frictionAir: 0.018, density: 0.002, sleepThreshold: 28, slop: 0.1,
    });
    Body.setMass(body, Math.min(2.5, Math.max(0.5, Math.sqrt(body.area) / 20)));
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.04);
    items.push({ ...fragment, kind: "glyph", body });
  }
  for (const block of blocks) {
    const origin = { x: block.rect.left + block.rect.width / 2, y: block.rect.top + block.rect.height / 2 };
    const body = Bodies.rectangle(origin.x, origin.y, block.rect.width, Math.max(4, block.rect.height), {
      restitution: 0.1, friction: 0.65, frictionStatic: 0.9, frictionAir: 0.02, density: 0.002, sleepThreshold: 28, slop: 0.1,
    });
    // Large cards must not be thousands of times heavier than a small letter:
    // extreme mass ratios make the contact solver crush and jitter the pile.
    Body.setMass(body, Math.min(6, Math.max(2, Math.sqrt(body.area) / 80)));
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.025);
    items.push({ ...block, kind: "block", origin, body });
  }
  items.sort((a, b) => a.origin.y - b.origin.y || a.origin.x - b.origin.x);
  for (const item of items) {
    item.previousX = item.displayX = item.body.position.x;
    item.previousY = item.displayY = item.body.position.y;
    item.previousAngle = item.displayAngle = item.body.angle;
    item.lastX = item.lastY = item.lastAngle = NaN;
    item.wasSleeping = false;
    item.quietFrames = 0;
    item.restX = item.body.position.x; item.restY = item.body.position.y; item.restAngle = item.body.angle;
    item.radius = Math.hypot(item.kind === "block" ? item.rect.width : item.width, item.kind === "block" ? item.rect.height : item.size) / 2;
  }

  // One atlas shares a single backing surface instead of hundreds of tiny
  // canvases/textures. All font shaping and packing happen outside the loop.
  const buildAtlas = () => {
    const entries = [], cache = new Map();
    let area = 0, widest = 0;
    for (const item of items) {
      if (item.kind !== "glyph") continue;
      const offsets = item.glyphs.map((glyph) => `${glyph.char}:${(glyph.left - item.glyphs[0].left).toFixed(2)}`).join(",");
      const key = `${item.font}|${item.color}|${offsets}`;
      if (!cache.has(key)) {
        const entry = { item, width: Math.ceil((item.width + 6) * ratio), height: Math.ceil(item.size * 2 * ratio) };
        cache.set(key, entry); entries.push(entry);
        area += (entry.width + 2) * (entry.height + 2); widest = Math.max(widest, entry.width + 2);
      }
      item.sprite = cache.get(key);
    }
    entries.sort((a, b) => b.height - a.height);
    const atlasWidth = Math.max(widest, 256, Math.min(2048, 2 ** Math.ceil(Math.log2(Math.max(1, Math.sqrt(area))))));
    let x = 1, y = 1, rowHeight = 0;
    for (const entry of entries) {
      if (x + entry.width + 1 > atlasWidth) { x = 1; y += rowHeight + 2; rowHeight = 0; }
      entry.x = x; entry.y = y; x += entry.width + 2; rowHeight = Math.max(rowHeight, entry.height);
    }
    atlas.width = atlasWidth; atlas.height = Math.max(1, y + rowHeight + 1);
    for (const entry of entries) {
      const item = entry.item;
      if (!fontMetrics.has(item.font)) {
        measure.font = item.font;
        const metrics = measure.measureText("Hg");
        fontMetrics.set(item.font, { ascent: metrics.fontBoundingBoxAscent ?? item.size * 0.8, descent: metrics.fontBoundingBoxDescent ?? item.size * 0.2 });
      }
      const metrics = fontMetrics.get(item.font);
      atlasContext.setTransform(ratio, 0, 0, ratio, entry.x, entry.y);
      atlasContext.font = item.font; atlasContext.fillStyle = item.color; atlasContext.textBaseline = "alphabetic";
      const baseline = entry.height / ratio / 2 + (metrics.ascent - metrics.descent) / 2;
      for (const glyph of item.glyphs) atlasContext.fillText(glyph.char, glyph.left - item.origin.x + entry.width / ratio / 2, baseline);
    }
    settledDirty = true;
  };
  buildAtlas();

  const bounds = terminal.getBoundingClientRect();
  const staticOptions = { isStatic: true, collisionFilter: { category: 2, mask: 1 } };
  const windowBody = Bodies.rectangle(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2, bounds.width, bounds.height, staticOptions);
  const walls = [
    Bodies.rectangle(width / 2, height + 142, width * 2, 300, staticOptions),
    Bodies.rectangle(-146, height / 2, 300, height * 3, staticOptions),
    Bodies.rectangle(width + 146, height / 2, 300, height * 3, staticOptions),
    Bodies.rectangle(width / 2, -500, width * 2, 300, staticOptions),
    windowBody,
  ];
  const launcherBounds = launcher.querySelector("button").getBoundingClientRect();
  walls.push(Bodies.rectangle(launcherBounds.left + launcherBounds.width / 2,
    launcherBounds.top + launcherBounds.height / 2, launcherBounds.width, launcherBounds.height, staticOptions));
  // Leave the launcher visible and clickable through the drag surface.
  const launcherCutout = `path(evenodd, "M0 0H${width}V${height}H0Z M${launcherBounds.left} ${launcherBounds.top}V${launcherBounds.bottom}H${launcherBounds.right}V${launcherBounds.top}Z")`;
  canvas.style.clipPath = settledLayer.style.clipPath = launcherCutout;
  document.body.appendChild(canvas);
  const mouse = Mouse.create(canvas);
  mouse.pixelRatio = ratio;
  const constraint = MouseConstraint.create(engine, { mouse, collisionFilter: { mask: 1 },
    constraint: { stiffness: 0.2, damping: 0.12, render: { visible: false } } });
  Composite.add(engine.world, [...items.map((item) => item.body), ...walls, constraint]);
  Events.on(constraint, "startdrag", () => { canvas.dataset.dragging = "true"; });
  Events.on(constraint, "enddrag", () => { delete canvas.dataset.dragging; });

  let frame = 0, last = 0, accumulator = STEP, stopped = false, finished = false;
  let windowDirty = false, themeDirty = false;
  const refreshBitmaps = () => {
    const colors = new Map();
    for (const source of textSources) colors.set(source, getComputedStyle(source).color);
    for (const item of items) {
      if (item.kind !== "glyph") continue;
      item.color = colors.get(item.source);
    }
    buildAtlas();
    themeDirty = false;
  };
  const extendBounds = (bounds, left, top, right, bottom) => {
    left = Math.max(0, Math.floor(left)); top = Math.max(0, Math.floor(top));
    right = Math.min(canvas.width, Math.ceil(right)); bottom = Math.min(canvas.height, Math.ceil(bottom));
    if (!bounds) return { left, top, right, bottom };
    bounds.left = Math.min(bounds.left, left); bounds.top = Math.min(bounds.top, top);
    bounds.right = Math.max(bounds.right, right); bounds.bottom = Math.max(bounds.bottom, bottom);
    return bounds;
  };
  const paintGlyph = (target, item, x, y, angle, scale = 1) => {
    if (x + item.width < 0 || x - item.width > width || y + item.size * 2 < 0 || y - item.size * 2 > height) return;
    const sprite = item.sprite, cos = Math.cos(angle) * scale, sin = Math.sin(angle) * scale;
    const halfWidth = (Math.abs(cos) * sprite.width + Math.abs(sin) * sprite.height) / 2 + 2;
    const halfHeight = (Math.abs(sin) * sprite.width + Math.abs(cos) * sprite.height) / 2 + 2;
    const left = x * ratio - halfWidth, top = y * ratio - halfHeight;
    const right = x * ratio + halfWidth, bottom = y * ratio + halfHeight;
    if (target === context) paintBounds = extendBounds(paintBounds, left, top, right, bottom);
    else settledBounds = extendBounds(settledBounds, left, top, right, bottom);
    target.setTransform(cos * ratio, sin * ratio, -sin * ratio, cos * ratio, x * ratio, y * ratio);
    target.drawImage(atlas, sprite.x, sprite.y, sprite.width, sprite.height,
      -sprite.width / ratio / 2, -sprite.height / ratio / 2, sprite.width / ratio, sprite.height / ratio);
  };
  const paintItem = (item, x, y, angle, scale = 1) => {
    item.displayX = x; item.displayY = y; item.displayAngle = angle;
    if (item.kind === "block") {
      if (Math.abs(x - item.lastX) < 0.02 && Math.abs(y - item.lastY) < 0.02 && Math.abs(angle - item.lastAngle) < 0.0001 && scale === 1) return;
      const base = item.baseTransform === "none" ? "" : item.baseTransform;
      item.element.style.transform = `translate3d(${x - item.origin.x}px, ${y - item.origin.y}px, 0) rotate(${angle}rad) scale(${scale}) ${base}`;
      item.lastX = x; item.lastY = y; item.lastAngle = angle;
      return;
    }
    paintGlyph(context, item, x, y, angle, scale);
  };
  const clear = () => {
    context.setTransform(1, 0, 0, 1, 0, 0);
    if (paintBounds) context.clearRect(paintBounds.left, paintBounds.top, paintBounds.right - paintBounds.left, paintBounds.bottom - paintBounds.top);
    paintBounds = null;
  };
  const rebuildSettledLayer = () => {
    if (!settledContext) {
      settledLayer.width = canvas.width; settledLayer.height = canvas.height;
      settledContext = settledLayer.getContext("2d");
      canvas.before(settledLayer);
    }
    settledContext.setTransform(1, 0, 0, 1, 0, 0);
    if (settledBounds) settledContext.clearRect(settledBounds.left, settledBounds.top, settledBounds.right - settledBounds.left, settledBounds.bottom - settledBounds.top);
    settledBounds = null;
    for (const item of items) {
      if (item.kind !== "glyph" || !item.body.isSleeping) continue;
      const { position, angle } = item.body;
      item.displayX = position.x; item.displayY = position.y; item.displayAngle = angle;
      paintGlyph(settledContext, item, position.x, position.y, angle);
    }
    settledDirty = false;
  };
  const render = (alpha) => {
    for (const item of items) {
      if (item.kind !== "glyph") continue;
      if (item.wasSleeping !== item.body.isSleeping) { item.wasSleeping = item.body.isSleeping; settledDirty = true; }
    }
    if (settledDirty) rebuildSettledLayer();
    clear();
    for (const item of items) {
      const body = item.body;
      if (item.kind === "glyph" && body.isSleeping) continue;
      const mix = body.isSleeping ? 1 : alpha;
      paintItem(item, item.previousX + (body.position.x - item.previousX) * mix,
        item.previousY + (body.position.y - item.previousY) * mix,
        item.previousAngle + (body.angle - item.previousAngle) * mix);
    }
  };
  const updateTerminalBounds = () => {
    const rect = terminal.getBoundingClientRect();
    const previous = { min: { ...windowBody.bounds.min }, max: { ...windowBody.bounds.max } };
    Body.setPosition(windowBody, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    for (const item of items) {
      if (item.body.isSleeping && (Bounds.overlaps(item.body.bounds, previous) || Bounds.overlaps(item.body.bounds, windowBody.bounds))) Sleeping.set(item.body, false);
    }
    windowDirty = false;
  };
  const simulate = (now) => {
    frame = 0;
    if (finished || stopped || document.hidden) return;
    if (!terminal.isConnected || !launcher.isConnected) { finish(); return; }
    // All layout reads happen before transform writes for this frame.
    if (windowDirty) updateTerminalBounds();
    if (themeDirty) refreshBitmaps();
    accumulator = Math.min(accumulator + (last ? Math.min(50, now - last) : 0), STEP * MAX_STEPS);
    last = now;
    let steps = 0;
    while (accumulator >= STEP && steps < MAX_STEPS) {
      for (const item of items) {
        item.previousX = item.body.position.x; item.previousY = item.body.position.y; item.previousAngle = item.body.angle;
      }
      Engine.update(engine, STEP);
      touching.clear();
      for (const pair of engine.pairs.list) {
        if (pair.isActive && !pair.isSensor) { touching.add(pair.collision.parentA); touching.add(pair.collision.parentB); }
      }
      // Contact impulses can keep Matter's velocity estimate high even when
      // a pile only jitters in place. Sleep a supported piece after it stays
      // inside a tiny rest region, rather than judging one noisy frame.
      for (const item of items) {
        const body = item.body;
        if (body.isSleeping) {
          item.quietFrames = 0;
          item.restX = body.position.x; item.restY = body.position.y; item.restAngle = body.angle;
          continue;
        }
        const dx = body.position.x - item.restX, dy = body.position.y - item.restY;
        const turn = (body.angle - item.restAngle) * item.radius;
        if (body !== constraint.body && touching.has(body) && dx * dx + dy * dy + turn * turn < 1.5 ** 2) {
          item.quietFrames += 1;
          if (item.quietFrames >= 45) { Sleeping.set(body, true); item.quietFrames = 0; }
        } else {
          item.quietFrames = 0;
          item.restX = body.position.x; item.restY = body.position.y; item.restAngle = body.angle;
        }
      }
      accumulator -= STEP; steps += 1;
    }
    const moving = constraint.body || mouse.button === 0 || items.some((item) => !item.body.isSleeping);
    render(moving ? accumulator / STEP : 1);
    // A settled scene needs no more simulation or painting until input wakes it.
    if (moving) frame = requestAnimationFrame(simulate);
    else last = 0;
  };
  const wake = () => {
    if (frame || finished || stopped || document.hidden) return;
    last = 0; accumulator = STEP;
    frame = requestAnimationFrame(simulate);
  };
  const dragMove = (event) => { if (event.buttons) wake(); };
  const release = () => { mouse.button = -1; wake(); };
  const visibilityChanged = () => {
    if (document.hidden) {
      mouse.button = -1; cancelAnimationFrame(frame); frame = 0; last = 0;
      if (stopped) finish();
    } else wake();
  };
  const windowObserver = new MutationObserver(() => { windowDirty = true; wake(); });
  windowObserver.observe(terminal, { attributes: true, attributeFilter: ["style"] });
  const themeObserver = new MutationObserver(() => { themeDirty = true; wake(); });
  themeObserver.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  canvas.addEventListener("pointerdown", wake);
  canvas.addEventListener("pointermove", dragMove, { passive: true });
  window.addEventListener("mouseup", release);
  window.addEventListener("blur", release);
  document.addEventListener("visibilitychange", visibilityChanged);

  for (const block of blocks) {
    block.element.style.transition = "none"; block.element.style.willChange = "transform";
    block.element.setAttribute("data-terminal-gravity-block", "");
  }
  textSources.forEach((source) => source.setAttribute("data-terminal-gravity-text", ""));
  root.dataset.gravityScene = "true";

  const stopSimulation = () => {
    cancelAnimationFrame(frame); frame = 0; windowObserver.disconnect();
    canvas.removeEventListener("pointerdown", wake); canvas.removeEventListener("pointermove", dragMove);
    canvas.removeEventListener("mousemove", mouse.mousemove); canvas.removeEventListener("mousedown", mouse.mousedown);
    canvas.removeEventListener("mouseup", mouse.mouseup); canvas.removeEventListener("wheel", mouse.mousewheel);
    canvas.removeEventListener("touchmove", mouse.mousemove); canvas.removeEventListener("touchstart", mouse.mousedown); canvas.removeEventListener("touchend", mouse.mouseup);
    window.removeEventListener("mouseup", release); window.removeEventListener("blur", release);
    Mouse.clearSourceEvents(mouse); Events.off(engine); Events.off(constraint);
    Composite.clear(engine.world, false); Engine.clear(engine);
  };
  const finish = () => {
    if (finished) return;
    finished = true; cancelAnimationFrame(frame);
    if (!stopped) { stopped = true; stopSimulation(); }
    themeObserver.disconnect(); window.removeEventListener("resize", handleResize);
    document.removeEventListener("visibilitychange", visibilityChanged);
    textSources.forEach((source) => source.removeAttribute("data-terminal-gravity-text"));
    for (const block of blocks) {
      block.element.style.transform = block.saved.transform;
      block.element.style.willChange = block.saved.willChange;
      block.element.removeAttribute("data-terminal-gravity-block");
    }
    canvas.remove(); settledLayer.remove(); delete root.dataset.gravityScene;
    // Commit the restored layout with transitions disabled, including when the
    // terminal closes before the return animation can run.
    void root.offsetWidth;
    for (const block of blocks) block.element.style.transition = block.saved.transition;
    atlas.width = atlas.height = settledLayer.width = settledLayer.height = 0;
    fontMetrics.clear();
    if (finishPreviousScene === finish) finishPreviousScene = null;
  };
  const handleResize = () => {
    const wasStopped = stopped; finish();
    if (!wasStopped) onViewportChange?.();
  };
  finishPreviousScene = finish;
  window.addEventListener("resize", handleResize);
  wake();

  return () => {
    if (finished || stopped) return;
    stopped = true; stopSimulation();
    const shouldAnimate = terminal.isConnected && launcher.isConnected && !document.hidden && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!shouldAnimate) { finish(); return; }
    canvas.style.pointerEvents = "none";
    const states = items.map((item, index) => ({ item, x: item.displayX, y: item.displayY,
      angle: Math.atan2(Math.sin(item.displayAngle), Math.cos(item.displayAngle)), delay: index / Math.max(1, items.length) * 260 }));
    const start = performance.now();
    const restore = (now) => {
      if (!terminal.isConnected || !launcher.isConnected || document.hidden) { finish(); return; }
      if (themeDirty) refreshBitmaps();
      settledLayer.remove();
      clear(); let complete = true;
      for (const state of states) {
        const progress = Math.min(1, Math.max(0, (now - start - state.delay) / 600));
        if (progress < 1) complete = false;
        const eased = 1 - (1 - progress) ** 4;
        paintItem(state.item, state.x + (state.item.origin.x - state.x) * eased,
          state.y + (state.item.origin.y - state.y) * eased - Math.sin(Math.PI * eased) * 35,
          state.angle * (1 - eased), 1 + 0.1 * Math.sin(Math.PI * progress));
      }
      if (complete) finish(); else frame = requestAnimationFrame(restore);
    };
    frame = requestAnimationFrame(restore);
  };
}
