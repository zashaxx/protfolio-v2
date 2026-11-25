function runInstantScroll(scroll) {
  const root = document.documentElement;
  const previousBehavior = root.style.getPropertyValue("scroll-behavior");
  const previousPriority = root.style.getPropertyPriority("scroll-behavior");
  root.style.setProperty("scroll-behavior", "auto", "important");
  scroll();
  window.requestAnimationFrame(() => {
    scroll();
    if (previousBehavior) {
      root.style.setProperty(
        "scroll-behavior",
        previousBehavior,
        previousPriority,
      );
    } else {
      root.style.removeProperty("scroll-behavior");
    }
  });
}

export function jumpToTop() {
  runInstantScroll(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  });
}

export function jumpToSection(target) {
  runInstantScroll(() => {
    target.scrollIntoView({ behavior: "auto", block: "start" });
  });
}
