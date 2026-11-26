import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import useMenuFocus from "../../hooks/useMenuFocus";
import { jumpToTop } from "../../navigation";
import MobileHeader from "./MobileHeader";
import MobileMenu from "./MobileMenu";
import useTerminalSounds from "../useTerminalSounds";

const GuidedTour = lazy(() => import("../TerminalClone"));

export default function MobileNavigation({ pageView, activeSection, onNavigate, soundEnabled, onSoundToggle, theme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tourRun, setTourRun] = useState(0);
  const { playTyping } = useTerminalSounds(soundEnabled);
  const panelRef = useRef(null);
  const tourIdRef = useRef(0);
  const stopTour = useCallback(() => {
    setTourRun(0);
    setMenuOpen(false);
  }, []);

  useMenuFocus(menuOpen, panelRef, stopTour);

  useEffect(() => {
    if (!tourRun && !menuOpen) return undefined;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => { if (desktop.matches) stopTour(); };
    desktop.addEventListener("change", handleChange);
    return () => desktop.removeEventListener("change", handleChange);
  }, [tourRun, menuOpen, stopTour]);

  useEffect(() => {
    window.addEventListener("popstate", stopTour);
    return () => window.removeEventListener("popstate", stopTour);
  }, [stopTour]);

  const navigate = (event, href) => {
    stopTour();
    document.body.style.overflow = "";
    onNavigate(event, href);
  };

  const startTour = () => {
    setMenuOpen(false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      stopTour();
      window.requestAnimationFrame(jumpToTop);
      return;
    }
    // The same player supplies each revealed character after this gesture.
    playTyping();
    tourIdRef.current += 1;
    setTourRun(tourIdRef.current);
  };

  return (
    <>
      <MobileHeader pageView={pageView} onNavigate={navigate} menuOpen={menuOpen} onOpenMenu={() => setMenuOpen(true)} theme={theme} />
      <MobileMenu
        panelRef={panelRef}
        open={menuOpen}
        touring={tourRun > 0}
        onClose={stopTour}
        onStartTour={startTour}
        pageView={pageView}
        activeSection={activeSection}
        onNavigate={navigate}
        soundEnabled={soundEnabled}
        onSoundToggle={onSoundToggle}
        theme={theme}
      />
      {tourRun > 0 && (
        <Suspense fallback={null}>
          <GuidedTour key={tourRun} onExit={stopTour} onMenuChange={setMenuOpen} onType={playTyping} />
        </Suspense>
      )}
      {tourRun > 0 && !menuOpen && (
        <button className="mobile-tour-stop" type="button" onClick={stopTour}>
          <X size={14} strokeWidth={1.6} aria-hidden="true" />
          Stop tour
        </button>
      )}
    </>
  );
}
