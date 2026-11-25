import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { FaGithub } from "react-icons/fa6";

export default function ProjectWindow({ selection, onClose }) {
  const { project, origin } = selection;
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const [closing, setClosing] = useState(false);
  const technologies = project.stack ?? project.tech;

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (!closing) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(onClose, reduceMotion ? 0 : 220);
    return () => window.clearTimeout(timer);
  }, [closing, onClose]);

  const close = () => setClosing(true);

  return (
    <dialog
      className={`project-window${closing ? " is-closing" : ""}`}
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      style={{
        "--project-origin-x": `${origin.x}px`,
        "--project-origin-y": `${origin.y}px`,
        "--project-origin-scale": origin.scale,
        "--project-origin-rotation": `${origin.rotation}deg`,
      }}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;

        const focusable = event.currentTarget.querySelectorAll('button:not([disabled]), a[href]');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;

        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom
        ) {
          close();
        }
      }}
    >
      <header className="project-window__bar">
        <span>Project details</span>
        <button
          className="project-window__close"
          type="button"
          onClick={close}
          aria-label="Close project details"
          title="Close project details (Esc)"
          autoFocus
        >
          <X size={17} strokeWidth={1.7} aria-hidden="true" />
        </button>
      </header>

      <img
        className="project-window__preview"
        src={project.preview}
        alt={`${project.title} preview`}
        width="800"
        height="500"
      />

      <div className="project-window__body">
        <p className="project-window__type">{project.subtitle ?? project.type}</p>
        <h3 id={titleId}>{project.title}</h3>
        <p className="project-window__description" id={descriptionId}>
          {project.description}
        </p>
        <ul className="project-card__chips" aria-label="Technologies used">
          {technologies.map((technology) => <li key={technology}>{technology}</li>)}
        </ul>
        <div className="project-window__links">
          <a href={project.href ?? project.source} target="_blank" rel="noreferrer">
            <FaGithub size={15} aria-hidden="true" />
            View source
            <ArrowUpRight size={14} strokeWidth={1.6} aria-hidden="true" />
          </a>
          {project.live && (
            <a href={project.live} target="_blank" rel="noreferrer">
              Visit site
              <ArrowUpRight size={14} strokeWidth={1.6} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </dialog>
  );
}
