import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BookOpen, Maximize2, Volume2, VolumeX, X } from "lucide-react";
import { createLoungeAudio } from "./loungeAudio";
import { cameraFor, loadLoungeAssets, renderLounge } from "./loungeRenderer";
import { createLoungeWorld, interact, loungeSnapshot, pathTo, ROOM_OBJECTS, standUp, updateLounge, walkToObject } from "./loungeWorld";
import "./CommunityLounge.css";

const directions = { KeyW: "up", KeyA: "left", KeyS: "down", KeyD: "right", ArrowUp: "up", ArrowLeft: "left", ArrowDown: "down", ArrowRight: "right" };
const touchDirections = [["up", ArrowUp], ["left", ArrowLeft], ["down", ArrowDown], ["right", ArrowRight]];
const initialUi = { ...loungeSnapshot(createLoungeWorld()), loading: true, error: false };

export default function CommunityLounge({ paused = false, soundEnabled = false }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const controlsRef = useRef(null);
  const audioRef = useRef(null);
  const [ui, setUi] = useState(initialUi);
  const [soundPreference, setSoundPreference] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [retry, setRetry] = useState(0);
  const soundOn = soundPreference ?? soundEnabled;

  useEffect(() => {
    const canvas = canvasRef.current, root = rootRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !root || !ctx) return undefined;
    let disposed = false, assets = null, frame = 0, previousTime = 0;
    let width = 0, height = 0, suspended = false, signature = "", dark = false;
    const state = createLoungeWorld(), keys = new Set();
    const audio = createLoungeAudio();
    audioRef.current = audio;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const publish = () => {
      const next = loungeSnapshot(state);
      const nextSignature = JSON.stringify(next);
      if (nextSignature !== signature) {
        signature = nextSignature;
        setUi({ ...next, loading: !assets, error: false });
      }
      canvas.dataset.playerX = state.player.x.toFixed(1);
      canvas.dataset.playerY = state.player.y.toFixed(1);
      canvas.dataset.seated = state.player.seated ?? "";
      canvas.dataset.nearest = state.nearest?.id ?? "";
    };
    const play = (events) => {
      audio.setMusic(state.music);
      events.forEach((event) => audio.play(event));
      publish();
    };
    const focus = () => canvas.focus({ preventScroll: true });
    const unlock = () => { void audio.unlock(); };
    const action = () => { unlock(); play(interact(state)); focus(); };
    const visit = (id) => {
      const object = state.objects.find((o) => o.id === id);
      if (!object || suspended || !assets) return;
      unlock(); play(walkToObject(state, object)); focus();
    };
    const draw = () => {
      if (!assets || !width || !height) return;
      ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
      renderLounge(ctx, state, { width, height, dark, reducedMotion: motion.matches }, assets);
    };
    const tick = (now) => {
      frame = 0;
      if (disposed || suspended || document.hidden || !assets) return;
      const dt = Math.min(Math.max((now - previousTime) / 1000, 0), 0.035);
      previousTime = now;
      const events = updateLounge(state, dt, keys);
      if (events.length) play(events);
      else publish();
      draw();
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!disposed && !suspended && !document.hidden && assets && !frame) {
        previousTime = performance.now(); frame = requestAnimationFrame(tick);
      }
    };
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width; height = bounds.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      draw();
    };
    const setPaused = (next) => {
      suspended = next;
      keys.clear(); state.player.moving = false;
      audio.setPaused(suspended || document.hidden);
      cancelAnimationFrame(frame); frame = 0;
      if (!next) { start(); focus(); }
    };
    const visibility = () => {
      keys.clear(); state.player.moving = false;
      audio.setPaused(suspended || document.hidden);
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else start();
    };
    const clearKeys = () => { keys.clear(); state.player.moving = false; };
    const keyDown = (event) => {
      if (suspended || !assets || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey
        || event.target.closest("input, textarea, select")) return;
      const direction = directions[event.code];
      if (direction) { event.preventDefault(); unlock(); keys.add(direction); }
      else if (event.code === "KeyF" && !event.repeat) { event.preventDefault(); action(); }
    };
    const keyUp = (event) => { const direction = directions[event.code]; if (direction) keys.delete(direction); };
    const pointer = (event) => {
      if (event.button !== 0 || suspended || !assets) return;
      event.preventDefault(); unlock(); focus();
      if (state.player.seated) { play(interact(state)); return; }
      const bounds = canvas.getBoundingClientRect(), camera = cameraFor(state, width, height);
      const point = { x: event.clientX - bounds.left + camera.x, y: event.clientY - bounds.top + camera.y };
      const object = state.objects.filter((o) => o.interactive
        && point.x >= o.x - 5 && point.x <= o.x + o.w + 5
        && point.y >= o.y - 12 && point.y <= o.y + o.h + 6)
        .sort((a, b) => b.y + b.h - a.y - a.h)[0];
      if (object) visit(object.id);
      else {
        standUp(state); state.pending = null;
        state.path = pathTo(state, point);
        state.message = state.path.length ? "taking a little stroll…" : "WASD to explore · F or click an object to interact.";
        publish();
      }
    };
    const cursor = (event) => {
      const bounds = canvas.getBoundingClientRect(), camera = cameraFor(state, width, height);
      const x = event.clientX - bounds.left + camera.x, y = event.clientY - bounds.top + camera.y;
      canvas.style.cursor = state.objects.some((o) => o.interactive && x >= o.x - 5 && x <= o.x + o.w + 5
        && y >= o.y - 12 && y <= o.y + o.h + 6) ? "pointer" : "crosshair";
    };
    const theme = () => { dark = document.documentElement.dataset.theme === "dark"; draw(); };
    controlsRef.current = {
      action, visit, setPaused,
      key(direction, down) { unlock(); if (down) keys.add(direction); else keys.delete(direction); },
      clearKeys,
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const themeObserver = new MutationObserver(theme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    root.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", clearKeys);
    canvas.addEventListener("blur", clearKeys);
    canvas.addEventListener("pointerdown", pointer);
    canvas.addEventListener("pointermove", cursor);
    document.addEventListener("visibilitychange", visibility);
    theme(); resize(); publish();
    loadLoungeAssets().then((loaded) => {
      if (disposed) return;
      assets = loaded; signature = "";
      publish(); resize(); start();
      if (!suspended && !document.hidden) focus();
    }).catch(() => {
      if (!disposed) setUi((current) => ({ ...current, loading: false, error: true }));
    });
    return () => {
      disposed = true; cancelAnimationFrame(frame);
      observer.disconnect(); themeObserver.disconnect(); audio.dispose();
      controlsRef.current = null; audioRef.current = null;
      root.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", clearKeys);
      canvas.removeEventListener("blur", clearKeys);
      canvas.removeEventListener("pointerdown", pointer);
      canvas.removeEventListener("pointermove", cursor);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [retry]);

  useEffect(() => { controlsRef.current?.setPaused(paused); }, [paused, retry]);
  useEffect(() => { audioRef.current?.setEnabled(soundOn); }, [soundOn, retry]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundPreference(next);
    audioRef.current?.setEnabled(next);
    if (next) void audioRef.current?.unlock();
    canvasRef.current?.focus({ preventScroll: true });
  };
  const fullscreen = () => {
    const request = document.fullscreenElement ? document.exitFullscreen?.() : rootRef.current?.requestFullscreen?.();
    request?.catch(() => { /* Some embedded browsers disable fullscreen. */ });
    canvasRef.current?.focus({ preventScroll: true });
  };
  const directionPointer = (event, direction, down) => {
    event.preventDefault();
    if (down) event.currentTarget.setPointerCapture(event.pointerId);
    controlsRef.current?.key(direction, down);
  };

  return (
    <div className="community-lounge" ref={rootRef} data-loaded={!ui.loading && !ui.error}
      onKeyDown={(event) => {
        if (event.key === "Escape" && guideOpen) {
          event.preventDefault(); event.stopPropagation(); setGuideOpen(false);
          canvasRef.current?.focus({ preventScroll: true });
        }
      }}>
      <header className="community-lounge__header">
        <div className="community-lounge__identity">
          <span className="community-lounge__eyebrow">a little space to do nothing</span>
          <h2>the break room<span aria-hidden="true">.</span></h2>
        </div>
        <div className="community-lounge__tools">
          <button type="button" title="Room guide" aria-label="Room guide" aria-expanded={guideOpen}
            aria-controls="lounge-guide" onClick={() => { controlsRef.current?.clearKeys(); setGuideOpen(!guideOpen); }}>
            <BookOpen size={15} strokeWidth={1.6} />
          </button>
          <button type="button" title={soundOn ? "Mute room sounds" : "Enable room sounds"}
            aria-label={soundOn ? "Mute room sounds" : "Enable room sounds"} aria-pressed={soundOn} onClick={toggleSound}>
            {soundOn ? <Volume2 size={15} strokeWidth={1.6} /> : <VolumeX size={15} strokeWidth={1.6} />}
          </button>
          <button type="button" title="Toggle fullscreen" aria-label="Toggle room fullscreen" onClick={fullscreen}>
            <Maximize2 size={14} strokeWidth={1.6} />
          </button>
        </div>
      </header>
      <div className="community-lounge__meta">
        <span><i aria-hidden="true" /> single player <span className="community-lounge__meta-extra">· two little bots</span></span>
        <span>{ui.discovered}/{ui.total} discovered</span>
      </div>
      <div className="community-lounge__viewport">
        <div className="community-lounge__fade">
          <canvas ref={canvasRef} className="community-lounge__canvas" tabIndex={0} role="application"
            aria-label="Pixel break room. Use W A S D or arrow keys to move. F to interact nearby. Click furniture to walk over and use it. Escape exits."
            aria-describedby="lounge-status lounge-controls" />
        </div>
        {ui.music && <span className="community-lounge__now-playing"><span aria-hidden="true">♫</span> a little time off {soundOn ? "· playing" : "· muted"}</span>}
        {(ui.loading || ui.error) && <div className="community-lounge__loading" role="status">
          <span className="community-lounge__loading-pixel" aria-hidden="true" />
          <p>{ui.error ? "the room couldn't load." : "making a little room for you…"}</p>
          {ui.error && <button type="button" onClick={() => setRetry((n) => n + 1)}>try again</button>}
        </div>}
        {guideOpen && <section className="community-lounge__guide" id="lounge-guide" aria-label="Room guide">
          <div className="community-lounge__guide-heading"><span>make yourself at home</span>
            <button type="button" aria-label="Close room guide" onClick={() => { setGuideOpen(false); canvasRef.current?.focus(); }}><X size={15} /></button>
          </div>
          <p>Click a place to walk over. F or left click to use it.</p>
          <div className="community-lounge__places">
            {ROOM_OBJECTS.filter((o) => o.interactive).map((object, i) => (
              <button type="button" key={object.id} disabled={ui.loading || ui.error}
                onClick={() => { controlsRef.current?.visit(object.id); setGuideOpen(false); }}>
                <span>{String(i + 1).padStart(2, "0")}</span>{object.label}<span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
          <small>just you, two local bots, and a well-earned break.</small>
        </section>}
        <div className="community-lounge__touch" aria-label="Touch movement controls">
          {touchDirections.map(([direction, Icon]) => <button type="button" key={direction} data-direction={direction}
            aria-label={`Move ${direction}`} onPointerDown={(event) => directionPointer(event, direction, true)}
            onPointerUp={(event) => directionPointer(event, direction, false)}
            onPointerCancel={() => controlsRef.current?.key(direction, false)}
            onLostPointerCapture={() => controlsRef.current?.key(direction, false)}>
            <Icon size={16} />
          </button>)}
        </div>
        {!ui.loading && !ui.error && <button className="community-lounge__interact" type="button"
          disabled={!ui.nearest || ui.walking} onClick={() => controlsRef.current?.action()}>
          <kbd>F</kbd><span>{ui.walking ? "on my way…" : ui.action}</span>
        </button>}
      </div>
      <div className="community-lounge__status" id="lounge-status" role="status" aria-live="polite" aria-atomic="true">{ui.message}</div>
      <footer className="community-lounge__controls" id="lounge-controls">
        <span><kbd>W</kbd><span className="community-lounge__key-row"><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span> move</span>
        <span><kbd>F</kbd><span className="community-lounge__or">/</span> LMB interact</span>
        <span className="community-lounge__controls-note">take your time.</span>
      </footer>
    </div>
  );
}
