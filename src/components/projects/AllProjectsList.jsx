import { projects } from "../../data/portfolio";
import ProjectFeatureCard from "./ProjectFeatureCard";
import ProjectRows from "./ProjectRows";

export default function AllProjectsList() {
  return (
    <>
      <div className="featured-projects detail-featured-projects" data-reveal>
        {projects.map((project) => (
          <ProjectFeatureCard project={project} key={project.title} />
        ))}
      </div>
      <ProjectRows className="detail-project-rows" />
    </>
  );
}
