import { ArrowUpRight } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { otherProjects } from "../../data/portfolio";

export default function ProjectRows({ className = "", id }) {
  return (
    <div className={`other-projects ${className}`.trim()} id={id} data-reveal>
      {otherProjects.map((project) => (
        <article className="project-row" key={project.title}>
          <h3>
            <a
              href={project.live ?? project.source}
              target="_blank"
              rel="noreferrer"
            >
              {project.title}
            </a>
          </h3>
          <div className="project-row__details">
            <p className="project-row__type">{project.type}</p>
            <p>{project.description}</p>
          </div>
          <div className="project-row__links">
            <a
              href={project.source}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.title} source code`}
            >
              <FaGithub size={14} aria-hidden="true" />
            </a>
            {project.live && (
              <a
                href={project.live}
                target="_blank"
                rel="noreferrer"
                aria-label={`${project.title} live site`}
              >
                <ArrowUpRight size={15} strokeWidth={1.6} aria-hidden="true" />
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
