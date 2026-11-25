import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { navItems } from "../data/portfolio";
import { jumpToSection, jumpToTop } from "../navigation";

function getInitialView() {
  if (typeof window === "undefined") {
    return "home";
  }

  const view = new URLSearchParams(window.location.search).get("view");
  return view === "projects" || view === "stack" ? view : "home";
}

export default function usePageNavigation() {
  const [activeSection, setActiveSection] = useState("about");
  const [pageView, setPageView] = useState(getInitialView);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    let disposed = false;
    const entrances = document.getAnimations().filter((animation) =>
      animation.animationName === "hero-enter" || animation.animationName === "nav-enter",
    );
    void Promise.allSettled(entrances.map((animation) => animation.finished)).then(() => {
      if (!disposed) setIsInitialLoad(false);
    });
    return () => { disposed = true; };
  }, []);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setIsInitialLoad(false);
      const nextView = getInitialView();
      setPageView(nextView);

      window.requestAnimationFrame(() => {
        if (nextView === "home" && window.location.hash) {
          const target = document.querySelector(window.location.hash);
          if (target) jumpToSection(target);
          return;
        }
        jumpToTop();
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (pageView !== "home") {
      return undefined;
    }

    let frameId = 0;

    const updateActiveSection = () => {
      frameId = 0;
      const marker =
        window.scrollY + Math.min(120, window.innerHeight * 0.15);
      const scrollPadding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      let currentSection = navItems[0].href.slice(1);

      navItems.forEach((item) => {
        const section = document.querySelector(item.href);
        const sectionTop = section
          ? section.getBoundingClientRect().top + window.scrollY
          : Number.POSITIVE_INFINITY;
        // Match the spacing used by anchor navigation, including the mobile header.
        const anchorMarker = section
          ? window.scrollY + scrollPadding + (parseFloat(getComputedStyle(section).scrollMarginTop) || 0) + 1
          : marker;
        if (sectionTop <= Math.max(marker, anchorMarker)) {
          currentSection = section.id;
        }
      });

      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4
      ) {
        currentSection = navItems.at(-1).href.slice(1);
      }

      setActiveSection(currentSection);
    };

    const requestUpdate = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(updateActiveSection);
      }
    };

    updateActiveSection();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [pageView]);

  const openDetailPage = (view, event) => {
    event?.preventDefault();
    setIsInitialLoad(false);
    document.body.style.overflow = "";
    window.history.pushState(null, "", `/?view=${view}`);
    flushSync(() => setPageView(view));
    jumpToTop();
  };

  const handleNavClick = (event, href) => {
    event.preventDefault();
    setIsInitialLoad(false);
    document.body.style.overflow = "";

    if (pageView !== "home") {
      window.history.pushState(null, "", `/${href}`);
      flushSync(() => setPageView("home"));
    }

    const target = document.querySelector(href);
    if (!target) {
      return;
    }

    setActiveSection(href === "#home" ? "about" : href.slice(1));

    if (pageView === "home" && window.location.hash !== href) {
      window.history.pushState(null, "", href);
    }

    jumpToSection(target);
  };

  const currentNavSection =
    pageView === "projects"
      ? "projects"
      : pageView === "stack"
        ? "stack"
        : activeSection;

  return { pageView, isInitialLoad, currentNavSection, handleNavClick, openDetailPage };
}
