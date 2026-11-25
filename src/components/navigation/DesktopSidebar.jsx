import { useRef } from "react";
import { ChevronLeft } from "lucide-react";
import { navItems } from "../../data/portfolio";
import DesktopTerminal from "../DesktopTerminal";
import Logo from "../Logo";
import NavigationLink from "./NavigationLink";
import SidebarFooter from "./SidebarFooter";

export default function DesktopSidebar({ pageView, activeSection, collapsed, onToggle, onNavigate, soundEnabled, onSoundToggle, theme }) {
  const logoRef = useRef(null);

  return (
    <aside className="desktop-sidebar">
      <button
        className="sidebar-toggle"
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-controls="desktop-navigation"
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        title={collapsed ? "Expand navigation" : "Collapse navigation"}
      >
        <ChevronLeft className="sidebar-toggle__chevron" size={15} strokeWidth={1.8} aria-hidden="true" />
      </button>
      <a
        className="brand"
        href={pageView === "home" ? "#home" : "/"}
        aria-label="Aayush Koirala, home"
        data-ui-sound={collapsed ? "logo" : undefined}
        onClick={(event) => {
          if (collapsed) logoRef.current?.replay();
          onNavigate(event, "#home");
        }}
      >
        <span className="brand__monogram" aria-hidden="true">
          <Logo ref={logoRef} animate={collapsed} soundEnabled={soundEnabled} />
        </span>
        <span className="brand__name">Aayush Koirala</span>
      </a>
      <nav className="sidebar-nav" id="desktop-navigation" aria-label="Primary navigation">
        {navItems.map((item, index) => (
          <NavigationLink
            key={item.href}
            item={item}
            index={index}
            activeSection={activeSection}
            pageView={pageView}
            onNavigate={onNavigate}
            collapsed={collapsed}
          />
        ))}
        <DesktopTerminal key={pageView} sidebarCollapsed={collapsed} soundEnabled={soundEnabled} />
      </nav>
      <SidebarFooter collapsed={collapsed} soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} theme={theme} />
    </aside>
  );
}
