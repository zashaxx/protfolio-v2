import { flushSync } from "react-dom";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Download, MoonStar, SunMedium, X, Folder, ExternalLink, ChevronDown } from "lucide-react";
import { FaGithub, FaInstagram, FaLinkedinIn, FaWhatsapp } from "react-icons/fa6";
import Preloader from "./components/Preloader";
import TechIcon from "./components/TechIcon";
import "./App.css";

const navItems = [
  { label: "About", href: "#about" },
  { label: "Expertise", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Contact", href: "#contact" },
];

const socialLinks = [
  { label: "GitHub", href: "https://github.com/zashaxx", icon: FaGithub },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/aayushkoirala8848/",
    icon: FaLinkedinIn,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/flawedaayush",
    icon: FaInstagram,
  },
];

const experiences = [
  {
    company: "Full Stack Development",
    title: "MERN Stack & Modern Web",
    range: "Active Focus",
    url: "https://github.com/zashaxx",
    duties: [
      "Building end-to-end web applications using React, Node.js, Express, and MongoDB.",
      "Developing responsive, accessible interfaces with modern CSS and JavaScript.",
      "Exploring Next.js for server-side rendering and improved performance.",
      "Integrating third-party services, payment gateways, and real-time features.",
    ],
  },
  {
    company: "Python & Web Security",
    title: "Certified Practitioner",
    range: "Certification Earned",
    url: "https://github.com/zashaxx",
    certUrl: "/python_certificate_cs.pdf",
    duties: [
      "Earned a certification in Python for Web Security, covering secure coding practices and vulnerability mitigation.",
      "Understanding common web vulnerabilities (XSS, CSRF, SQL Injection) and implementing proper defenses.",
      "Applying security best practices across the full development lifecycle.",
      "Exploring Python-based backend frameworks like FastAPI for API development.",
    ],
  },
  {
    company: "UI/UX & Frontend Craft",
    title: "Design-Minded Developer",
    range: "Ongoing",
    url: "#",
    duties: [
      "Crafting clean, intuitive user interfaces with attention to typography, spacing, and color theory.",
      "Implementing responsive designs that work seamlessly across devices and screen sizes.",
      "Focusing on performance optimization, accessibility (a11y), and smooth animations.",
      "Translating design mockups and wireframes into functional, pixel-perfect components.",
    ],
  },
];

const projects = [
  {
    title: "MERCH Nepal",
    subtitle: "Merchandise Selling Website",
    text: "A full-stack e-commerce platform built using the MERN stack. Features include seller registration, customer interaction, administrative controls, payment integration, and real-time live chat functionality.",
    href: "https://github.com/zashaxx/Merch-Nepal",
    stack: ["React", "Node.js", "Express", "MongoDB", "Socket.io", "Stripe"],
    accent: "M",
  },
  {
    title: "GoodNotes",
    subtitle: "Notes Downloading Website",
    text: "A targeted resource educational portal website designed for Pokhara University students to easily access and download necessary notes and educational materials, improving study efficiency.",
    href: "https://github.com/zashaxx/GoodNotesFinal",
    stack: ["React", "Firebase", "Responsive UI", "Content Management"],
    accent: "G",
  },
  {
    title: "Nep Tube",
    subtitle: "Nepal Video Streaming Platform",
    text: "A full-stack video streaming platform built with Next.js and tRPC, featuring Clerk authentication, AI-powered tools via Replicate, PostgreSQL with Drizzle ORM, and a dedicated video streaming server.",
    href: "https://github.com/zashaxx/neptube",
    stack: ["Next.js", "TypeScript", "PostgreSQL", "tRPC", "Clerk Auth", "AI Integration"],
    accent: "N",
  },
];

const noteworthyProjects = [
  {
    title: "Chromatiq",
    text: "An interactive colour guessing game built with Next.js where players test their colour perception by matching the correct shade. Features a clean, minimalist UI with real-time feedback.",
    github: "https://github.com/zashaxx/chromatiq",
    external: "https://chromatiq.vercel.app/",
    tech: ["Next.js", "React", "CSS3", "Vercel"],
  },
  {
    title: "Cow & Bull",
    text: "A classic code-breaking number guessing game built as a web application. Players take turns guessing each other's secret number with real-time feedback on each guess.",
    github: "https://github.com/zashaxx/cowbull",
    external: "https://cowbull-flame.vercel.app/",
    tech: ["React", "JavaScript", "CSS3", "Vercel"],
  },
  {
    title: "Todo App (FastAPI + React)",
    text: "A full-stack task management application featuring a FastAPI backend with SQLAlchemy and a React frontend. Demonstrates integration between Python-based APIs and modern JavaScript frameworks.",
    github: "https://github.com/zashaxx/working_with_api/tree/master/fast-api",
    external: "",
    tech: ["FastAPI", "React", "Python", "SQLAlchemy", "REST API"],
  },
  {
    title: "Portfolio v2 (React + Vite)",
    text: "A personal portfolio website built with React and Vite, featuring a clean design system, dark/light theme support, smooth scroll animations, and fully responsive layouts.",
    github: "https://github.com/zashaxx/protfolio-v2",
    external: "",
    tech: ["React", "Vite", "CSS3", "JavaScript"],
  },
];

const aboutSkills = [
  {
    title: "Frontend Development",
    items: [
      "HTML",
      "CSS",
      "JavaScript (ES6+)",
      "React JS",
      "Next JS",
      "SASS/SCSS",
    ],
  },
  {
    title: "Backend, Security & Tools",
    items: [
      "Node JS",
      "Express JS",
      "Python",
      "FastAPI",
      "MongoDB",
      "SQL",
      "REST APIs",
      "Git / GitHub",
      "Web Security Fundamentals",
    ],
  },
];

function App() {
  const preferredTheme = useMemo(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const savedTheme = window.localStorage.getItem("theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }

    return "light";
  }, []);

  const [theme, setTheme] = useState(preferredTheme);
  const [showNav, setShowNav] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [showHero, setShowHero] = useState(false);
  const [showFrame, setShowFrame] = useState(false);
  const [isLoaderDone, setIsLoaderDone] = useState(false);
  const [activeSection, setActiveSection] = useState("about");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTabId, setActiveTabId] = useState(0);
  const [showAllNoteworthy, setShowAllNoteworthy] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const noteworthyPrevCount = useRef(3);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    window.scrollTo(0, 0);

    return () => {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "auto";
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaderDone) {
      return undefined;
    }

    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateNavVisibility = () => {
      const currentScrollY = window.scrollY;
      const scrollingUp = currentScrollY < lastScrollY;
      const scrollingDown = currentScrollY > lastScrollY;

      setIsAtTop(currentScrollY < 50);

      if (scrollingDown) {
        setShowNav(false);
        setIsMobileMenuOpen(false);
      } else if (scrollingUp) {
        setShowNav(true);
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(updateNavVisibility);
    };

    const navTimer = window.setTimeout(() => setShowNav(true), 0);
    const heroTimer = window.setTimeout(() => setShowHero(true), 575);
    const frameTimer = window.setTimeout(() => setShowFrame(true), 1325);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(navTimer);
      window.clearTimeout(heroTimer);
      window.clearTimeout(frameTimer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [isLoaderDone]);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll("main section"));

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);

        if (visibleEntry?.target?.id) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      {
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0.2,
      },
    );

    sections.forEach((section) => observer.observe(section));

    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            obs.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.1,
      },
    );

    const revealElements = document.querySelectorAll(".reveal-group");
    revealElements.forEach((el) => revealObserver.observe(el));

    return () => {
      observer.disconnect();
      revealObserver.disconnect();
    };
  }, [isLoaderDone]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add("blur-active");
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove("blur-active");
      document.body.style.overflow = "";
    }
    return () => {
      document.body.classList.remove("blur-active");
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const toggleTheme = (event) => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const fallbackRect = event.currentTarget.getBoundingClientRect();
    const originX = event.clientX || fallbackRect.left + fallbackRect.width / 2;
    const originY = event.clientY || fallbackRect.top + fallbackRect.height / 2;

    document.documentElement.style.setProperty("--x", `${originX}px`);
    document.documentElement.style.setProperty("--y", `${originY}px`);
    document.documentElement.dataset.transitionTheme = nextTheme;

    const commitTheme = () => {
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      document.documentElement.setAttribute("data-theme", nextTheme);
      setTheme(nextTheme);
    };

    if (typeof document.startViewTransition === "function") {
      const transition = document.startViewTransition(() => {
        flushSync(commitTheme);
      });

      transition.finished.finally(() => {
        delete document.documentElement.dataset.transitionTheme;
      });
      return;
    }

    flushSync(commitTheme);
    delete document.documentElement.dataset.transitionTheme;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((currentValue) => !currentValue);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Smooth scroll handler for all links to support body scroll unlock
  const handleNavClick = (e, href) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 320);
    }
  };

  const INITIAL_NOTEWORTHY_COUNT = 3;
  const displayedNoteworthy = showAllNoteworthy
    ? noteworthyProjects
    : noteworthyProjects.slice(0, INITIAL_NOTEWORTHY_COUNT);

  const handleToggleNoteworthy = () => {
    const wasShowingAll = showAllNoteworthy;
    setShowAllNoteworthy((prev) => !prev);
    noteworthyPrevCount.current = wasShowingAll
      ? INITIAL_NOTEWORTHY_COUNT
      : noteworthyProjects.length;
  };

  return (
    <div className={`portfolio-page ${showFrame ? "is-frame-visible" : ""}`}>
      <Preloader onHidden={() => setIsLoaderDone(true)} />

      {/* Overlay for closing side drawer */}
      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen ? "is-active" : ""}`}
        onClick={closeMobileMenu}
      />

      <div className="portfolio-shell">
        <header
          className={`portfolio-nav ${showNav ? "is-visible" : ""} ${isAtTop ? "is-top-page" : "is-scrolled"} ${isMobileMenuOpen ? "is-menu-open" : ""}`}
        >
          <a
            className="brand-mark"
            href="#top"
            aria-label="Home"
            onClick={(e) => handleNavClick(e, "#top")}
          >
            <svg
              className="brand-mark__icon"
              viewBox="0 0 100 100"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="brand-mark__circle"
                cx="50"
                cy="50"
                r="36"
                stroke="currentColor"
                strokeWidth="12"
              />
              <g className="brand-mark__asterisk">
                <path
                  d="M50 12V88"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M18 30L82 70"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M18 70L82 30"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
              </g>
            </svg>
          </a>

          <div className="nav-cluster">
            <nav className="portfolio-nav__links" aria-label="Primary">
              {navItems.map((item, index) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={
                    activeSection === item.href.slice(1) ? "is-active" : ""
                  }
                  style={{ "--nav-index": index }}
                  onClick={(e) => handleNavClick(e, item.href)}
                >
                  <span>{String(index + 1).padStart(2, "0")}.</span>
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="nav-actions">
              <button
                className="theme-button"
                type="button"
                onClick={toggleTheme}
                aria-pressed={theme === "dark"}
                aria-label={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
              >
                <span className="theme-button__icon" aria-hidden="true">
                  {theme === "dark" ? (
                    <SunMedium size={22} strokeWidth={2.5} />
                  ) : (
                    <MoonStar size={22} strokeWidth={2.5} />
                  )}
                </span>
              </button>

              <button
                className={`menu-button ${isMobileMenuOpen ? "is-active" : ""}`}
                type="button"
                onClick={toggleMobileMenu}
                aria-expanded={isMobileMenuOpen}
                aria-controls="primary-navigation"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                <div className="hamburger">
                  <div className="hamburger-box">
                    <div className="hamburger-inner"></div>
                  </div>
                </div>
              </button>
            </div>
          </div>

        </header>

        {/* Drawer Sidebar Menu — outside header so position:fixed resolves to viewport */}
        <div
          className={`mobile-nav-panel ${isMobileMenuOpen ? "is-open" : ""}`}
          id="primary-navigation"
        >
          <button
            className="mobile-menu-close"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <X size={26} />
          </button>
          <nav className="mobile-nav-links" aria-label="Mobile Primary">
            {navItems.map((item, index) => (
              <a
                key={item.label}
                href={item.href}
                className={
                  activeSection === item.href.slice(1) ? "is-active" : ""
                }
                style={{ transitionDelay: `${index * 60}ms` }}
                onClick={(e) => handleNavClick(e, item.href)}
              >
                <span>{String(index + 1).padStart(2, "0")}.</span>
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <aside
          className={`side-rail side-rail--left ${showFrame ? "is-visible" : ""}`}
          aria-label="Social links"
        >
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              aria-label={link.label}
              target="_blank"
              rel="noreferrer"
            >
              <span className="side-rail__icon" aria-hidden="true">
                <link.icon size={24} />
              </span>
            </a>
          ))}
          <span className="side-rail__line" />
        </aside>

        <aside
          className={`side-rail side-rail--right ${showFrame ? "is-visible" : ""}`}
          aria-label="Contact email"
        >
          <a
            className="side-rail__email"
            href="mailto:aayushkoirala8848@gmail.com"
            aria-label="Email aayushkoirala8848@gmail.com"
          >
            aayushkoirala8848@gmail.com
          </a>
          <span className="side-rail__line" />
        </aside>

        <main className="portfolio-content" id="top">
          <section className={`hero ${showHero ? "is-visible" : ""}`} id="top">
            <p className={`hero__eyebrow ${showHero ? "is-visible" : ""}`}>
              Hi, my name is
            </p>
            <h1 className={`hero__title ${showHero ? "is-visible" : ""}`}>
              Aayush Koirala.
            </h1>
            <h2 className={`hero__subtitle ${showHero ? "is-visible" : ""}`}>
              I build clean digital experiences for the web.
            </h2>
            <p className={`hero__copy ${showHero ? "is-visible" : ""}`}>
              I specialize in designing and building responsive web applications
              with clean, intuitive interfaces. From portfolios to full-stack
              platforms, I create digital experiences that are performant,
              accessible, and visually refined.
            </p>

            <div className="hero__actions">
              <a
                className="button"
                href="#projects"
                onClick={(e) => handleNavClick(e, "#projects")}
              >
                View Projects
              </a>
              <a
                className="button hero__contact-link"
                href="#contact"
                onClick={(e) => handleNavClick(e, "#contact")}
              >
                Contact Me
              </a>
              <a
                className="button hero__contact-link"
                href="/Aayush-Koirala_Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download size={18} style={{ marginRight: 8 }} />
                Resume
              </a>
            </div>
          </section>

          <section
            className="about-section reveal-group reveal-group--about"
            id="about"
          >
            <div className="section-heading section-heading--about">
              <span>01.</span>
              <h3>About Me</h3>
              <span className="section-heading__line" aria-hidden="true" />
            </div>

            <div className="about-layout">
              <div className="about-copy">
                <article className="about-card about-card--bio">
                  <p>
                    I&apos;m <strong>Aayush Koirala</strong>, a Computer
                    Engineering student at{" "}
                    <strong>Nepal Engineering College</strong> with a strong
                    focus on full-stack web development. I build scalable,
                    user-centric applications using modern JavaScript ecosystems
                    and continuously expand my expertise across the stack.
                  </p>
                  <p>
                    My primary toolkit includes <strong>React</strong> for
                    crafting dynamic frontends and{" "}
                    <strong>Node.js/Express</strong> for building robust backend
                    services. I work with both <strong>MongoDB</strong> and{" "}
                    <strong>SQL</strong> databases to design efficient data
                    architectures, and I hold a certification in{" "}
                    <a className="cert-link" href="/python_certificate_cs.pdf" target="_blank" rel="noreferrer">
                      Python for Web Security
                    </a>, reflecting my
                    commitment to writing secure, resilient code.
                  </p>
                  <p>
                    Beyond development, I enjoy exploring UI/UX design
                    principles and staying current with emerging web
                    technologies. Away from the keyboard, you&apos;ll likely
                    find me with a book, a film, or a controller in hand.
                  </p>
                </article>

                <div className="about-skills">
                  {aboutSkills.map((group) => (
                    <article
                      className="about-card about-card--skills"
                      key={group.title}
                    >
                      <h4>{group.title}</h4>
                      <ul className="skills-list">
                        {group.items.map((skill) => (
                          <li key={skill}>{skill}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>

              <div
                className="portrait-swap"
                aria-label="Portrait of Aayush Koirala"
              >
                <div className="portrait-swap__frame">
                  <img
                    className="portrait-swap__image portrait-swap__image--bw"
                    src="/black_and_white.png"
                    alt="Aayush Koirala black and white portrait"
                  />
                  <img
                    className="portrait-swap__image portrait-swap__image--color"
                    src="/colour.png"
                    alt="Aayush Koirala color portrait"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="experience-section reveal-group" id="experience">
            <div className="section-heading section-heading--experience">
              <span>02.</span>
              <h3>What I'm Working On</h3>
              <span className="section-heading__line" aria-hidden="true" />
            </div>

            <div className="experience-layout">
              <div
                className="tab-list"
                role="tablist"
                aria-label="Job tabs"
                style={{ "--active-index": activeTabId }}
              >
                {experiences.map((exp, index) => (
                  <button
                    key={exp.company}
                    className={`tab-button ${activeTabId === index ? "is-active" : ""}`}
                    onClick={() => setActiveTabId(index)}
                    role="tab"
                    aria-selected={activeTabId === index}
                    aria-controls={`panel-${index}`}
                    id={`tab-${index}`}
                  >
                    <span>{exp.company}</span>
                  </button>
                ))}
                <div className="tab-highlight" />
              </div>

              <div className="tab-panels">
                {experiences.map((exp, index) => (
                  <div
                    key={exp.company}
                    className={`tab-panel ${activeTabId === index ? "is-active" : ""}`}
                    role="tabpanel"
                    id={`panel-${index}`}
                    aria-labelledby={`tab-${index}`}
                    hidden={activeTabId !== index}
                  >
                    <h4>
                      <span className="job-title">{exp.title}</span>
                      <span className="job-company">
                        &nbsp;@&nbsp;
                        <a
                          href={exp.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-link"
                        >
                          {exp.company}
                        </a>
                      </span>
                    </h4>
                    <p className="job-range">
                      {exp.range}
                      {exp.certUrl && (
                        <a
                          className="cert-badge"
                          href={exp.certUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="View certificate"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      )}
                    </p>
                    <ul className="job-duties">
                      {exp.duties.map((duty, i) => (
                        <li key={i}>{duty}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="projects-section reveal-group" id="projects">
            <div className="section-heading section-heading--projects">
              <span>03.</span>
              <h3>Some Things I've Built</h3>
              <span className="section-heading__line" aria-hidden="true" />
            </div>

            <div className="projects-stack">
              {projects.map((project, index) => (
                <article
                  className={`project-showcase ${index % 2 === 1 ? "project-showcase--reverse" : ""}`}
                  key={project.title}
                >
                  <div className="project-showcase__media">
                    <a
                      className="project-image-link"
                      href={project.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${project.title} on GitHub`}
                      title={`Open ${project.title} on GitHub`}
                    >
                      <div className="project-image-card" aria-hidden="true">
                        <div className="project-image-card__tint" />
                        <div className="project-image-card__visual">
                          <span>{project.accent}</span>
                          <small>{project.title}</small>
                        </div>
                      </div>
                    </a>
                  </div>

                  <div className="project-showcase__details">
                    <div className="project-title-row">
                      <h4>{project.title}</h4>
                      <a
                        className="project-title-link"
                        href={project.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${project.title} on GitHub`}
                        title={`Open ${project.title} on GitHub`}
                      >
                        <FaGithub size={20} aria-hidden="true" />
                      </a>
                    </div>

                    <div className="project-description-card">
                      <p>{project.text}</p>
                    </div>

                    <div className="project-stack">
                      {project.stack.map((tech) => (
                        <TechIcon key={tech} name={tech} size={18} />
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* New Noteworthy Projects Section */}
          <section className="noteworthy-section reveal-group reveal-group--noteworthy" id="noteworthy">
            <div className="section-heading section-heading--projects noteworthy-heading">
              <span>04.</span>
              <h3>Other Noteworthy Projects</h3>
              <span className="section-heading__line" aria-hidden="true" />
            </div>

            <div className="noteworthy-grid">
              {displayedNoteworthy.map((proj, i) => {
                const isRevealed = showAllNoteworthy && i >= INITIAL_NOTEWORTHY_COUNT;
                const staggerIndex = isRevealed ? i - INITIAL_NOTEWORTHY_COUNT : 0;
                return (
                  <article
                    className={`noteworthy-card ${isRevealed ? "noteworthy-card--reveal" : ""}`}
                    key={proj.title}
                    style={
                      isRevealed
                        ? { animationDelay: `${staggerIndex * 100}ms` }
                        : undefined
                    }
                  >
                    <div className="card-top">
                      <Folder className="folder-icon" size={36} />
                      <div className="card-links">
                        <a
                          href={proj.github}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="GitHub"
                        >
                          <FaGithub size={20} />
                        </a>
                        {proj.external && proj.external !== "#" && (
                          <a
                            href={proj.external}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="External Link"
                          >
                            <ExternalLink size={20} />
                          </a>
                        )}
                      </div>
                    </div>

                    <h4 className="card-title">{proj.title}</h4>

                    <p className="card-description">{proj.text}</p>

                    <ul className="card-tech">
                      {proj.tech.map((t) => (
                        <li key={t}><TechIcon name={t} size={14} /></li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>

            <button
              className="button noteworthy-toggle-btn"
              onClick={handleToggleNoteworthy}
            >
              Show {showAllNoteworthy ? "Less" : "More"}
              <ChevronDown
                size={18}
                style={{
                  marginLeft: 6,
                  transform: showAllNoteworthy ? "rotate(180deg)" : "none",
                  transition: "transform 0.25s ease",
                }}
              />
            </button>
          </section>

          <section className="contact-section reveal-group" id="contact">
            <div className="section-heading">
              <span>04.</span>
              <h3>Get In Touch</h3>
              <span className="section-heading__line" aria-hidden="true" />
            </div>

            <p
              className="contact-copy"
              style={{
                textAlign: "center",
                maxWidth: "600px",
                margin: "0 auto",
                fontSize: "1.1rem",
              }}
            >
              I am currently looking for new opportunities and my inbox is
              always open. Whether you have a question or just want to say hi,
              I’ll try my best to get back to you!
            </p>

            <button
              className="button"
              onClick={() => setIsContactOpen(true)}
              style={{ margin: "30px auto 0", display: "inline-flex", cursor: "pointer" }}
            >
              Say Hello
            </button>
          </section>
        </main>
      </div>

      {isContactOpen && (
        <div className="contact-overlay" onClick={() => setIsContactOpen(false)}>
          <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="contact-modal__close"
              onClick={() => setIsContactOpen(false)}
              aria-label="Close"
            >
              <X size={22} />
            </button>
            <h3>Get in Touch</h3>
            <div className="contact-modal__options">
              <a
                className="contact-modal__option"
                href="https://wa.me/9779804014936"
                target="_blank"
                rel="noreferrer"
              >
                <FaWhatsapp size={28} />
                <span>WhatsApp</span>
              </a>
              <a
                className="contact-modal__option"
                href="mailto:aayushkoirala8848@gmail.com"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4L12 13 2 4" />
                </svg>
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
