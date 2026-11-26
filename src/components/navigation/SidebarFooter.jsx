import { Mail, Moon, Sun } from "lucide-react";
import { contactEmail, sidebarSocialLinks } from "../../data/portfolio";
import EmailCopyButton from "../EmailCopyButton";
import SoundToggle from "../SoundToggle";
import ThemePicker from "../ThemePicker";

export default function SidebarFooter({ collapsed, soundEnabled, onSoundToggle, theme }) {
  const { effectiveTheme, themePreference, changeTheme } = theme;
  const ThemeIcon = effectiveTheme === "dark" ? Moon : Sun;

  return (
    <div className="sidebar-bottom">
      <div className="sidebar-socials" aria-label="Social links">
        {sidebarSocialLinks.map((link) => (
          <a href={link.href} key={link.label} target="_blank" rel="noreferrer" aria-label={link.label} title={link.label}>
            <link.icon size={15} strokeWidth={1.6} aria-hidden="true" />
          </a>
        ))}
      </div>
      <div className="sidebar-controls">
        <div className="sidebar-theme-picker" inert={collapsed}>
          <ThemePicker value={themePreference} onChange={changeTheme} compact />
        </div>
        <button
          className="sidebar-theme-toggle"
          type="button"
          onClick={(event) => changeTheme(effectiveTheme === "dark" ? "light" : "dark", event)}
          aria-label={effectiveTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={effectiveTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-pressed={effectiveTheme === "dark"}
          aria-hidden={!collapsed}
          tabIndex={collapsed ? 0 : -1}
        >
          <ThemeIcon size={17} strokeWidth={1.7} aria-hidden="true" />
        </button>
        <SoundToggle enabled={soundEnabled} onToggle={onSoundToggle} />
      </div>
      <div className="sidebar-contact" inert={collapsed}>
        <p className="sidebar-bottom__copy">
          For work, collaborations, or anything else, reach me at
        </p>
        <div className="sidebar-bottom__email-row">
          <a className="sidebar-bottom__email" href={`mailto:${contactEmail}`}>
            <Mail size={13} strokeWidth={1.6} aria-hidden="true" />
            Email me
          </a>
          <EmailCopyButton email={contactEmail} compact />
        </div>
      </div>
    </div>
  );
}
