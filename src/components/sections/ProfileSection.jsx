import SectionHeading from "../SectionHeading";

export default function ProfileSection() {
  return (
    <section className="content-section content-wrap" id="about" data-section>
      <SectionHeading
        number="01"
        label="profile"
        title="Background"
      />

      <div className="about-grid">
        <article className="about-copy" data-reveal>
          <p>
            I started with frontend projects and moved into backend development
            as the applications became more complex. I now work across React
            interfaces, APIs, authentication, databases, and deployment.
          </p>
          <p>
            I use Node.js and Express for most backend work, with MongoDB or
            PostgreSQL for data. I also completed a certification in{" "}
            <a href="/python_certificate_cs.pdf" target="_blank" rel="noreferrer">
              Python for Web Security
            </a>.
          </p>
          <p>
            Away from code, I am usually reading, watching a film, exploring
            interface design, or playing a game.
          </p>
        </article>
      </div>

      <dl className="profile-facts" data-reveal>
        <div>
          <dt>Education</dt>
          <dd>B.E. Computer Engineering</dd>
        </div>
        <div>
          <dt>Interests</dt>
          <dd>Systems, interfaces, security</dd>
        </div>
        <div>
          <dt>Working style</dt>
          <dd>Build, test, improve</dd>
        </div>
      </dl>
    </section>
  );
}
