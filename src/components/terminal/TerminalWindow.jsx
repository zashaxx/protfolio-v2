import { createPortal } from "react-dom";
import { Minus, X } from "lucide-react";

export default function TerminalWindow({ windowState, windowRef, position, dragHandlers, onClose, onMinimize, activeMode, onExitMode, children }) {
  if (windowState === "closed") return null;
  const isOpen = windowState === "open";

  return createPortal(
    <section
      className="terminal-window"
      data-window-state={windowState}
      role="dialog"
      aria-labelledby="terminal-title"
      aria-hidden={!isOpen}
      inert={!isOpen}
      ref={windowRef}
      style={position ? { left: position.x, top: position.y } : undefined}
    >
      <header className="terminal-window__bar" {...dragHandlers}>
        <div className="terminal-window__controls" role="group" aria-label="Window controls" data-ui-sound="terminal-control">
          <button
            className="terminal-window__control terminal-window__control--close"
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onClose(true)}
            aria-label="Close terminal"
            title="Close terminal"
          >
            <X size={8} strokeWidth={2.5} aria-hidden="true" />
          </button>
          <button
            className="terminal-window__control terminal-window__control--minimize"
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onMinimize}
            aria-label="Minimize terminal"
            title="Minimize terminal"
          >
            <Minus size={8} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
        <span className="terminal-window__title" id="terminal-title">terminal</span>
        <span className="terminal-window__user">guest@zashaxx</span>
      </header>
      {children}
      {activeMode && (
        <footer className="terminal-window__status">
          <span>/{activeMode}</span>
          <button type="button" onClick={onExitMode} aria-label={`Exit ${activeMode} mode`}>
            <kbd>Esc</kbd> to exit
          </button>
        </footer>
      )}
    </section>,
    document.body,
  );
}
