import { ArrowDown } from "lucide-react";
import { galleryProjects } from "../../data/portfolio";
import ProjectGallery from "../ProjectGallery";
import SectionHeading from "../SectionHeading";
import AllProjectsList from "../projects/AllProjectsList";

export default function ProjectsSection({ showAllProjects, onToggleProjects, onViewAll }) {
  return (
    <section
      className="content-section content-wrap"
      id="projects"
      data-section
    >
      <div className="projects-desktop-preview">
        <div className="preview-heading" data-reveal>
          <h2>04 &mdash; projects</h2>
          <a
            href="/?view=projects"
            onClick={(event) => onViewAll("projects", event)}
          >
            all projects &rarr;
          </a>
        </div>
      </div>

      <div className="projects-mobile-layout">
        <SectionHeading
          number="04"
          label="selected work"
          title="Projects"
          description="Selected applications and platforms I have built."
        />
      </div>

      <ProjectGallery projects={galleryProjects} />

      <div className="projects-mobile-layout">
        <button
          className="view-all-projects"
          type="button"
          onClick={onToggleProjects}
          aria-expanded={showAllProjects}
          aria-controls="more-projects"
        >
          {showAllProjects ? "Show fewer projects" : "View all projects"}
          <ArrowDown
            size={17}
            strokeWidth={1.6}
            aria-hidden="true"
            className={showAllProjects ? "is-open" : ""}
          />
        </button>

        {showAllProjects && (
          <div className="all-projects is-open" id="more-projects">
            <AllProjectsList />
          </div>
        )}
      </div>
    </section>
  );
}
