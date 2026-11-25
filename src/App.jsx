import { useEffect, useLayoutEffect, useRef, useState } from "react";
import BuildStack, { StackDetailPage } from "./components/BuildStack";
import GitHubContributions from "./components/GitHubContributions";
import PointerEffects from "./components/PointerEffects";
import SiteFooter from "./components/SiteFooter";
import DesktopSidebar from "./components/navigation/DesktopSidebar";
import MobileNavigation from "./components/navigation/MobileNavigation";
import ProjectsDetailPage from "./components/projects/ProjectsDetailPage";
import ContactSection from "./components/sections/ContactSection";
import ExpertiseSection from "./components/sections/ExpertiseSection";
import HeroSection from "./components/sections/HeroSection";
import ProfileSection from "./components/sections/ProfileSection";
import ProjectsSection from "./components/sections/ProjectsSection";
import usePageNavigation from "./hooks/usePageNavigation";
import useTheme from "./hooks/useTheme";
import observeScrollReveals from "./scrollReveals";
import "./App.css";

function App() {
  const theme = useTheme();
  const { pageView, isInitialLoad, currentNavSection, handleNavClick, openDetailPage } = usePageNavigation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => window.localStorage.getItem("sidebar-collapsed") === "true",
  );
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = window.localStorage.getItem("site-sounds-enabled");
    return saved === null || saved === "on";
  });
  const revealedItemsRef = useRef(new Set());
  const toggleSound = () => setSoundEnabled((current) => !current);

  useEffect(() => {
    window.localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    window.localStorage.setItem("site-sounds-enabled", soundEnabled ? "on" : "off");
  }, [soundEnabled]);

  useLayoutEffect(() => {
    return observeScrollReveals(
      document.querySelector("#main-content"),
      revealedItemsRef.current,
      pageView,
    );
  }, [pageView, showAllProjects]);

  return (
    <div className={`portfolio-page${isInitialLoad ? " is-initial-load" : ""}${sidebarCollapsed ? " is-sidebar-collapsed" : ""}`}>
      <PointerEffects soundEnabled={soundEnabled} />
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="page-texture" aria-hidden="true">
        <span className="halftone page-texture__top" />
        <span className="halftone page-texture__bottom" />
      </div>
      <div className="page-frame" aria-hidden="true" />
      <DesktopSidebar
        pageView={pageView}
        activeSection={currentNavSection}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((current) => !current)}
        onNavigate={handleNavClick}
        soundEnabled={soundEnabled}
        onSoundToggle={toggleSound}
        theme={theme}
      />
      <MobileNavigation
        key={pageView}
        pageView={pageView}
        activeSection={currentNavSection}
        onNavigate={handleNavClick}
        soundEnabled={soundEnabled}
        onSoundToggle={toggleSound}
        theme={theme}
      />
      <main id="main-content">
        {pageView === "projects" ? (
          <ProjectsDetailPage onBack={(event) => handleNavClick(event, "#projects")} />
        ) : pageView === "stack" ? (
          <StackDetailPage onBack={(event) => handleNavClick(event, "#stack")} />
        ) : (
          <>
            <HeroSection />
            <ProfileSection />
            <ExpertiseSection />
            <BuildStack onViewAll={openDetailPage} />
            <ProjectsSection
              showAllProjects={showAllProjects}
              onToggleProjects={() => setShowAllProjects((current) => !current)}
              onViewAll={openDetailPage}
            />
            <GitHubContributions />
            <ContactSection soundEnabled={soundEnabled} />
          </>
        )}
        <SiteFooter pageView={pageView} onNavigate={handleNavClick} />
      </main>
    </div>
  );
}

export default App;
