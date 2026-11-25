import { ArrowLeft } from "lucide-react";
import AllProjectsList from "./AllProjectsList";

export default function ProjectsDetailPage({ onBack }) {
  return (
    <section className="detail-page content-wrap" aria-labelledby="projects-page-title">
      <a className="detail-page__back" href="/#projects" onClick={onBack}>
        <ArrowLeft size={15} strokeWidth={1.7} aria-hidden="true" />
        Back
      </a>
      <header className="detail-page__header" data-reveal>
        <h1 id="projects-page-title">projects</h1>
        <p>
          Applications and platforms I have built across commerce, education,
          video, APIs, and small product experiments.
        </p>
      </header>
      <AllProjectsList />
    </section>
  );
}
