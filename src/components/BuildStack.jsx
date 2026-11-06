import { ArrowLeft } from "lucide-react";

const stackGroups = [
  {
    title: "Frontend",
    tools: ["JavaScript", "TypeScript", "React", "Next.js", "HTML", "CSS", "Vite"],
  },
  {
    title: "Backend",
    tools: [
      "Node.js",
      "Express",
      "Python",
      "FastAPI",
      "Socket.io",
      "PostgreSQL",
      "MongoDB",
    ],
  },
  {
    title: "Services",
    tools: ["Firebase", "Stripe", "REST APIs", "Authentication"],
  },
  {
    title: "DevOps & Cloud",
    tools: ["Git", "GitHub", "Docker", "Vercel"],
  },
  {
    title: "Security",
    tools: ["Input Validation", "XSS", "CSRF", "SQL Injection"],
  },
];

const previewTools = [
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "FastAPI",
  "PostgreSQL",
  "MongoDB",
  "Docker",
  "Vercel",
];

export function StackCategories({ reveal = true }) {
  return (
    <div className="stack-categories" data-reveal={reveal ? "" : undefined}>
      {stackGroups.map((group) => (
        <section className="stack-category" key={group.title}>
          <h2>{group.title}</h2>
          <ul aria-label={`${group.title} technologies`}>
            {group.tools.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function StackDetailPage({ onBack }) {
  return (
    <section className="detail-page content-wrap" aria-labelledby="stack-page-title">
      <a className="detail-page__back" href="/#stack" onClick={onBack}>
        <ArrowLeft size={15} strokeWidth={1.7} aria-hidden="true" />
        Back
      </a>
      <header className="detail-page__header" data-reveal>
        <h1 id="stack-page-title">tech stack</h1>
        <p>
          The tools and platforms I use across frontend, backend, services,
          deployment, and security.
        </p>
      </header>
      <StackCategories />
    </section>
  );
}

export default function BuildStack({ onViewAll }) {
  return (
    <section className="build-stack-section" id="stack" data-section>
      <div className="stack-mobile-layout">
        <header className="section-heading" data-reveal>
          <p className="section-heading__label">
            <span>03</span>
            <span aria-hidden="true">&mdash;</span>
            stack
          </p>
          <div className="section-heading__row">
            <h2>Tech stack</h2>
            <p>The tools and platforms I use across frontend, backend, and deployment.</p>
          </div>
        </header>
        <StackCategories />
      </div>

      <div className="stack-desktop-preview" data-reveal>
        <div className="preview-heading">
          <h2>03 &mdash; stack</h2>
          <a
            href="/?view=stack"
            onClick={(event) => onViewAll?.("stack", event)}
          >
            view all &rarr;
          </a>
        </div>
        <div className="stack-preview__tools" aria-label="Featured technologies">
          {previewTools.map((tool) => (
            <span key={tool}>{tool}</span>
          ))}
          <a
            href="/?view=stack"
            onClick={(event) => onViewAll?.("stack", event)}
          >
            + more
          </a>
        </div>
      </div>
    </section>
  );
}
