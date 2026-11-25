import { lazy, Suspense, useCallback, useRef, useState, useSyncExternalStore } from "react";
import { Terminal } from "lucide-react";
import "./TerminalWidget.css";

const TerminalExperience = lazy(() => import("./TerminalExperience"));
const desktopQuery = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

function subscribeToDesktop(change) {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}

function TerminalNavigation({ sidebarCollapsed, soundEnabled }) {
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [windowState, setWindowState] = useState("closed");
  const launcherRef = useRef(null);
  const controllerRef = useRef(null);
  const pendingToggleRef = useRef(false);
  const isOpen = windowState === "open";
  const launcherLabel = isOpen
    ? "Minimize terminal"
    : windowState === "closed"
      ? "Open terminal"
      : "Restore terminal";

  const connectTerminal = useCallback((controller) => {
    controllerRef.current = controller;
    if (!controller) return;
    setLoading(false);
    if (pendingToggleRef.current) {
      pendingToggleRef.current = false;
      controller.toggle();
    }
  }, []);

  const toggleTerminal = () => {
    if (controllerRef.current) {
      controllerRef.current.toggle();
      return;
    }
    pendingToggleRef.current = !pendingToggleRef.current;
    setLoading(true);
    setRequested(true);
  };

  return (
    <div className="terminal-widget">
      <button
        ref={launcherRef}
        className={`terminal-widget__launcher sidebar-nav__terminal${isOpen ? " is-active" : ""}${windowState === "minimized" ? " is-minimized" : ""}`}
        style={{ "--nav-index": 6 }}
        type="button"
        onClick={toggleTerminal}
        aria-label={launcherLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-busy={loading || windowState === "minimizing" || windowState === "restoring"}
        title={sidebarCollapsed ? launcherLabel : undefined}
      >
        <Terminal className="sidebar-nav__icon" size={14} strokeWidth={1.6} aria-hidden="true" />
        <span className="sidebar-nav__label" style={{ "--nav-index": 6 }}>Terminal</span>
      </button>
      {requested && (
        <Suspense fallback={null}>
          <TerminalExperience
            soundEnabled={soundEnabled}
            windowState={windowState}
            onWindowStateChange={setWindowState}
            launcherRef={launcherRef}
            controllerRef={connectTerminal}
          />
        </Suspense>
      )}
    </div>
  );
}

export default function DesktopTerminal({ sidebarCollapsed, soundEnabled }) {
  const isDesktop = useSyncExternalStore(
    subscribeToDesktop,
    () => window.matchMedia(desktopQuery).matches,
    () => false,
  );

  return isDesktop ? (
    <TerminalNavigation sidebarCollapsed={sidebarCollapsed} soundEnabled={soundEnabled} />
  ) : null;
}
