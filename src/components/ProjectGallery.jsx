import { useCallback, useState } from "react";
import ProjectWindow from "./projects/ProjectWindow";
import "./ProjectGallery.css";

const fanPositions = [
  { x: -150, rotation: -9 },
  { x: -75, rotation: -4.5 },
  { x: 0, rotation: 0 },
  { x: 75, rotation: 4.5 },
  { x: 150, rotation: 9 },
];

const centerIndex = Math.floor(fanPositions.length / 2);

function getCardOffset(index, activeIndex) {
  const restingX = fanPositions[index].x;

  if (activeIndex === null) return restingX;
  if (activeIndex === centerIndex) return restingX * 1.18;

  const direction = Math.sign(centerIndex - activeIndex);
  const distance = (index - activeIndex) * direction;

  if (distance < 0) return restingX - 20 * direction;
  if (distance === 0) return restingX;

  return fanPositions[activeIndex].x + direction * (218 + (distance - 1) * 22);
}

export default function ProjectGallery({ projects }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selection, setSelection] = useState(null);
  const activeIndex = selection?.index ?? hoveredIndex;
  const visibleProjects = projects.slice(0, fanPositions.length);
  const closeProject = useCallback(() => setSelection(null), []);

  const selectProject = (project, index, event) => {
    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    const transform = new DOMMatrixReadOnly(window.getComputedStyle(card).transform);
    const windowWidth = Math.min(448, window.innerWidth - 32);

    setSelection({
      project,
      index,
      origin: {
        x: bounds.left + bounds.width / 2 - window.innerWidth / 2,
        y: bounds.top + bounds.height / 2 - window.innerHeight / 2,
        scale: bounds.width / windowWidth,
        rotation: Math.atan2(transform.b, transform.a) * (180 / Math.PI),
      },
    });
  };

  return (
    <div className="project-gallery" data-reveal>
      <div
        className="project-fan"
        role="group"
        aria-label="Selected projects. Choose a preview to view project details."
        onPointerLeave={() => setHoveredIndex(null)}
      >
        {visibleProjects.map((project, index) => {
          const isActive = activeIndex === index;
          const isSelected = selection?.index === index;

          return (
            <button
              className={`project-fan__card${isSelected ? " is-selected" : ""}`}
              type="button"
              key={project.title}
              aria-label={`View ${project.title} details`}
              aria-haspopup="dialog"
              aria-expanded={isSelected}
              style={{
                "--card-x": `${getCardOffset(index, activeIndex)}px`,
                "--card-y": isSelected ? "-22px" : isActive ? "-16px" : "0px",
                "--card-rotation": `${isActive ? 0 : fanPositions[index].rotation}deg`,
                "--card-scale": isSelected ? 1.04 : 1,
                zIndex: isSelected ? 4 : centerIndex + 1 - Math.abs(index - centerIndex),
              }}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") setHoveredIndex(index);
              }}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              onClick={(event) => selectProject(project, index, event)}
            >
              <img
                src={project.preview}
                alt=""
                width="800"
                height="500"
                loading="lazy"
                decoding="async"
                draggable="false"
              />
            </button>
          );
        })}
        <div className="project-fan__caption" aria-hidden="true">
          {activeIndex !== null && (
            <p key={activeIndex}>{visibleProjects[activeIndex].title}</p>
          )}
        </div>
      </div>
      {selection && <ProjectWindow selection={selection} onClose={closeProject} />}
    </div>
  );
}
