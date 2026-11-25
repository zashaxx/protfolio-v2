import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import "./DetailDrawer.css";

export default function DetailDrawer({ title, eyebrow, description, children, onClose }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    dialog.showModal();
    document.body.style.overflow = "hidden";
    if (window.matchMedia("(pointer: coarse), (max-width: 560px)").matches) {
      dialog.focus({ preventScroll: true });
    }

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (!closing) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion
      ? 0
      : parseFloat(window.getComputedStyle(dialogRef.current).getPropertyValue("--drawer-duration")) || 400;
    const timer = window.setTimeout(() => onCloseRef.current(), duration);
    return () => window.clearTimeout(timer);
  }, [closing]);

  const close = () => setClosing(true);

  return (
    <dialog
      ref={dialogRef}
      className={`detail-drawer${closing ? " is-closing" : ""}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      tabIndex={-1}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;

        const focusable = [...event.currentTarget.querySelectorAll(
          'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )].filter((element) => element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const onDialog = document.activeElement === event.currentTarget;

        if (!first) {
          event.preventDefault();
        } else if (event.shiftKey && (document.activeElement === first || onDialog)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || onDialog)) {
          event.preventDefault();
          first.focus();
        }
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom
        ) close();
      }}
    >
      <div className="detail-drawer__handle" aria-hidden="true" />
      <header className="detail-drawer__header">
        {eyebrow && <p className="detail-drawer__eyebrow">{eyebrow}</p>}
        <h2 id={titleId}>{title}</h2>
        <button
          className="detail-drawer__close"
          type="button"
          onClick={close}
          aria-label="Close details"
          title="Close details (Esc)"
          autoFocus
        >
          <X size={20} strokeWidth={1.6} aria-hidden="true" />
        </button>
      </header>
      <div className="detail-drawer__body">
        {description && <p className="detail-drawer__description" id={descriptionId}>{description}</p>}
        {children}
      </div>
    </dialog>
  );
}
