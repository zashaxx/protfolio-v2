const REVEAL_INTERVAL = 160;

// Keep a stable identity when React remounts a previously visited view.
function revealKey(item, root, view) {
  const path = [];
  for (let node = item; node && node !== root; node = node.parentElement) {
    if (node.id || node.tagName === "FOOTER") {
      path.push(node.id ? `#${node.id}` : "footer");
      break;
    }
    const index = Array.prototype.indexOf.call(node.parentElement.children, node);
    path.push(`${node.tagName}:${index}`);
  }
  return `${view}:${path.reverse().join("/")}`;
}

export default function observeScrollReveals(root, revealed = new Set(), view = "home") {
  const items = Array.from(root.querySelectorAll("[data-reveal]"));
  const keys = new Map(items.map((item) => [item, revealKey(item, root, view)]));
  // Restore completed reveals before any layout reads or the first paint.
  items.forEach((item) => {
    if (revealed.has(keys.get(item))) item.classList.add("is-visible");
    if (item.classList.contains("is-visible")) revealed.add(keys.get(item));
  });
  const pending = new Set(items.filter((item) => !item.classList.contains("is-visible")));
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hero = root.querySelector("#home");
  let frame = 0;
  let timer = 0;
  let nextRevealAt = 0;
  let disposed = false;

  // Lower content waits for the visible landing entrances on the first visit.
  const landingEndsAt = performance.now() + Math.max(0, ...Array.from(
    root.querySelectorAll(".hero-entrance"),
  ).filter((item) => item.getClientRects().length).flatMap((item) =>
    item.getAnimations().filter((animation) => animation.animationName === "hero-enter")
      .map((animation) => Math.max(0, animation.effect.getComputedTiming().endTime - (animation.currentTime ?? 0))),
  ));

  items.forEach((item) => item.style.removeProperty("--reveal-delay"));

  const reveal = (item) => {
    pending.delete(item);
    observer.unobserve(item);
    revealed.add(keys.get(item));
    item.classList.add("is-visible");
  };

  const schedule = () => {
    if (!disposed && !frame) frame = window.requestAnimationFrame(drain);
  };

  function drain() {
    frame = 0;
    window.clearTimeout(timer);
    if (disposed || document.hidden) return;
    if (motion.matches) {
      pending.forEach(reveal);
      return;
    }

    // Responsive display:none variants never hold up the visible sequence.
    const ordered = Array.from(pending).filter((item) => item.getClientRects().length)
      .map((item) => ({ item, rect: item.getBoundingClientRect() }))
      .sort((a, b) => a.rect.top - b.rect.top);

    // A navigation jump should not make the user wait for offscreen content.
    // Complete everything passed above, then animate the destination in order.
    for (const { item, rect } of ordered) {
      if (rect.bottom <= 0) reveal(item);
    }
    const next = ordered.find(({ item, rect }) => pending.has(item)
      && rect.top < window.innerHeight && rect.bottom > 0);
    if (!next) return;

    const heroRect = hero?.getBoundingClientRect();
    const landingVisible = heroRect && heroRect.bottom > 0 && heroRect.top < window.innerHeight;
    const wait = Math.max(nextRevealAt, landingVisible ? landingEndsAt : 0) - performance.now();
    if (wait > 0) {
      timer = window.setTimeout(schedule, wait);
      return;
    }

    reveal(next.item);
    nextRevealAt = performance.now() + REVEAL_INTERVAL;
    if (pending.size) timer = window.setTimeout(schedule, REVEAL_INTERVAL);
  }

  // Intersection callbacks only wake the queue; they never reveal independently.
  const observer = new IntersectionObserver(schedule, { threshold: 0 });
  pending.forEach((item) => observer.observe(item));
  const resizeObserver = new ResizeObserver(schedule);
  resizeObserver.observe(root);
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  document.addEventListener("visibilitychange", schedule);
  motion.addEventListener("change", schedule);
  schedule();

  return () => {
    disposed = true;
    window.cancelAnimationFrame(frame);
    window.clearTimeout(timer);
    observer.disconnect();
    resizeObserver.disconnect();
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    document.removeEventListener("visibilitychange", schedule);
    motion.removeEventListener("change", schedule);
  };
}
