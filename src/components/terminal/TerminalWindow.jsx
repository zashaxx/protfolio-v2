import { createPortal } from "react-dom";
import { Minus, X } from "lucide-react";

const resizeDirections = ["e", "se", "s", "w"];

export default function TerminalWindow({ windowState, windowRef, position, size, dragHandlers, resizeHandlers, onClose, onMinimize, activeMode, onExitMode, onClick, children }) {
  if (windowState === "closed") return null;
  const isOpen = windowState === "open";
  const isPlaying = activeMode === "play";
  const width = size?.width ?? (isPlaying ? 760 : undefined);
  const height = size?.height ?? (isPlaying ? 560 : undefined);
  const left = isPlaying && position
    ? `min(${position.x}px, max(8px, calc(100vw - ${width}px - 8px)))`
    : position?.x;
  const top = isPlaying && position
    ? `min(${position.y}px, max(8px, calc(100vh - ${height}px - 8px)))`
    : position?.y;

  return createPortal(
    <section
      className="terminal-window"
      data-window-state={windowState}
      data-active-mode={activeMode ?? "command"}
      role="dialog"
      aria-labelledby="terminal-title"
      aria-hidden={!isOpen}
      inert={!isOpen}
      ref={windowRef}
      onClick={onClick}
      style={{ left, top, width, height }}
    >
      <header className="terminal-window__bar" {...dragHandlers}>
        <div className="terminal-window__controls" role="group" aria-label="Window controls">
          <button
            className="terminal-window__control terminal-window__control--close"
            type="button"
            onClick={onClose}
            aria-label="Close terminal"
            title="Close terminal"
          >
            <X size={8} strokeWidth={2.5} aria-hidden="true" />
          </button>
          <button
            className="terminal-window__control terminal-window__control--minimize"
            type="button"
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
      {resizeDirections.map((direction) => direction === "se" ? (
        <button
          key={direction}
          className={`terminal-window__resize terminal-window__resize--${direction}`}
          data-resize-direction={direction}
          type="button"
          aria-label="Resize terminal"
          title="Drag to resize, or use arrow keys (Shift for larger steps)"
          {...resizeHandlers}
        />
      ) : (
        <span
          key={direction}
          className={`terminal-window__resize terminal-window__resize--${direction}`}
          data-resize-direction={direction}
          aria-hidden="true"
          {...resizeHandlers}
        />
      ))}
    </section>,
    document.body,
  );
}
