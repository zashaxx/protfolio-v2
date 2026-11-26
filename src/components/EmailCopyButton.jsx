import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import "./EmailCopyButton.css";

async function copyEmail(email) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(email);
      return true;
    } catch {
      // Browser permissions or an insecure context can require the fallback.
    }
  }

  const previousFocus = document.activeElement;
  const selection = window.getSelection();
  const ranges = selection
    ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange())
    : [];
  const field = document.createElement("textarea");
  field.value = email;
  field.readOnly = true;
  field.tabIndex = -1;
  field.setAttribute("aria-hidden", "true");
  field.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0;font-size:16px;";
  document.body.append(field);

  try {
    field.focus({ preventScroll: true });
    field.select();
    field.setSelectionRange(0, email.length);
    return Boolean(document.execCommand?.("copy"));
  } catch {
    return false;
  } finally {
    field.remove();
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    if (selection && ranges.length) {
      selection.removeAllRanges();
      ranges.forEach((range) => selection.addRange(range));
    }
  }
}

export default function EmailCopyButton({ email, compact = false }) {
  const [feedback, setFeedback] = useState({ status: "idle", version: 0, email });
  const mountedRef = useRef(false);
  const requestRef = useRef(0);
  const timerRef = useRef(null);
  const status = feedback.email === email ? feedback.status : "idle";
  const copied = status === "copied";

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
      window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const version = ++requestRef.current;
    window.clearTimeout(timerRef.current);

    const success = await copyEmail(email);
    if (!mountedRef.current || requestRef.current !== version) return;

    setFeedback({ status: success ? "copied" : "error", version, email });
    timerRef.current = window.setTimeout(() => {
      if (mountedRef.current && requestRef.current === version) {
        setFeedback({ status: "idle", version, email });
      }
    }, 1600);
  };

  const announcement = copied
    ? feedback.version % 2 ? "Email address copied." : "Copied email address."
    : status === "error" ? "Unable to copy automatically. Select and copy the email address." : "";

  return (
    <button
      className={`email-copy-button${compact ? " email-copy-button--compact" : ""}${copied ? " is-copied" : ""}`}
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied email address" : "Copy email address"}
      title={copied ? "Copied" : `Copy ${email}`}
      data-copy-state={status}
    >
      <Copy className="email-copy-button__copy" size={18} strokeWidth={1.6} aria-hidden="true" />
      <Check className="email-copy-button__check" size={18} strokeWidth={1.7} aria-hidden="true" />
      {status !== "idle" && (
        <span className="email-copy-button__feedback" key={feedback.version} aria-hidden="true">
          {copied ? "Copied" : "Copy failed"}
        </span>
      )}
      <span className="email-copy-button__status" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </button>
  );
}
