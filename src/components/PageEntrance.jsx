import { useLayoutEffect, useRef, useState } from "react";
import createSkeletonCanvas from "./skeletonCanvas";
import "./PageEntrance.css";

const TARGETS = ".hero-entrance, [data-reveal], .detail-page__back";
const REVEAL_DURATION = 924;

function visibleTargets(root) {
  const candidates = Array.from(root.querySelectorAll(TARGETS));
  return candidates.filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0
      && rect.top < window.innerHeight
      && !candidates.some((parent) => parent !== element && parent.contains(element));
  }).sort((first, second) => {
    const a = first.getBoundingClientRect();
    const b = second.getBoundingClientRect();
    return a.top - b.top || a.left - b.left;
  });
}

export default function PageEntrance({ rootRef, onStart, onReveal, initial }) {
  const canvasRef = useRef(null);
  const initialRef = useRef(initial);
  const [showCanvas, setShowCanvas] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useLayoutEffect(() => {
    onStart();
    const root = rootRef.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || motion.matches) {
      onReveal();
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    let disposed = false;
    let revealed = false;
    let frame = 0;
    let renderer;
    let targets = [];
    const animations = [];
    const timers = new Set();
    const wait = (duration) => new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        resolve();
      }, duration);
      timers.add(timer);
    });
    const restoreScroll = () => { document.body.style.overflow = previousOverflow; };

    const reveal = () => {
      if (disposed || revealed) return;
      revealed = true;
      targets = visibleTargets(root);
      // Scroll reveals pick up these completed items when their observer starts.
      targets.forEach((element) => {
        if (element.matches("[data-reveal]")) element.classList.add("is-visible");
      });
      renderer?.refresh(targets);
      const step = targets.length > 1 ? Math.min(50, 500 / (targets.length - 1)) : 0;
      const animate = (element, delay = 0) => {
        animations.push(element.animate([
          { opacity: 0, filter: "blur(8px)", translate: "0 6px" },
          { opacity: 1, filter: "blur(0px)", translate: "0 0" },
        ], {
          duration: REVEAL_DURATION,
          delay,
          easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          fill: "backwards",
        }));
      };
      if (!motion.matches) {
        targets.forEach((element, index) => animate(element, index * step));
        if (initialRef.current) {
          document.querySelectorAll(".desktop-sidebar, .mobile-header").forEach((element) => {
            if (element.getClientRects().length) animate(element);
          });
        }
      }
      restoreScroll();
      onReveal();
      void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
        if (!disposed) renderer?.retract();
      });
    };

    const start = () => {
      if (disposed || revealed) return;
      targets = visibleTargets(root);
      renderer = createSkeletonCanvas(canvasRef.current, targets, {
        onComplete: () => { if (!disposed) setShowCanvas(false); },
      });
      const images = Array.from(root.querySelectorAll("img")).filter((image) => {
        const rect = image.getBoundingClientRect();
        return rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
      }).map((image) => image.decode().catch(() => {}));
      const resources = Promise.allSettled([document.fonts.ready, ...images]);
      void Promise.all([wait(630), Promise.race([resources, wait(4000)])]).then(() => {
        if (disposed) return;
        frame = window.requestAnimationFrame(reveal);
      });
    };
    // Navigation restores scroll after mounting the new view. Measure once it settles.
    frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(start);
    });
    const finishForReducedMotion = () => {
      if (!motion.matches) return;
      reveal();
      animations.forEach((animation) => animation.finish());
      renderer?.stop();
      setShowCanvas(false);
    };
    motion.addEventListener("change", finishForReducedMotion);

    return () => {
      disposed = true;
      timers.forEach(window.clearTimeout);
      window.cancelAnimationFrame(frame);
      animations.forEach((animation) => animation.cancel());
      renderer?.stop();
      restoreScroll();
      motion.removeEventListener("change", finishForReducedMotion);
    };
  }, [rootRef, onStart, onReveal]);

  return showCanvas ? <canvas ref={canvasRef} className="page-skeleton" aria-hidden="true" /> : null;
}
