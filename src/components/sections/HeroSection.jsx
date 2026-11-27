import { socialLinks } from "../../data/portfolio";
import "./HeroAvatar.css";

export default function HeroSection() {
  return (
    <section className="hero content-wrap" id="home" data-section>
      <div className="hero-summary">
        <div
          className="hero-avatar hero-entrance"
          data-skel="12"
          role="img"
          aria-label="Illustrated portrait of Aayush Koirala"
        >
          <div className="hero-avatar__portrait">
            <img
              className="hero-avatar__image hero-avatar__image--light"
              src="/dark-shirt-white-background.png"
              alt=""
              aria-hidden="true"
              width="256"
              height="256"
              loading="eager"
              fetchPriority="high"
              draggable="false"
            />
            <img
              className="hero-avatar__image hero-avatar__image--dark"
              src="/dark-background.png"
              alt=""
              aria-hidden="true"
              width="256"
              height="256"
              loading="eager"
              fetchPriority="high"
              draggable="false"
            />
          </div>
        </div>
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
