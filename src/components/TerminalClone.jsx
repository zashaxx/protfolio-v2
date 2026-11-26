import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./TerminalEffects.css";

const tourSteps = [
  {
    selector: "#home h1",
    fallback: ".brand__name, .mobile-brand, .brand__monogram",
    first: true,
    at: "name",
    free: true,
    text: "Hi! I'm Aayush. Welcome to my portfolio!",
  },
  {
    selector: ".hero-socials a, .detail-page__back",
    at: "below",
    text: "Find me here, or grab a copy of my resume.",
  },
  {
    selector: ".hero-meta div",
    at: "below",
    text: "Based in Nepal, studying engineering, and open to internships.",
  },
  {
    selector: ".sidebar-nav a[aria-label='Profile'], .mobile-menu__nav a[aria-label='Profile']",
    menu: true,
    text: "My background and how I got into building software.",
  },
  {
    selector: ".sidebar-nav a[aria-label='Expertise'], .mobile-menu__nav a[aria-label='Expertise']",
    menu: true,
    text: "The frontend, backend, and security work I do.",
  },
  {
    selector: ".sidebar-nav a[aria-label='Stack'], .mobile-menu__nav a[aria-label='Stack']",
    menu: true,
    text: "The tools I use to build and ship projects.",
  },
  {
    selector: ".sidebar-nav a[aria-label='Work'], .mobile-menu__nav a[aria-label='Work']",
    menu: true,
    text: "A few projects I've worked on recently.",
  },
  {
    selector: ".sidebar-nav a[aria-label='Activity'], .mobile-menu__nav a[aria-label='Activity']",
    menu: true,
    text: "My recent activity on GitHub.",
  },
  {
    selector: ".sidebar-nav a[aria-label='Contact'], .mobile-menu__nav a[aria-label='Contact']",
    menu: true,
    text: "Get in touch if you'd like to work together.",
  },
  {
    selector: ".sidebar-theme-picker, .is-sidebar-collapsed .sidebar-theme-toggle, .sidebar-controls .sound-toggle, .mobile-menu__controls .theme-picker, .mobile-menu__controls .sound-toggle",
    menu: true,
    text: "Choose your theme and toggle the interface sounds here.",
  },
  {
    selector: ".sidebar-bottom__email, .mobile-menu__email",
    menu: true,
    text: "And here's my email. I'd love to hear from you!",
  },
  {
    free: true,
    text: "That's the tour. Scroll around and enjoy your stay!",
  },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Fixed acceleration and cruising speed make short and long trips predictable.
function glideProgress(progress, ramp) {
  const accelerate = (t) => (t - ramp / Math.PI * Math.sin(Math.PI * t / ramp)) / (2 * (1 - ramp));
  if (progress < ramp) return accelerate(progress);
  if (progress > 1 - ramp) return 1 - accelerate(1 - progress);
  return (progress - ramp / 2) / (1 - ramp);
}

function makeTextLayout(text, measure) {
  const parts = "Segmenter" in Intl
    ? Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), (part) => part.segment)
    : Array.from(text);
  const chars = parts.map((part) => {
    const span = document.createElement("span");
    span.className = "terminal-guide__char";
    span.textContent = part;
    return span;
  });
  measure.replaceChildren(...chars);
  const boxes = chars.map((span) => ({
    right: span.offsetLeft + span.offsetWidth,
    top: span.offsetTop,
    bottom: span.offsetTop + span.offsetHeight,
  }));
  return {
    chars,
    parts,
    boxes,
    width: Math.ceil(measure.getBoundingClientRect().width),
    height: measure.offsetHeight,
  };
}

export default function TerminalClone({ onExit, onMenuChange, onType }) {
  const cursorRef = useRef(null);
  const tagRef = useRef(null);
  const clipRef = useRef(null);
  const textRef = useRef(null);
  const measureRef = useRef(null);
  const caretRef = useRef(null);

  useEffect(() => {
    const root = cursorRef.current;
    const tag = tagRef.current;
    const clip = clipRef.current;
    const inner = textRef.current;
    const measure = measureRef.current;
    const caret = caretRef.current;
    if (!root || !tag || !clip || !inner || !measure || !caret) return undefined;
    const name = tag.querySelector(".terminal-guide__name");

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) {
      window.scrollTo({ top: 0, behavior: "instant" });
      onExit();
      return undefined;
    }

    const goal = { x: window.innerWidth + 40, y: window.innerHeight * 0.58 };
    const shown = { ...goal };
    const waiters = [];
    let cancelScroll = null;
    let hovered = null;
    let move = null;
    let rest = null;
    let frame = 0;
    let clock = 0;
    let previousFrame = 0;
    let running = true;
    let writer = null;
    let layout = null;
    let preferAbove = false;
    let tagGap = 1;
    let guideMenuOpen = false;

    const sleep = (duration) => !running ? Promise.resolve() : new Promise((resolve) => {
      waiters.push({ at: clock + duration, done: resolve });
    });

    const scrollToTop = () => new Promise((resolve) => {
      if (window.scrollY <= 1) { resolve(); return; }
      let timeout = 0;
      const finish = () => {
        if (timeout) window.clearTimeout(timeout);
        window.removeEventListener("scrollend", finish);
        cancelScroll = null;
        resolve();
      };
      cancelScroll = () => {
        window.scrollTo({ top: window.scrollY, behavior: "instant" });
        finish();
      };
      window.addEventListener("scrollend", finish, { once: true });
      timeout = window.setTimeout(finish, 1800);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const setHover = (element) => {
      hovered?.classList.remove("terminal-guide__hover");
      hovered = element ?? null;
      hovered?.classList.add("terminal-guide__hover");
    };

    const visible = (element) => {
      if (element.closest("[inert], [hidden]")) return false;
      for (let parent = element; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) return false;
      }
      return true;
    };

    const targets = (selector) => Array.from(document.querySelectorAll(selector))
      .filter((element) => {
        if (!visible(element)) return false;
        const rect = element.getBoundingClientRect();
        const scroller = element.closest(".sidebar-nav, .mobile-menu__nav");
        const viewport = scroller?.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0
          && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth
          && (!viewport || (rect.top >= viewport.top && rect.bottom <= viewport.bottom));
      });

    const placeTag = (point) => {
      if (!layout) return;
      const width = Math.max(layout.nameWidth, layout.width) + 22;
      const height = layout.nameHeight + layout.height + 10;
      const fitsBelow = point.y + 19 + height + 10 <= window.innerHeight;
      const fitsAbove = point.y - height - tagGap - 10 >= 0;
      root.classList.toggle("is-up", fitsAbove && (preferAbove || !fitsBelow));
      const left = point.x + 16 + width + 10 > window.innerWidth;
      root.classList.toggle("is-left", left);
      const tagLeft = left ? point.x - width - 1 : point.x + 16;
      const tagTop = root.classList.contains("is-up") ? point.y - height - tagGap : point.y + 19;
      root.style.setProperty("--guide-tag-x", `${clamp(tagLeft, 12, window.innerWidth - width - 12) - tagLeft}px`);
      root.style.setProperty("--guide-tag-y", `${clamp(tagTop, 12, window.innerHeight - height - 12) - tagTop}px`);
    };

    const hush = () => {
      tag.classList.remove("is-talking", "is-typing");
    };

    const type = (layout) => new Promise((done) => {
      if (!running) { done(); return; }
      // Reserve the complete paragraph before revealing any letters. Neither
      // wrapping nor bubble placement changes while the description types.
      inner.style.width = `${layout.width}px`;
      inner.replaceChildren(...layout.chars, caret);
      clip.style.width = `${layout.width + 2}px`;
      clip.style.height = `${layout.height}px`;
      caret.style.transform = "translate(0px, 0px)";
      placeTag(shown);
      tag.classList.add("is-talking", "is-typing");
      writer = { layout, index: 0, nextAt: clock + 60, done };
    });

    const moveTo = (to) => new Promise((done) => {
      if (!running) { done(); return; }
      const from = { ...shown };
      const target = to();
      const distance = Math.hypot(target.x - from.x, target.y - from.y);
      const duration = Math.max(640, distance / 480 * 1000 + 320);
      move = {
        from, to, target, t0: clock, duration,
        ramp: Math.min(0.45, 320 / duration), done,
      };
    });

    const anchor = (element, at) => () => {
      const rect = element.getBoundingClientRect();
      if (at === "name") {
        const range = document.createRange();
        range.selectNodeContents(element);
        const textRect = Array.from(range.getClientRects()).find((box) => box.width > 0 && box.height > 0) ?? rect;
        return {
          x: textRect.left + Math.min(18, textRect.width / 2),
          y: textRect.top + Math.min(20, textRect.height / 2),
        };
      }
      if (at === "above") return {
        x: rect.left - 12,
        y: Math.max(rect.top - 24, (layout?.height ?? 0) + name.offsetHeight + 24),
      };
      if (at === "below") return { x: rect.left + rect.width / 2, y: rect.bottom + 2 };
      return { x: rect.right + 5, y: rect.top + rect.height / 2 };
    };

    const openSpace = () => {
      const left = document.querySelector(".desktop-sidebar")?.getBoundingClientRect().right ?? 0;
      return { x: left + (window.innerWidth - left) * 0.46, y: window.innerHeight * 0.43 };
    };

    const say = async (step) => {
      if (onMenuChange && Boolean(step.menu) !== guideMenuOpen) {
        guideMenuOpen = Boolean(step.menu);
        hush();
        onMenuChange(guideMenuOpen);
        await sleep(500);
        if (!running) return;
      }
      if (step.menu && step.selector) {
        const menuItem = Array.from(document.querySelectorAll(step.selector))
          .find((element) => visible(element) && element.closest(".sidebar-nav, .mobile-menu__nav"));
        const scroller = menuItem?.closest(".sidebar-nav, .mobile-menu__nav");
        if (scroller) {
          const itemRect = menuItem.getBoundingClientRect();
          const scrollRect = scroller.getBoundingClientRect();
          if (itemRect.top < scrollRect.top || itemRect.bottom > scrollRect.bottom) {
            scroller.scrollTo({
              top: scroller.scrollTop + itemRect.top - scrollRect.top - (scrollRect.height - itemRect.height) / 2,
              behavior: "smooth",
            });
            await sleep(500);
            if (!running) return;
          }
        }
      }
      let elements = step.selector ? targets(step.selector) : [];
      if (!elements.length && step.fallback) elements = targets(step.fallback);
      if (step.first) elements = elements.slice(0, 1);
      if (!elements.length && !step.free) return;
      const points = elements.length ? elements.map((element) => anchor(element, step.at)) : [openSpace];
      hush();
      layout = makeTextLayout(step.text, measure);
      layout.nameWidth = name.offsetWidth;
      layout.nameHeight = name.offsetHeight;
      preferAbove = step.at === "above" || step.at === "name";
      tagGap = step.at === "name" ? 16 : 1;
      root.style.setProperty("--guide-tag-gap", `${tagGap}px`);
      setHover(elements[0]);
      await moveTo(points[0]);
      await sleep(170);
      await type(layout);

      if (points.length > 1) {
        await sleep(800);
        for (let index = 1; index < points.length; index += 1) {
          if (!running) break;
          await sleep(380);
          setHover(elements[index]);
          await moveTo(points[index]);
        }
        await sleep(800);
      } else {
        await sleep(Math.max(1200, layout.chars.length * 21));
      }

      setHover(null);
    };

    const animate = (now) => {
      if (!running) return;
      const deltaMs = Math.min(now - previousFrame, 50);
      previousFrame = now;
      // Keep the same logical clock for movement and typing, including pauses.
      const away = document.hidden || Boolean(document.querySelector("dialog[open]"));
      root.classList.toggle("is-away", away);
      if (away) {
        frame = window.requestAnimationFrame(animate);
        return;
      }
      clock += deltaMs;

      if (move) {
        const task = move;
        const progress = Math.min((clock - task.t0) / task.duration, 1);
        const eased = glideProgress(progress, task.ramp);
        shown.x = task.from.x + (task.target.x - task.from.x) * eased;
        shown.y = task.from.y + (task.target.y - task.from.y) * eased;
        if (progress === 1) {
          rest = task.to;
          move = null;
          task.done();
        }
      } else if (rest) {
        const point = rest();
        // Follow scroll/resize changes without teleporting or oscillating. A
        // stationary target stays completely still, including during typing.
        const follow = 1 - Math.exp(-deltaMs / 140);
        for (const axis of ["x", "y"]) {
          const distance = point[axis] - shown[axis];
          shown[axis] = Math.abs(distance) < 0.05 ? point[axis] : shown[axis] + distance * follow;
        }
      }
      placeTag(shown);
      root.style.transform = `translate3d(${shown.x.toFixed(2)}px, ${shown.y.toFixed(2)}px, 0)`;
      root.dataset.moving = String(Boolean(move));

      if (writer && clock >= writer.nextAt) {
        const task = writer;
        while (task.index < task.layout.chars.length && clock >= task.nextAt) {
          const index = task.index++;
          const part = task.layout.parts[index], box = task.layout.boxes[index];
          task.layout.chars[index].classList.add("is-on");
          caret.style.transform = `translate(${box.right}px, ${box.top}px)`;
          if (/\S/u.test(part)) onType?.(part);
          const delay = /[.!?]/u.test(part) ? 145 : /[,;:]/u.test(part) ? 75 : 33;
          task.nextAt += delay;
        }
        if (task.index === task.layout.chars.length && clock >= task.nextAt) {
          tag.classList.remove("is-typing");
          writer = null;
          task.done();
        }
      }

      for (let index = waiters.length - 1; index >= 0; index -= 1) {
        if (waiters[index].at <= clock) waiters.splice(index, 1)[0].done();
      }
      frame = window.requestAnimationFrame(animate);
    };

    const run = async () => {
      await sleep(350);
      if (!running) return;
      await scrollToTop();
      await document.fonts.ready;
      if (!running) return;

      root.classList.add("is-here");
      for (const step of tourSteps) {
        if (!running) return;
        await say(step);
      }

      if (!running) return;
      hush();
      setHover(null);
      await sleep(300);
      await moveTo(() => ({ x: window.innerWidth + 80, y: window.innerHeight * 0.3 }));
      root.classList.remove("is-here");
      await sleep(450);
      if (running) onExit();
    };

    const handleEscape = (event) => {
      if (event.key !== "Escape" || event.defaultPrevented || document.querySelector("dialog[open]")) return;
      event.preventDefault();
      onExit();
    };
    const handleMotion = () => { if (motion.matches) onExit(); };
    window.addEventListener("keydown", handleEscape);
    motion.addEventListener("change", handleMotion);
    root.style.transform = `translate3d(${goal.x}px, ${goal.y}px, 0)`;
    frame = window.requestAnimationFrame((now) => {
      previousFrame = now;
      animate(now);
    });
    void run();

    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleEscape);
      motion.removeEventListener("change", handleMotion);
      cancelScroll?.();
      waiters.splice(0).forEach((waiter) => waiter.done());
      writer?.done();
      writer = null;
      move?.done();
      move = null;
      setHover(null);
      if (guideMenuOpen) onMenuChange?.(false);
      root.classList.remove("is-here", "is-away", "is-up", "is-left");
    };
  }, [onExit, onMenuChange, onType]);

  return createPortal(
    <div className="terminal-guide" ref={cursorRef} aria-hidden="true">
      <svg className="terminal-guide__arrow" viewBox="0 0 24 24" fill="none">
        <path className="terminal-guide__rim" d="M5.5 5.5l3.9 11.7 2.2-5.6 5.6-2.2-11.7-3.9z" />
        <path className="terminal-guide__body" d="M5.5 5.5l3.9 11.7 2.2-5.6 5.6-2.2-11.7-3.9z" />
      </svg>
      <div className="terminal-guide__tag" ref={tagRef}>
        <span className="terminal-guide__name">Aayush</span>
        <div className="terminal-guide__clip" ref={clipRef}>
          <div className="terminal-guide__text" ref={textRef} />
        </div>
        <div className="terminal-guide__text terminal-guide__measure" ref={measureRef} />
        <span className="terminal-guide__caret" ref={caretRef} />
      </div>
    </div>,
    document.body,
  );
}
