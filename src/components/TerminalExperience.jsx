import { useCallback, useState } from "react";
import TerminalEffects from "./TerminalEffects";
import TerminalWidget from "./TerminalWidget";

export default function TerminalExperience({ soundEnabled, windowState, onWindowStateChange, launcherRef, controllerRef }) {
  const [mode, setMode] = useState(null);
  const [tourRun, setTourRun] = useState(0);
  const [windowVisible, setWindowVisible] = useState(false);
  const exitMode = useCallback(() => setMode(null), []);
  const runMode = useCallback((nextMode) => {
    if (nextMode === "tour") setTourRun((run) => run + 1);
    setMode(nextMode);
  }, []);

  return (
    <>
      <TerminalWidget activeMode={mode} onModeChange={runMode}
        soundEnabled={soundEnabled} onVisibilityChange={setWindowVisible}
        windowState={windowState} onWindowStateChange={onWindowStateChange}
        launcherRef={launcherRef} controllerRef={controllerRef} />
      <TerminalEffects key={tourRun} mode={mode === "tour" || windowVisible ? mode : null} onExit={exitMode} />
    </>
  );
}
