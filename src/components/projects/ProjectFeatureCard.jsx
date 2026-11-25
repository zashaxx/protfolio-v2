import { ArrowUpRight } from "lucide-react";
import { FaGithub } from "react-icons/fa6";

export default function ProjectFeatureCard({ project }) {
  const ProjectIcon = project.icon;

  return (
    <article className="featured-project-card">
      <div className="featured-project-card__heading">
        <span className="project-card__icon" aria-hidden="true">
          <ProjectIcon size={24} strokeWidth={1.45} />
        </span>
        <div>
          <ul
            className="project-card__chips"
            aria-label={`${project.title} technologies`}
          >
            {project.stack.slice(0, 3).map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>
          <h3>{project.title}</h3>
        </div>
      </div>
      <p className="featured-project-card__type">{project.subtitle}</p>
      <p className="project-card__description">{project.description}</p>
      <a
        className="project-card__source"
        href={project.href}
        target="_blank"
        rel="noreferrer"
      >
        <FaGithub size={16} aria-hidden="true" />
        View source
        <ArrowUpRight size={15} strokeWidth={1.6} aria-hidden="true" />
      </a>
    </article>
  );
}
