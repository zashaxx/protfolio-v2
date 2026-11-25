import { Menu, Monitor } from "lucide-react";
import { themeOptions } from "../../data/portfolio";

export default function MobileHeader({ pageView, onNavigate, menuOpen, onOpenMenu, theme }) {
  const { themePreference, cycleTheme } = theme;
  const ThemeIcon = themeOptions.find((option) => option.value === themePreference)?.icon ?? Monitor;

  return (
    <header className="mobile-header">
      <a
        className="mobile-brand"
        href={pageView === "home" ? "#home" : "/"}
        aria-label="Aayush Koirala, home"
        onClick={(event) => onNavigate(event, "#home")}
      >
        Aayush Koirala
      </a>
      <div className="mobile-header__actions">
        <button
          type="button"
          className="icon-button"
          onClick={cycleTheme}
          aria-label={`Current theme: ${themePreference}. Change theme`}
        >
          <ThemeIcon size={17} strokeWidth={1.7} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={onOpenMenu}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label="Open navigation"
        >
          <Menu size={19} strokeWidth={1.7} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
