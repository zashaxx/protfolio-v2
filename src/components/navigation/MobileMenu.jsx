import { ArrowUpRight, Mail, MousePointer2, X } from "lucide-react";
import { contactEmail, navItems, socialLinks } from "../../data/portfolio";
import SoundToggle from "../SoundToggle";
import ThemePicker from "../ThemePicker";
import NavigationLink from "./NavigationLink";

export default function MobileMenu({ panelRef, open, touring, onClose, onStartTour, pageView, activeSection, onNavigate, soundEnabled, onSoundToggle, theme }) {
  return (
    <div
      className={`mobile-menu ${open ? "is-open" : ""}`}
      id="mobile-menu"
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      aria-hidden={!open}
    >
      <div className="mobile-menu__top">
        <span>Navigation / Index</span>
        <button
          className={`icon-button${touring ? " mobile-menu__stop" : ""}`}
          type="button"
          onClick={onClose}
          aria-label={touring ? "Stop tour" : "Close navigation"}
        >
          {touring && <span>Stop tour</span>}
          <X size={19} strokeWidth={1.7} aria-hidden="true" />
        </button>
      </div>
      <nav className="mobile-menu__nav" aria-label="Mobile navigation">
        {navItems.map((item, index) => (
          <NavigationLink
            key={item.href}
            item={item}
            index={index}
            activeSection={activeSection}
            pageView={pageView}
            onNavigate={onNavigate}
            mobile
          />
        ))}
        <button className="mobile-menu__tour" type="button" onClick={onStartTour}>
          <MousePointer2 size={17} strokeWidth={1.55} aria-hidden="true" />
          <span>{touring ? "Restart the tour" : "Take the tour"}</span>
          <code>/tour</code>
        </button>
      </nav>
      <div className="mobile-menu__bottom">
        <p>Appearance</p>
        <div className="mobile-menu__controls">
          <ThemePicker value={theme.themePreference} onChange={theme.changeTheme} />
          <SoundToggle enabled={soundEnabled} onToggle={onSoundToggle} />
        </div>
        <div className="mobile-menu__socials">
          {socialLinks.map((link) => (
            <a href={link.href} key={link.label} target="_blank" rel="noreferrer">
              {link.label}
              <ArrowUpRight size={12} strokeWidth={1.6} aria-hidden="true" />
            </a>
          ))}
        </div>
        <a className="mobile-menu__email" href={`mailto:${contactEmail}`}>
          <Mail size={13} strokeWidth={1.6} aria-hidden="true" />
          {contactEmail}
        </a>
      </div>
    </div>
  );
}
