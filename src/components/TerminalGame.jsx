import { useEffect, useRef } from "react";
import { gameCatalog } from "./terminalGames";
import "./TerminalGame.css";

const keyDirections = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
const startKeys = new Set(["Space", "Enter"]);
const formatScore = (score) => String(Math.max(0, Math.floor(score))).padStart(5, "0");
const gameNumbers = { runner: "01", snake: "02", pong: "03" };

function readBest(kind) {
  try { return Number(localStorage.getItem(`terminal.${kind}.best`)) || 0; }
  catch { return 0; }
}

export default function TerminalGame({ kind, paused = false }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const viewportRef = useRef(null);
  const pauseRef = useRef(null);
  const scoreRef = useRef(null);
  const bestRef = useRef(null);
  const statusRef = useRef(null);
  const overlayRef = useRef(null);
  const overlayTitleRef = useRef(null);
  const overlayCopyRef = useRef(null);
  const actionRef = useRef(null);
  const definition = gameCatalog[kind];

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    const viewport = viewportRef.current;
    const context = canvas?.getContext("2d");
    const definition = gameCatalog[kind];
    if (!canvas || !wrapper || !viewport || !context || !definition) return undefined;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0, height = 0;
    let game = null;
    let frame = 0, lastFrame = performance.now(), elapsed = 0, endedAt = 0;
    let suspended = false, pointerDown = false;
    let phase = "idle", best = readBest(kind), lastScore = -1;
    let resolutionMedia = null;
    let renderedDpr = 0;
    const painter = {
      context,
      ink: "#7de2b8", paper: "#08131a", time: 0,
      reducedMotion: motion.matches,
      rect(x, y, w, h, color = painter.ink) {
        context.fillStyle = color;
        context.fillRect(x, y, w, h);
      },
      roundRect(x, y, w, h, radius, color = painter.ink) {
        context.fillStyle = color;
        context.beginPath();
        context.roundRect(x, y, w, h, radius);
        context.fill();
      },
      circle(x, y, radius, color = painter.ink) {
        context.fillStyle = color;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      },
      line(x1, y1, x2, y2, color = painter.ink, lineWidth = 1) {
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
      },
    };
    const setPhase = (next, isRecord = false) => {
      phase = next;
      wrapper.dataset.state = next;
      statusRef.current.textContent = next === "running" ? "LIVE" : next === "over" ? "FINISHED" : "READY";
      overlayRef.current.setAttribute("aria-hidden", String(next === "running"));
      overlayTitleRef.current.textContent = next === "over" ? "GAME OVER" : definition.title;
      overlayCopyRef.current.textContent = next === "over"
        ? `${isRecord ? "New personal best" : "Final score"} · ${formatScore(game.score())}`
        : definition.subtitle ?? "A little break from the command line.";
      actionRef.current.textContent = next === "over" ? "to try again" : "to start";
    };
    const updateScore = () => {
      const score = Math.floor(game?.score() ?? 0);
      if (score === lastScore) return;
      lastScore = score;
      const formatted = formatScore(score);
      wrapper.dataset.score = formatted;
      scoreRef.current.textContent = formatted;
    };
    bestRef.current.textContent = formatScore(best);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      // Keep gameplay in a stable logical world, then render sharply at device
      // resolution. A DPR-only change never resets an in-progress game.
      const nextWidth = 320;
      const nextHeight = Math.max(60, Math.round(320 * rect.height / rect.width));
      const rawDpr = window.devicePixelRatio || 1;
      const ratio = Math.min(rawDpr, 2, Math.sqrt(1_500_000 / (rect.width * rect.height)));
      const pixelsWide = Math.max(1, Math.round(rect.width * ratio));
      const pixelsHigh = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width !== pixelsWide || canvas.height !== pixelsHigh) {
        canvas.width = pixelsWide;
        canvas.height = pixelsHigh;
      }
      const logicalResize = nextWidth !== width || nextHeight !== height;
      width = nextWidth; height = nextHeight;
      context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
      context.imageSmoothingEnabled = true;
      renderedDpr = rawDpr;
      if (logicalResize || !game) {
        game = definition.create(width, height);
        lastScore = -1;
        elapsed = 0;
        setPhase("idle");
        updateScore();
      }
    };
    const sendInput = (event, canStart = false) => {
      if (!game || suspended || document.hidden) return;
      if (phase !== "running") {
        if (!canStart || phase === "over" && performance.now() - endedAt < 450) return;
        game.reset();
        setPhase("running");
        updateScore();
        lastFrame = performance.now();
      }
      game.input(event);
    };
    const keyDown = (event) => {
      if (suspended || document.hidden) return;
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      const dir = keyDirections[event.code];
      if (!dir && !startKeys.has(event.code)) return;
      if (event.target instanceof Element && event.target.closest("button, input, textarea")) return;
      event.preventDefault();
      if (!event.repeat || dir) sendInput({ type: "press", dir }, true);
    };
    const keyUp = (event) => {
      if (suspended || document.hidden) return;
      if (keyDirections[event.code] || startKeys.has(event.code)) sendInput({ type: "release" });
    };
    const position = (event) => {
      const rect = canvas.getBoundingClientRect();
      return { x: (event.clientX - rect.left) / rect.width * width, y: (event.clientY - rect.top) / rect.height * height };
    };
    const pointerStart = (event) => {
      if (event.button !== 0 || suspended || document.hidden) return;
      event.preventDefault();
      wrapper.focus({ preventScroll: true });
      canvas.setPointerCapture(event.pointerId);
      pointerDown = true;
      sendInput({ type: "pointerdown", ...position(event) }, true);
    };
    const pointerMove = (event) => sendInput({ type: "pointermove", ...position(event), down: pointerDown });
    const pointerEnd = (event) => {
      pointerDown = false;
      sendInput({ type: "pointerup", ...position(event) });
      sendInput({ type: "release" });
    };
    const animate = (now) => {
      frame = 0;
      if (suspended || document.hidden) return;
      // Some display changes update DPR without firing a resize/media event.
      // This numeric check adds no layout work unless the actual DPR changes.
      if ((window.devicePixelRatio || 1) !== renderedDpr) {
        resize();
        watchResolution();
      }
      const delta = Math.min(Math.max((now - lastFrame) / 1000, 0), 1 / 30);
      lastFrame = now; elapsed += delta;
      if (phase === "running" && game) {
        const alive = game.update(delta);
        updateScore();
        if (!alive) {
          endedAt = now;
          const isRecord = game.score() > best;
          if (isRecord) {
            best = Math.floor(game.score());
            bestRef.current.textContent = formatScore(best);
            try { localStorage.setItem(`terminal.${kind}.best`, String(best)); } catch { /* A game also works without storage. */ }
          }
          setPhase("over", isRecord);
        }
      }
      context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
      painter.rect(0, 0, width, height, painter.paper);
      painter.time = elapsed;
      game?.render(painter, phase);
      frame = requestAnimationFrame(animate);
    };
    const setPaused = (next) => {
      suspended = next;
      pointerDown = false;
      game?.input({ type: "release" });
      cancelAnimationFrame(frame);
      frame = 0;
      if (!suspended && !document.hidden) {
        lastFrame = performance.now();
        frame = requestAnimationFrame(animate);
        wrapper.focus({ preventScroll: true });
      }
    };
    const handleVisibility = () => setPaused(suspended);
    const handleMotion = () => { painter.reducedMotion = motion.matches; };
    const handleResolution = () => { resize(); watchResolution(); };
    const watchResolution = () => {
      resolutionMedia?.removeEventListener("change", handleResolution);
      resolutionMedia = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      resolutionMedia.addEventListener("change", handleResolution);
    };
    pauseRef.current = setPaused;

    resize();
    watchResolution();
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    document.addEventListener("visibilitychange", handleVisibility);
    motion.addEventListener("change", handleMotion);
    canvas.addEventListener("pointerdown", pointerStart);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerEnd);
    canvas.addEventListener("pointercancel", pointerEnd);
    wrapper.focus({ preventScroll: true });
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      document.removeEventListener("visibilitychange", handleVisibility);
      motion.removeEventListener("change", handleMotion);
      resolutionMedia?.removeEventListener("change", handleResolution);
      pauseRef.current = null;
      canvas.removeEventListener("pointerdown", pointerStart);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerEnd);
      canvas.removeEventListener("pointercancel", pointerEnd);
    };
  }, [kind]);

  useEffect(() => {
    pauseRef.current?.(paused);
  }, [kind, paused]);

  return (
    <div className="terminal-game" ref={wrapperRef} tabIndex={0} role="application"
      data-game={kind} data-state="idle" style={{ "--game-accent": definition.accent ?? "#7de2b8" }}
      aria-label={`${definition.title} mini game. ${definition.hint}. Press Escape to exit.`}>
      <div className="terminal-game__hud">
        <div className="terminal-game__identity">
          <span className="terminal-game__number" aria-hidden="true">{gameNumbers[kind]}</span>
          <div>
            <span className="terminal-game__eyebrow">TERMINAL ARCADE</span>
            <span className="terminal-game__name">{definition.title}</span>
          </div>
        </div>
        <div className="terminal-game__scores">
          <div><span>SCORE</span><strong ref={scoreRef}>00000</strong></div>
          <div><span>BEST</span><strong ref={bestRef}>00000</strong></div>
        </div>
      </div>
      <div className="terminal-game__viewport" ref={viewportRef}>
        <canvas className="terminal-game__canvas" ref={canvasRef} aria-hidden="true" />
        <div className="terminal-game__overlay" ref={overlayRef} role="status">
          <span className="terminal-game__play-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none"><path d="m9 6 9 6-9 6V6Z" fill="currentColor" /></svg>
          </span>
          <span className="terminal-game__overlay-label">TAKE A LITTLE BREAK</span>
          <strong className="terminal-game__overlay-title" ref={overlayTitleRef}>{definition.title}</strong>
          <p ref={overlayCopyRef}>{definition.subtitle ?? "A little break from the command line."}</p>
          <span className="terminal-game__start"><kbd>SPACE</kbd><span ref={actionRef}>to start</span><span className="terminal-game__click">or click</span></span>
        </div>
      </div>
      <div className="terminal-game__controls">
        <span>{definition.hint}</span>
        <span className="terminal-game__live"><i aria-hidden="true" /><span ref={statusRef}>READY</span></span>
      </div>
    </div>
  );
}
