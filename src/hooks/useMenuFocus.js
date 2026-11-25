import { useEffect } from "react";

export default function useMenuFocus(open, panelRef, onClose) {
  useEffect(() => {
    if (!open) return undefined;

    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    const focusable = panelRef.current?.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    // The visibility transition can still be at its hidden starting frame when
    // React runs effects. Focus after the panel becomes visible.
    let focusFrame = 0;
    const focusFirst = () => {
      if (getComputedStyle(panelRef.current).visibility !== "visible") {
        focusFrame = window.requestAnimationFrame(focusFirst);
        return;
      }
      if (!panelRef.current.contains(document.activeElement)) {
        focusable?.[0]?.focus({ preventScroll: true });
      }
    };
    focusFrame = window.requestAnimationFrame(focusFirst);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus({ preventScroll: true });
    };
  }, [open, panelRef, onClose]);
}
