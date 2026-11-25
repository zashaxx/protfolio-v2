import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { themeOptions } from "../data/portfolio";

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "system";
  }

  const savedTheme = window.localStorage.getItem("theme");
  return ["light", "dark", "system"].includes(savedTheme)
    ? savedTheme
    : "system";
}

export default function useTheme() {
  const [themePreference, setThemePreference] = useState(getInitialTheme);
  const [systemDark, setSystemDark] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const themeTimerRef = useRef(null);

  const effectiveTheme =
    themePreference === "system"
      ? systemDark
        ? "dark"
        : "light"
      : themePreference;

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => {
      if (
        themePreference === "system" &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        const root = document.documentElement;
        root.classList.add("theme-anim");
        window.clearTimeout(themeTimerRef.current);
        themeTimerRef.current = window.setTimeout(
          () => root.classList.remove("theme-anim"),
          520,
        );
      }

      setSystemDark(event.matches);
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [themePreference]);

  useEffect(() => {
    document.documentElement.dataset.theme = effectiveTheme;
    document.documentElement.classList.toggle("dark", effectiveTheme === "dark");
    window.localStorage.setItem("theme", themePreference);

    const favicon = document.querySelector("link[rel='icon']");
    if (favicon) {
      favicon.href =
        effectiveTheme === "dark" ? "/favicon-light.svg" : "/favicon.svg";
    }
  }, [effectiveTheme, themePreference]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      document.documentElement.dataset.themeReady = "";
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(themeTimerRef.current);
    };
  }, []);

  const changeTheme = (nextPreference, event) => {
    if (nextPreference === themePreference) {
      return;
    }

    const nextEffectiveTheme =
      nextPreference === "system"
        ? systemDark
          ? "dark"
          : "light"
        : nextPreference;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const root = document.documentElement;

    if (
      reduceMotion ||
      typeof document.startViewTransition !== "function" ||
      nextEffectiveTheme === effectiveTheme
    ) {
      root.classList.add("theme-anim");
      setThemePreference(nextPreference);
      window.clearTimeout(themeTimerRef.current);
      themeTimerRef.current = window.setTimeout(
        () => root.classList.remove("theme-anim"),
        520,
      );
      return;
    }

    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    root.classList.add("theme-view-transition");
    const transition = document.startViewTransition(() => {
      flushSync(() => setThemePreference(nextPreference));
      root.dataset.theme = nextEffectiveTheme;
      root.classList.toggle("dark", nextEffectiveTheme === "dark");
    });

    transition.ready
      .then(() => {
        root.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 540,
            easing: "cubic-bezier(.32,.08,.24,1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {});

    void transition.finished
      .catch(() => {})
      .finally(() => root.classList.remove("theme-view-transition"));
  };

  const cycleTheme = (event) => {
    const currentIndex = themeOptions.findIndex(
      (option) => option.value === themePreference,
    );
    const nextIndex = (currentIndex + 1) % themeOptions.length;
    changeTheme(themeOptions[nextIndex].value, event);
  };

  return { themePreference, effectiveTheme, changeTheme, cycleTheme };
}
