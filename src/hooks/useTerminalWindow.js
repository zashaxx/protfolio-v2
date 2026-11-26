import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import animateTerminalWindow, { animateTerminalClose } from "../components/terminalWindowMotion";

const TERMINAL_WIDTH = 560;
const TERMINAL_HEIGHT = 400;
const MIN_WIDTH = 360;
const MIN_HEIGHT = 240;
const MARGIN = 8;
const clamp = (value, min, max) => Math.min(Math.max(min, value), Math.max(min, max));

export default function useTerminalWindow({ activeMode, exitMode, playClose, windowState, onWindowStateChange, onVisibilityChange, launcherRef }) {
  const isOpen = windowState === "open";
  const [position, setPosition] = useState(null);
  const [size, setSize] = useState(null);
  const gestureRef = useRef(null);
  const gestureFrameRef = useRef(0);
  const pendingGeometryRef = useRef(null);
  const windowRef = useRef(null);
  const positionRef = useRef(position);
  const sizeRef = useRef(size);
  const windowStateRef = useRef(windowState);
  const motionRef = useRef(null);
  const motionVersionRef = useRef(0);

  const changeWindowState = useCallback((next) => {
    windowStateRef.current = next;
    onWindowStateChange(next);
  }, [onWindowStateChange]);

  const cancelMotion = useCallback(() => {
    motionVersionRef.current += 1;
    motionRef.current?.cancel();
    motionRef.current = null;
  }, []);

  const finishGesture = useCallback(() => {
    gestureRef.current = null;
    window.cancelAnimationFrame(gestureFrameRef.current);
    gestureFrameRef.current = 0;
    const next = pendingGeometryRef.current;
    pendingGeometryRef.current = null;
    if (next) {
      setPosition(next.position);
      if (next.size) setSize(next.size);
    }
  }, []);

  useEffect(() => () => {
    cancelMotion();
    window.cancelAnimationFrame(gestureFrameRef.current);
  }, [cancelMotion]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    const handleResize = () => {
      finishGesture();
      const current = positionRef.current;
      if (!current) return;
      const rect = windowRef.current?.getBoundingClientRect();
      const maxWidth = window.innerWidth - MARGIN * 2;
      const maxHeight = window.innerHeight - MARGIN * 2;
      const width = clamp(sizeRef.current?.width ?? rect?.width ?? TERMINAL_WIDTH, Math.min(MIN_WIDTH, maxWidth), maxWidth);
      const height = clamp(sizeRef.current?.height ?? rect?.height ?? TERMINAL_HEIGHT, Math.min(MIN_HEIGHT, maxHeight), maxHeight);
      const next = {
        x: clamp(current.x, MARGIN, window.innerWidth - width - MARGIN),
        y: clamp(current.y, MARGIN, window.innerHeight - height - MARGIN),
      };
      positionRef.current = next;
      setPosition(next);
      if (sizeRef.current) {
        sizeRef.current = { width, height };
        setSize(sizeRef.current);
      }
      if (motionRef.current && windowStateRef.current !== "closing") {
        const next = windowStateRef.current === "minimizing" ? "minimized" : "open";
        cancelMotion();
        flushSync(() => {
          changeWindowState(next);
          onVisibilityChange(next === "open");
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [cancelMotion, changeWindowState, finishGesture, onVisibilityChange]);

  const closeTerminal = useCallback((withSound = false) => {
    if (windowStateRef.current !== "open") return;
    if (withSound) playClose();
    finishGesture();
    cancelMotion();
    const version = motionVersionRef.current;
    const transition = animateTerminalClose(windowRef.current);
    motionRef.current = transition;
    flushSync(() => {
      changeWindowState("closing");
      onVisibilityChange(false);
    });
    launcherRef.current?.focus({ preventScroll: true });
    void transition.finished.then(() => {
      if (version !== motionVersionRef.current) return;
      motionRef.current = null;
      flushSync(() => {
        exitMode();
        changeWindowState("closed");
      });
    });
  }, [cancelMotion, changeWindowState, exitMode, finishGesture, launcherRef, onVisibilityChange, playClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key !== "Escape" || event.defaultPrevented || document.querySelector("dialog[open]")) return;
      event.preventDefault();
      if (activeMode) exitMode();
      else closeTerminal();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeMode, closeTerminal, exitMode, isOpen]);

  const transitionWindow = (direction) => {
    if (!windowRef.current || !launcherRef.current) return;
    cancelMotion();
    const version = motionVersionRef.current;
    const minimizing = direction === "minimize";
    // Commit the launcher's active geometry before measuring its icon. The
    // expanded navigation changes padding when aria-expanded changes.
    flushSync(() => {
      changeWindowState(minimizing ? "minimizing" : "restoring");
      onVisibilityChange(false);
    });
    const transition = animateTerminalWindow(windowRef.current, launcherRef.current, direction);
    motionRef.current = transition;
    if (minimizing) launcherRef.current.focus({ preventScroll: true });
    void transition.finished.then(() => {
      if (version !== motionVersionRef.current) return;
      motionRef.current = null;
      // The animation removes its snapshot in this microtask. Restore the live
      // window now so React cannot leave a blank frame between the two.
      flushSync(() => {
        changeWindowState(minimizing ? "minimized" : "open");
        onVisibilityChange(!minimizing);
      });
    });
  };

  const toggleTerminal = () => {
    if (motionRef.current) return;
    if (windowStateRef.current === "minimized") {
      transitionWindow("restore");
      return;
    }
    if (windowStateRef.current === "open") {
      minimizeTerminal();
      return;
    }
    if (!positionRef.current) {
      const width = Math.min(sizeRef.current?.width ?? TERMINAL_WIDTH, window.innerWidth - 16);
      const height = Math.min(sizeRef.current?.height ?? TERMINAL_HEIGHT, window.innerHeight - 16);
      const next = {
        x: Math.max(MARGIN, (window.innerWidth - width) / 2),
        y: Math.max(MARGIN, (window.innerHeight - height) / 2),
      };
      positionRef.current = next;
      setPosition(next);
    }
    onVisibilityChange(true);
    changeWindowState("open");
  };

  const minimizeTerminal = () => {
    if (windowStateRef.current !== "open") return;
    finishGesture();
    transitionWindow("minimize");
  };

  const queueGeometry = (next) => {
    positionRef.current = next.position;
    if (next.size) sizeRef.current = next.size;
    pendingGeometryRef.current = next;
    if (gestureFrameRef.current) return;
    gestureFrameRef.current = window.requestAnimationFrame(() => {
      gestureFrameRef.current = 0;
      const pending = pendingGeometryRef.current;
      pendingGeometryRef.current = null;
      if (!pending) return;
      setPosition(pending.position);
      if (pending.size) setSize(pending.size);
    });
  };

  const startGesture = (event, direction = null) => {
    if (!isOpen || event.button !== 0 || (!direction && event.target.closest("button"))) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = windowRef.current?.getBoundingClientRect();
    if (!rect) return;
    gestureRef.current = {
      pointerId: event.pointerId,
      direction, x: event.clientX, y: event.clientY,
      left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
      width: rect.width, height: rect.height,
      viewportWidth: window.innerWidth, viewportHeight: window.innerHeight,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveGesture = (event) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (!gesture.direction) {
      queueGeometry({ position: {
        x: clamp(gesture.left + dx, MARGIN, gesture.viewportWidth - gesture.width - MARGIN),
        y: clamp(gesture.top + dy, MARGIN, gesture.viewportHeight - gesture.height - MARGIN),
      } });
      return;
    }
    let { left, top, right, bottom } = gesture;
    const minWidth = Math.min(MIN_WIDTH, gesture.viewportWidth - MARGIN * 2);
    const minHeight = Math.min(MIN_HEIGHT, gesture.viewportHeight - MARGIN * 2);
    if (gesture.direction.includes("e")) right = clamp(right + dx, left + minWidth, gesture.viewportWidth - MARGIN);
    if (gesture.direction.includes("s")) bottom = clamp(bottom + dy, top + minHeight, gesture.viewportHeight - MARGIN);
    if (gesture.direction.includes("w")) left = clamp(left + dx, MARGIN, right - minWidth);
    queueGeometry({ position: { x: left, y: top }, size: { width: right - left, height: bottom - top } });
  };

  const stopGesture = (event) => {
    if (gestureRef.current?.pointerId !== event.pointerId) return;
    finishGesture();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const resizeWithKeyboard = (event) => {
    if (!isOpen || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    const rect = windowRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.preventDefault();
    const step = event.shiftKey ? 40 : 10;
    queueGeometry({ position: { x: rect.left, y: rect.top }, size: {
      width: clamp(rect.width + (event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0), Math.min(MIN_WIDTH, window.innerWidth - 16), window.innerWidth - rect.left - MARGIN),
      height: clamp(rect.height + (event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0), Math.min(MIN_HEIGHT, window.innerHeight - 16), window.innerHeight - rect.top - MARGIN),
    } });
  };

  return {
    position, size, windowRef, closeTerminal, minimizeTerminal, toggleTerminal,
    dragHandlers: {
      onPointerDown: (event) => startGesture(event),
      onPointerMove: moveGesture,
      onPointerUp: stopGesture,
      onPointerCancel: stopGesture,
      onLostPointerCapture: stopGesture,
    },
    resizeHandlers: {
      onPointerDown: (event) => startGesture(event, event.currentTarget.dataset.resizeDirection),
      onPointerMove: moveGesture,
      onPointerUp: stopGesture,
      onPointerCancel: stopGesture,
      onLostPointerCapture: stopGesture,
      onKeyDown: resizeWithKeyboard,
    },
  };
}
