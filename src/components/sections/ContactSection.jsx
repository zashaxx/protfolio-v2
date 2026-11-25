import { Mail } from "lucide-react";
import { FaLinkedinIn, FaWhatsapp } from "react-icons/fa6";
import { contactEmail } from "../../data/portfolio";
import EmailCopyButton from "../EmailCopyButton";
import SectionHeading from "../SectionHeading";

export default function ContactSection({ soundEnabled }) {
  return (
    <section
      className="content-section content-wrap"
      id="contact"
      data-section
    >
      <SectionHeading
        number="06"
        label="contact"
        title="Get in touch"
        description="Email or WhatsApp works best."
      />

      <div className="contact-card" data-reveal>
        <p>
          I am currently open to internships, junior roles, and freelance web
          projects.
        </p>
        <div className="contact-card__email-group">
          <a className="contact-card__email" href={`mailto:${contactEmail}`}>
            <Mail size={16} strokeWidth={1.7} aria-hidden="true" />
            <span>{contactEmail}</span>
          </a>
          <EmailCopyButton email={contactEmail} soundEnabled={soundEnabled} />
        </div>
        <div className="contact-card__links">
          <a
            href="https://wa.me/9779804014936"
            target="_blank"
            rel="noreferrer"
          >
            <FaWhatsapp size={14} aria-hidden="true" />
            WhatsApp
          </a>
          <a
            href="https://www.linkedin.com/in/aayushkoirala8848/"
            target="_blank"
            rel="noreferrer"
          >
            <FaLinkedinIn size={13} aria-hidden="true" />
            LinkedIn
          </a>
        </div>
      </div>
    </section>
  );
}
