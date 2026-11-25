import { socialLinks } from "../../data/portfolio";

export default function HeroSection() {
  return (
    <section className="hero content-wrap" id="home" data-section>
      <div className="hero-summary">
        <h1 className="hero-entrance">Aayush Koirala</h1>
        <p className="hero-entrance">
          I&apos;m a full-stack engineer currently focused on backend systems
          and generative AI. I build reliable web and mobile apps for
          real-world use.
        </p>
        <p className="hero-entrance">
          I&apos;m seeking an internship and opportunities to contribute to
          ambitious startup teams, turn early ideas into dependable software,
          and grow through meaningful production work.
        </p>
        <div className="hero-socials hero-entrance">
          {socialLinks.map((link) => (
            <a
              className={`hero-social hero-social--${link.label.toLowerCase()}`}
              href={link.href}
              key={link.label}
              target="_blank"
              rel="noreferrer"
            >
              {link.label.toLowerCase()} <span aria-hidden="true">{"\u2197"}</span>
            </a>
          ))}
          <a
            href="/resume/aayush_koirala_resume.pdf"
            target="_blank"
            rel="noreferrer"
          >
            resume <span aria-hidden="true">{"\u2197"}</span>
          </a>
        </div>
      </div>

      <dl className="hero-meta hero-entrance">
        <div>
          <dt>Location</dt>
          <dd>Bhaktapur, Nepal</dd>
        </div>
        <div>
          <dt>Education</dt>
          <dd>Computer Engineering</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>Open to internships</dd>
        </div>
      </dl>
    </section>
  );
}
