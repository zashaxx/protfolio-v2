import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import animateTerminalWindow from "../components/terminalWindowMotion";

const TERMINAL_WIDTH = 640;
const TERMINAL_HEIGHT = 480;

export default function useTerminalWindow({ activeMode, exitMode, playClose, windowState, onWindowStateChange, onVisibilityChange, launcherRef }) {
  const isOpen = windowState === "open";
  const [position, setPosition] = useState(null);
  const dragRef = useRef(null);
  const windowRef = useRef(null);
  const positionRef = useRef(position);
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

  useEffect(() => () => cancelMotion(), [cancelMotion]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    const handleResize = () => {
      const current = positionRef.current;
      if (!current) return;
      const rect = windowRef.current?.getBoundingClientRect();
      const width = rect?.width ?? Math.min(TERMINAL_WIDTH, window.innerWidth - 16);
      const height = rect?.height ?? Math.min(TERMINAL_HEIGHT, window.innerHeight - 16);
      setPosition({
        x: Math.min(Math.max(8, current.x), Math.max(8, window.innerWidth - width - 8)),
        y: Math.min(Math.max(8, current.y), Math.max(8, window.innerHeight - height - 8)),
      });
      if (motionRef.current) {
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
  }, [cancelMotion, changeWindowState, onVisibilityChange]);

  const closeTerminal = useCallback((withSound = false) => {
    if (withSound) playClose();
    cancelMotion();
    exitMode();
    onVisibilityChange(false);
    changeWindowState("closed");
    launcherRef.current?.focus({ preventScroll: true });
  }, [cancelMotion, changeWindowState, exitMode, launcherRef, onVisibilityChange, playClose]);

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
    const transition = animateTerminalWindow(windowRef.current, launcherRef.current, direction);
    motionRef.current = transition;
    // Hand off to the snapshot before the browser can paint another live frame.
    flushSync(() => {
      changeWindowState(minimizing ? "minimizing" : "restoring");
      onVisibilityChange(false);
    });
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
      const width = Math.min(TERMINAL_WIDTH, window.innerWidth - 16);
      const height = Math.min(TERMINAL_HEIGHT, window.innerHeight - 16);
      const next = {
        x: Math.max(8, window.innerWidth - width - 24),
        y: Math.max(8, window.innerHeight - height - 24),
      };
      positionRef.current = next;
      setPosition(next);
    }
    onVisibilityChange(true);
    changeWindowState("open");
  };

  const minimizeTerminal = () => {
    if (windowStateRef.current !== "open") return;
    dragRef.current = null;
    transitionWindow("minimize");
  };

  const startDrag = (event) => {
    if (!isOpen || event.button !== 0 || event.target.closest("button")) return;
    event.preventDefault();
    const rect = windowRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const rect = windowRef.current?.getBoundingClientRect();
    const width = rect?.width ?? TERMINAL_WIDTH;
    const height = rect?.height ?? TERMINAL_HEIGHT;
    const next = {
      x: Math.min(Math.max(8, event.clientX - drag.offsetX), Math.max(8, window.innerWidth - width - 8)),
      y: Math.min(Math.max(8, event.clientY - drag.offsetY), Math.max(8, window.innerHeight - height - 8)),
    };
    positionRef.current = next;
    setPosition(next);
  };

  const stopDrag = (event) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  return {
    position, windowRef, closeTerminal, minimizeTerminal, toggleTerminal,
    dragHandlers: {
      onPointerDown: startDrag,
      onPointerMove: moveDrag,
      onPointerUp: stopDrag,
      onPointerCancel: stopDrag,
    },
  };
}
