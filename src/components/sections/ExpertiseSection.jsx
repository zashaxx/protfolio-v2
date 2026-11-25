import { ArrowUpRight } from "lucide-react";
import { expertise } from "../../data/portfolio";
import SectionHeading from "../SectionHeading";

export default function ExpertiseSection() {
  return (
    <section
      className="content-section content-wrap"
      id="expertise"
      data-section
    >
      <SectionHeading
        number="02"
        label="expertise"
        title="What I work with"
        description="Frontend, backend, and web security."
      />

      <div className="expertise-list">
        {expertise.map((item) => (
          <article className="expertise-item" key={item.number} data-reveal>
            <div className="expertise-item__index">{item.number}</div>
            <div className="expertise-item__title">
              <p>{item.eyebrow}</p>
              <h3>{item.title}</h3>
              <span>{item.status}</span>
            </div>
            <ul>
              {item.duties.map((duty) => (
                <li key={duty}>{duty}</li>
              ))}
              {item.certificate && (
                <li>
                  <a
                    className="inline-arrow-link"
                    href={item.certificate}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View certificate
                    <ArrowUpRight
                      size={12}
                      strokeWidth={1.7}
                      aria-hidden="true"
                    />
                  </a>
                </li>
              )}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
