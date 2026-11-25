import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./TerminalEffects.css";

const tourSteps = [
  {
    selector: "#home h1, #projects-page-title, #stack-page-title",
    at: "above",
    free: true,
    text: "Hi! I'm Aayush. Welcome to my portfolio! 👋",
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
    text: "That's the tour. Scroll around and enjoy your stay! ✌️",
  },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const random = (min, max) => min + Math.random() * (max - min);

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

export default function TerminalClone({ onExit, onMenuChange }) {
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
    const shown = { ...goal, vx: 0, vy: 0 };
    const waiters = [];
    let cancelScroll = null;
    let hovered = null;
    let move = null;
    let rest = null;
    let frame = 0;
    let clock = 0;
    let previousFrame = 0;
    let running = true;
    let typing = false;
    let tremor = 1;
    let layout = null;
    let preferAbove = false;
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

    const targets = (selector) => Array.from(document.querySelectorAll(selector))
      .filter((element) => {
        if (element.closest("[inert]")) return false;
        const rect = element.getBoundingClientRect();
        const scroller = element.closest(".sidebar-nav, .mobile-menu__nav");
        const viewport = scroller?.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.top >= 0
          && rect.bottom <= window.innerHeight && getComputedStyle(element).visibility !== "hidden"
          && (!viewport || (rect.top >= viewport.top && rect.bottom <= viewport.bottom));
      });

    const placeTag = (point) => {
      if (!layout) return;
      const width = Math.max(name.offsetWidth, layout.width) + 22;
      const height = name.offsetHeight + layout.height + 10;
      const fitsBelow = point.y + 19 + height + 10 <= window.innerHeight;
      const fitsAbove = point.y - height - 10 >= 0;
      root.classList.toggle("is-up", fitsAbove && (preferAbove || !fitsBelow));
      const left = point.x + 16 + width + 10 > window.innerWidth;
      root.classList.toggle("is-left", left);
      const tagLeft = left ? point.x - width - 1 : point.x + 16;
      const tagTop = root.classList.contains("is-up") ? point.y - height - 1 : point.y + 19;
      root.style.setProperty("--guide-tag-x", `${clamp(tagLeft, 12, window.innerWidth - width - 12) - tagLeft}px`);
      root.style.setProperty("--guide-tag-y", `${clamp(tagTop, 12, window.innerHeight - height - 12) - tagTop}px`);
    };

    const hush = () => {
      clip.style.width = "0px";
      clip.style.height = "0px";
      tag.classList.remove("is-talking", "is-typing");
    };

    const type = async (layout) => {
      if (!running) return;
      inner.style.width = `${layout.width}px`;
      inner.replaceChildren(...layout.chars, caret);
      tag.classList.add("is-talking", "is-typing");
      typing = true;
      let width = 0;
      const pace = random(0.9, 1.15);

      for (let index = 0; index < layout.chars.length && running; index += 1) {
        const box = layout.boxes[index];
        const part = layout.parts[index];
        layout.chars[index].classList.add("is-on");
        width = Math.max(width, box.right);
        clip.style.width = `${Math.ceil(width) + 2}px`;
        clip.style.height = `${box.bottom}px`;
        caret.style.transform = `translate(${box.right}px, ${box.top}px)`;
        let delay = random(8, 19) * pace;
        if (/[.!?]/.test(part)) delay = random(70, 125);
        else if (/[,;:]/.test(part)) delay = random(40, 80);
        else if (part === " " && Math.random() < 0.1) delay += random(45, 110);
        await sleep(delay);
      }

      typing = false;
      tag.classList.remove("is-typing");
    };

    const glide = (to, duration) => new Promise((done) => {
      if (!running) { done(); return; }
      const from = { x: goal.x, y: goal.y };
      const target = to();
      const dx = target.x - from.x;
      const dy = target.y - from.y;
      const distance = Math.hypot(dx, dy) || 1;
      const bend = Math.min(distance * random(0.08, 0.28), 64)
        * (Math.random() < 0.5 ? -1 : 1);
      const secondBend = Math.random() < 0.3 ? -bend * random(0.3, 0.8) : bend * random(0.4, 1.1);
      move = {
        from,
        to,
        t0: clock,
        duration,
        skew: random(0.72, 0.94),
        nx: -dy / distance,
        ny: dx / distance,
        bend,
        secondBend,
        done,
      };
    });

    const moveTo = async (to, options = {}) => {
      const offset = { x: random(-2.5, 2.5), y: random(-1.5, 1.5) };
      const aim = options.direct ? to : () => {
        const point = to();
        return { x: point.x + offset.x, y: point.y + offset.y };
      };
      const target = aim();
      const dx = target.x - goal.x;
      const dy = target.y - goal.y;
      const distance = Math.hypot(dx, dy) || 1;
      const duration = (options.duration ?? clamp(210 + Math.sqrt(distance) * 25, 330, 1000)) * random(0.88, 1.15);
      const roll = Math.random();

      if (options.direct || distance < 160 || roll > 0.65) {
        await glide(aim, duration);
        return;
      }

      const miss = clamp(distance * random(0.025, 0.06), 5, 22) * (roll < 0.4 ? 1 : -1);
      const drift = random(-0.5, 0.5) * miss;
      const overX = dx / distance * miss - dy / distance * drift;
      const overY = dy / distance * miss + dx / distance * drift;
      await glide(() => {
        const point = aim();
        return { x: point.x + overX, y: point.y + overY };
      }, duration);
      await sleep(random(45, 100));
      await glide(aim, random(145, 230));
    };

    const anchor = (element, at) => () => {
      const rect = element.getBoundingClientRect();
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
      if (onMenuChange && step.menu && step.selector) {
        const menuItem = Array.from(document.querySelectorAll(step.selector))
          .find((element) => element.closest(".mobile-menu__nav"));
        const scroller = menuItem?.closest(".mobile-menu__nav");
        if (scroller) {
          const itemRect = menuItem.getBoundingClientRect();
          const scrollRect = scroller.getBoundingClientRect();
          if (itemRect.top < scrollRect.top || itemRect.bottom > scrollRect.bottom) {
            scroller.scrollTo({
              top: scroller.scrollTop + itemRect.top - scrollRect.top - (scrollRect.height - itemRect.height) / 2,
              behavior: "smooth",
            });
            await sleep(400);
            if (!running) return;
          }
        }
      }
      const elements = step.selector ? targets(step.selector) : [];
      if (!elements.length && !step.free) return;
      const points = elements.length ? elements.map((element) => anchor(element, step.at)) : [openSpace];
      layout = makeTextLayout(step.text, measure);
      preferAbove = step.at === "above";
      hush();
      placeTag(points[0]());
      setHover(elements[0]);
      await moveTo(points[0]);
      await sleep(random(70, 130));
      await type(layout);

      if (points.length > 1) {
        await sleep(random(550, 750));
        for (let index = 1; index < points.length; index += 1) {
          if (!running) break;
          await sleep(random(80, 150));
          setHover(elements[index]);
          placeTag(points[index]());
          await moveTo(points[index], { duration: random(240, 340) });
        }
        await sleep(random(550, 750));
      } else {
        await sleep((850 + layout.chars.length * 20) * random(0.95, 1.15));
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
      const delta = deltaMs / 1000;
      clock += deltaMs;

      if (move) {
        const task = move;
        const progress = Math.min((clock - task.t0) / task.duration, 1);
        const biased = Math.pow(progress, task.skew);
        const eased = biased ** 3 * (biased * (biased * 6 - 15) + 10);
        const side = 3 * (1 - eased) ** 2 * eased * task.bend
          + 3 * (1 - eased) * eased ** 2 * task.secondBend;
        const point = task.to();
        goal.x = task.from.x + (point.x - task.from.x) * eased + task.nx * side;
        goal.y = task.from.y + (point.y - task.from.y) * eased + task.ny * side;
        if (progress === 1) {
          rest = task.to;
          move = null;
          task.done();
        }
      } else if (rest) {
        const point = rest();
        goal.x = point.x;
        goal.y = point.y;
      }
      placeTag(move ? move.to() : goal);

      const spring = 190;
      const damping = 2 * Math.sqrt(spring) * 0.82;
      const hops = Math.max(1, Math.ceil(deltaMs / 12));
      const hop = delta / hops;
      for (let index = 0; index < hops; index += 1) {
        shown.vx += (spring * (goal.x - shown.x) - damping * shown.vx) * hop;
        shown.vy += (spring * (goal.y - shown.y) - damping * shown.vy) * hop;
        shown.x += shown.vx * hop;
        shown.y += shown.vy * hop;
      }

      tremor += ((typing ? 0 : 1) - tremor) * Math.min(deltaMs / 280, 1);
      const x = shown.x + (Math.sin(clock / 830 + 1.3) * 1.5
        + Math.sin(clock / 310 + 4.1) * 0.6 + Math.sin(clock / 127) * 0.22) * tremor;
      const y = shown.y + (Math.cos(clock / 1010 + 0.4) * 1.3
        + Math.sin(clock / 370 + 2.2) * 0.55 + Math.cos(clock / 141 + 5) * 0.2) * tremor;
      root.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;

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
      await moveTo(() => ({ x: window.innerWidth + 80, y: window.innerHeight * 0.3 }), { direct: true });
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
      move?.done();
      move = null;
      setHover(null);
      if (guideMenuOpen) onMenuChange?.(false);
      root.classList.remove("is-here", "is-away", "is-up", "is-left");
    };
  }, [onExit, onMenuChange]);

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
