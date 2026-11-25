export default function SectionHeading({ number, label, title, description }) {
  return (
    <header className="section-heading" data-reveal>
      <p className="section-heading__label">
        <span>{number}</span>
        <span aria-hidden="true">&mdash;</span>
        {label}
      </p>
      <div className="section-heading__row">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
    </header>
  );
}
