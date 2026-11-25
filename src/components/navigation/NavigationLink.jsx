import NavSelectionArrow from "../NavSelectionArrow";

export default function NavigationLink({ item, index, activeSection, pageView, onNavigate, collapsed = false, mobile = false }) {
  const active = activeSection === item.href.slice(1);
  const Icon = item.icon;
  const prefix = mobile ? "mobile-menu" : "sidebar-nav";

  return (
    <a
      href={pageView === "home" ? item.href : `/${item.href}`}
      className={active ? "is-active" : ""}
      style={{ [mobile ? "--menu-index" : "--nav-index"]: index }}
      aria-label={item.label}
      aria-current={active ? "location" : undefined}
      title={collapsed ? item.label : undefined}
      onClick={(event) => onNavigate(event, item.href)}
    >
      {!mobile && <NavSelectionArrow className="sidebar-nav__arrow" />}
      <Icon
        className={`${prefix}__icon`}
        size={mobile ? 17 : 14}
        strokeWidth={mobile ? 1.55 : 1.6}
        aria-hidden="true"
      />
      <span className={`${prefix}__label`} style={mobile ? undefined : { "--nav-index": index }}>
        {item.label}
      </span>
      {mobile && <NavSelectionArrow className="mobile-menu__arrow" />}
    </a>
  );
}
