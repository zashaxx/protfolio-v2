import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Braces,
  Code2,
  FolderKanban,
  Layers3,
  Mail,
  Menu,
  Monitor,
  Moon,
  Play,
  Rocket,
  ShoppingBag,
  Smartphone,
  Sun,
  UserRound,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
} from "react-icons/fa6";
import { SiClaude, SiGooglegemini, SiOpenai } from "react-icons/si";
import BuildStack, { StackDetailPage } from "./components/BuildStack";
import GitHubContributions from "./components/GitHubContributions";
import PointerEffects from "./components/PointerEffects";
import "./App.css";

const navItems = [
  { label: "Profile", href: "#about", icon: UserRound },
  { label: "Expertise", href: "#expertise", icon: Braces },
  { label: "Stack", href: "#stack", icon: Layers3 },
  { label: "Work", href: "#projects", icon: FolderKanban },
  { label: "Activity", href: "#github", icon: FaGithub },
  { label: "Contact", href: "#contact", icon: Mail },
];

const socialLinks = [
  {
    label: "GitHub",
    href: "https://github.com/zashaxx",
    icon: FaGithub,
  },
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
  {
    label: "WhatsApp",
    href: "https://wa.me/9779804014936",
    icon: FaWhatsapp,
  },
];

const sidebarSocialLinks = socialLinks.slice(0, 2);

const expertise = [
  {
    number: "01",
    eyebrow: "Frontend",
    title: "React interfaces",
    status: "Current stack",
    duties: [
      "Build responsive interfaces with React, Next.js, JavaScript, and CSS.",
      "Work from desktop layouts down to small mobile screens.",
      "Keep components accessible and straightforward to maintain.",
    ],
  },
  {
    number: "02",
    eyebrow: "Backend",
    title: "APIs and data",
    status: "Current stack",
    duties: [
      "Build APIs with Node.js, Express, FastAPI, and SQLAlchemy.",
      "Use MongoDB and PostgreSQL for application data.",
      "Integrate authentication, payments, and real-time features.",
    ],
  },
  {
    number: "03",
    eyebrow: "Security",
    title: "Web security fundamentals",
    status: "Certified",
    certificate: "/python_certificate_cs.pdf",
    duties: [
      "Completed a Python for Web Security certification.",
      "Study common issues including XSS, CSRF, and SQL injection.",
      "Apply input validation and secure defaults in project work.",
    ],
  },
];

const projects = [
  {
    title: "MERCH Nepal",
    subtitle: "Full-stack commerce platform",
    description:
      "A MERN e-commerce system with seller onboarding, administrative controls, Stripe payments, and real-time support chat.",
    stack: ["React", "Node.js", "MongoDB", "Socket.io", "Stripe"],
    href: "https://github.com/zashaxx/Merch-Nepal",
    icon: ShoppingBag,
  },
  {
    title: "GoodNotes",
    subtitle: "University resource library",
    description:
      "A focused education portal that helps Pokhara University students find and download the notes they need without friction.",
    stack: ["React", "Firebase", "Node.js", "Responsive UI"],
    href: "https://github.com/zashaxx/GoodNotesFinal",
    icon: BookOpen,
  },
  {
    title: "Nep Tube",
    subtitle: "Nepal video platform",
    description:
      "A full-stack streaming product with Clerk authentication, AI-assisted tools, PostgreSQL, tRPC, and dedicated video delivery.",
    stack: ["Next.js", "TypeScript", "PostgreSQL", "tRPC", "AI"],
    href: "https://github.com/zashaxx/neptube",
    icon: Play,
  },
];

const otherProjects = [
  {
    title: "Chromatiq",
    type: "Colour game",
    description:
      "A compact colour-perception game with immediate feedback and a deliberately simple interface.",
    tech: ["Next.js", "React", "Vercel"],
    source: "https://github.com/zashaxx/chromatiq",
    live: "https://chromatiq.vercel.app/",
  },
  {
    title: "Cow & Bull",
    type: "Logic game",
    description:
      "A browser-based take on the classic code-breaking game, built around quick rounds and clear feedback.",
    tech: ["React", "JavaScript", "CSS"],
    source: "https://github.com/zashaxx/cowbull",
    live: "https://cowbull-flame.vercel.app/",
  },
  {
    title: "Todo API",
    type: "Full-stack utility",
    description:
      "Task management with a FastAPI backend, SQLAlchemy persistence, and a React client.",
    tech: ["FastAPI", "React", "SQLAlchemy"],
    source: "https://github.com/zashaxx/working_with_api/tree/master/fast-api",
  },
  {
    title: "Portfolio",
    type: "Personal website",
    description:
      "My portfolio built with React, Vite, responsive CSS, and light and dark themes.",
    tech: ["React", "Vite", "CSS"],
    source: "https://github.com/zashaxx",
    live: "https://aayush-koirala.com.np",
  },
];

const themeOptions = [
  { value: "system", label: "Device", icon: Monitor },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
];

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "system";
  }

  const savedTheme = window.localStorage.getItem("theme");
  return ["light", "dark", "system"].includes(savedTheme)
    ? savedTheme
    : "system";
}

function ThemePicker({ value, onChange, compact = false }) {
  return (
    <div
      className={`theme-picker ${compact ? "theme-picker--compact" : ""}`}
      aria-label="Choose appearance"
      role="group"
    >
      {themeOptions.map((option) => {
        const Icon = option.icon;

        return (
          <button
            className={value === option.value ? "is-active" : ""}
            key={option.value}
            type="button"
            onClick={(event) => onChange(option.value, event)}
            aria-pressed={value === option.value}
            title={`${option.label} theme`}
          >
            <Icon size={13} strokeWidth={1.7} aria-hidden="true" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SectionHeading({ number, label, title, description }) {
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

function ProjectFeatureCard({ project }) {
  const ProjectIcon = project.icon;

  return (
    <article className="featured-project-card">
      <div className="featured-project-card__heading">
        <span className="project-card__icon" aria-hidden="true">
          <ProjectIcon size={24} strokeWidth={1.45} />
        </span>
        <div>
          <ul
            className="project-card__chips"
            aria-label={`${project.title} technologies`}
          >
            {project.stack.slice(0, 3).map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>
          <h3>{project.title}</h3>
        </div>
      </div>
      <p className="featured-project-card__type">{project.subtitle}</p>
      <p className="project-card__description">{project.description}</p>
      <a
        className="project-card__source"
        href={project.href}
        target="_blank"
        rel="noreferrer"
      >
        <FaGithub size={16} aria-hidden="true" />
        View source
        <ArrowUpRight size={15} strokeWidth={1.6} aria-hidden="true" />
      </a>
    </article>
  );
}

function ProjectDeckCard({ project, slot, onActivate }) {
  const ProjectIcon = project.icon;
  const activate = () => onActivate();

  return (
    <article
      className={`deck-card project-deck-card is-${slot}`}
      role="button"
      tabIndex={0}
      aria-label={`Show ${project.title}`}
      onClick={activate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      }}
    >
      <ul
        className="project-card__chips"
        aria-label={`${project.title} technologies`}
      >
        {project.stack.slice(0, 3).map((technology) => (
          <li key={technology}>{technology}</li>
        ))}
      </ul>
      <div className="project-card__heading">
        <span className="project-card__icon" aria-hidden="true">
          <ProjectIcon size={22} strokeWidth={1.45} />
        </span>
        <div>
          <p>{project.subtitle}</p>
          <h3>{project.title}</h3>
        </div>
      </div>
      <p className="project-card__description">{project.description}</p>
      <a
        className="project-card__source"
        href={project.href}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
      >
        <FaGithub size={15} aria-hidden="true" />
        View source
        <ArrowUpRight size={14} strokeWidth={1.6} aria-hidden="true" />
      </a>
    </article>
  );
}

function ProjectRows({ className = "", id }) {
  return (
    <div className={`other-projects ${className}`.trim()} id={id} data-reveal>
      {otherProjects.map((project) => (
        <article className="project-row" key={project.title}>
          <h3>
            <a
              href={project.live ?? project.source}
              target="_blank"
              rel="noreferrer"
            >
              {project.title}
            </a>
          </h3>
          <div className="project-row__details">
            <p className="project-row__type">{project.type}</p>
            <p>{project.description}</p>
          </div>
          <div className="project-row__links">
            <a
              href={project.source}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.title} source code`}
            >
              <FaGithub size={14} aria-hidden="true" />
            </a>
            {project.live && (
              <a
                href={project.live}
                target="_blank"
                rel="noreferrer"
                aria-label={`${project.title} live site`}
              >
                <ArrowUpRight size={15} strokeWidth={1.6} aria-hidden="true" />
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function ProjectsDetailPage({ onBack }) {
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
      <div className="featured-projects detail-featured-projects" data-reveal>
        {projects.map((project) => (
          <ProjectFeatureCard project={project} key={project.title} />
        ))}
      </div>
      <ProjectRows className="detail-project-rows" />
    </section>
  );
}

function getInitialView() {
  if (typeof window === "undefined") {
    return "home";
  }

  const view = new URLSearchParams(window.location.search).get("view");
  return view === "projects" || view === "stack" ? view : "home";
}

function runInstantScroll(scroll) {
  const root = document.documentElement;
  const previousBehavior = root.style.getPropertyValue("scroll-behavior");
  const previousPriority = root.style.getPropertyPriority("scroll-behavior");
  root.style.setProperty("scroll-behavior", "auto", "important");
  scroll();
  window.requestAnimationFrame(() => {
    scroll();
    if (previousBehavior) {
      root.style.setProperty(
        "scroll-behavior",
        previousBehavior,
        previousPriority,
      );
    } else {
      root.style.removeProperty("scroll-behavior");
    }
  });
}

function jumpToTop() {
  runInstantScroll(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  });
}

function jumpToSection(target) {
  runInstantScroll(() => {
    target.scrollIntoView({ behavior: "auto", block: "start" });
  });
}

function App() {
  const [themePreference, setThemePreference] = useState(getInitialTheme);
  const [systemDark, setSystemDark] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const [activeSection, setActiveSection] = useState("about");
  const [pageView, setPageView] = useState(getInitialView);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [deckSlots, setDeckSlots] = useState(["center", "left", "right"]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const savedSoundPreference = window.localStorage.getItem(
      "site-sounds-enabled",
    );
    return savedSoundPreference === null || savedSoundPreference === "on";
  });
  const mobileMenuRef = useRef(null);
  const previousFocusRef = useRef(null);
  const themeTimerRef = useRef(null);

  const effectiveTheme =
    themePreference === "system"
      ? systemDark
        ? "dark"
        : "light"
      : themePreference;

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => {
      if (
        themePreference === "system" &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        const root = document.documentElement;
        root.classList.add("theme-anim");
        window.clearTimeout(themeTimerRef.current);
        themeTimerRef.current = window.setTimeout(
          () => root.classList.remove("theme-anim"),
          520,
        );
      }

      setSystemDark(event.matches);
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [themePreference]);

  useEffect(() => {
    document.documentElement.dataset.theme = effectiveTheme;
    document.documentElement.classList.toggle("dark", effectiveTheme === "dark");
    window.localStorage.setItem("theme", themePreference);

    const favicon = document.querySelector("link[rel='icon']");
    if (favicon) {
      favicon.href =
        effectiveTheme === "dark" ? "/favicon-light.svg" : "/favicon.svg";
    }
  }, [effectiveTheme, themePreference]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      document.documentElement.dataset.themeReady = "";
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const nextView = getInitialView();
      setPageView(nextView);

      window.requestAnimationFrame(() => {
        if (nextView === "home" && window.location.hash) {
          document.querySelector(window.location.hash)?.scrollIntoView();
          return;
        }
        jumpToTop();
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (pageView !== "home") {
      return undefined;
    }

    let frameId = 0;

    const updateActiveSection = () => {
      frameId = 0;
      const marker =
        window.scrollY + Math.min(120, window.innerHeight * 0.15);
      let currentSection = navItems[0].href.slice(1);

      navItems.forEach((item) => {
        const section = document.querySelector(item.href);
        const sectionTop = section
          ? section.getBoundingClientRect().top + window.scrollY
          : Number.POSITIVE_INFINITY;
        if (sectionTop <= marker) {
          currentSection = section.id;
        }
      });

      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4
      ) {
        currentSection = navItems.at(-1).href.slice(1);
      }

      setActiveSection(currentSection);
    };

    const requestUpdate = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(updateActiveSection);
      }
    };

    updateActiveSection();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [pageView]);

  useEffect(() => {
    const revealItems = document.querySelectorAll("[data-reveal]");
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return undefined;
    }

    const groupCounts = new Map();
    revealItems.forEach((item) => {
      const group = item.closest("[data-section], .detail-page, .site-footer");
      const count = groupCounts.get(group) ?? 0;
      item.style.setProperty("--reveal-delay", `${Math.min(count, 4) * 80}ms`);
      groupCounts.set(group, count + 1);
    });

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            currentObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0 },
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [pageView, showAllProjects]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const panel = mobileMenuRef.current;
    previousFocusRef.current = document.activeElement;
    document.body.style.overflow = "hidden";

    const focusable = panel?.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }

      if (event.key !== "Tab" || !focusable?.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [menuOpen]);

  useEffect(() => {
    window.localStorage.setItem(
      "site-sounds-enabled",
      soundEnabled ? "on" : "off",
    );
  }, [soundEnabled]);

  useEffect(
    () => () => {
      window.clearTimeout(themeTimerRef.current);
    },
    [],
  );

  const changeTheme = (nextPreference, event) => {
    if (nextPreference === themePreference) {
      return;
    }

    const nextEffectiveTheme =
      nextPreference === "system"
        ? systemDark
          ? "dark"
          : "light"
        : nextPreference;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const root = document.documentElement;

    if (
      reduceMotion ||
      typeof document.startViewTransition !== "function" ||
      nextEffectiveTheme === effectiveTheme
    ) {
      root.classList.add("theme-anim");
      setThemePreference(nextPreference);
      window.clearTimeout(themeTimerRef.current);
      themeTimerRef.current = window.setTimeout(
        () => root.classList.remove("theme-anim"),
        520,
      );
      return;
    }

    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    root.classList.add("theme-view-transition");
    const transition = document.startViewTransition(() => {
      flushSync(() => setThemePreference(nextPreference));
      root.dataset.theme = nextEffectiveTheme;
      root.classList.toggle("dark", nextEffectiveTheme === "dark");
    });

    transition.ready
      .then(() => {
        root.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 540,
            easing: "cubic-bezier(.32,.08,.24,1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {});

    void transition.finished
      .catch(() => {})
      .finally(() => root.classList.remove("theme-view-transition"));
  };

  const cycleTheme = (event) => {
    const currentIndex = themeOptions.findIndex(
      (option) => option.value === themePreference,
    );
    const nextIndex = (currentIndex + 1) % themeOptions.length;
    changeTheme(themeOptions[nextIndex].value, event);
  };

  const openDetailPage = (view, event) => {
    event?.preventDefault();
    setMenuOpen(false);
    document.body.style.overflow = "";
    window.history.pushState(null, "", `/?view=${view}`);
    flushSync(() => setPageView(view));
    jumpToTop();
  };

  const activateDeckCard = (projectIndex) => {
    setDeckSlots((currentSlots) => {
      const currentCenter = currentSlots.indexOf("center");
      if (currentCenter === projectIndex) {
        return currentSlots;
      }

      const nextSlots = [...currentSlots];
      nextSlots[currentCenter] = currentSlots[projectIndex];
      nextSlots[projectIndex] = "center";
      return nextSlots;
    });
  };

  const handleNavClick = (event, href) => {
    event.preventDefault();
    setMenuOpen(false);
    document.body.style.overflow = "";

    if (pageView !== "home") {
      window.history.pushState(null, "", `/${href}`);
      flushSync(() => setPageView("home"));
    }

    const target = document.querySelector(href);
    if (!target) {
      return;
    }

    setActiveSection(href === "#home" ? "about" : href.slice(1));

    if (pageView === "home" && window.location.hash !== href) {
      window.history.pushState(null, "", href);
    }

    jumpToSection(target);
  };

  const QuickThemeIcon =
    themeOptions.find((option) => option.value === themePreference)?.icon ??
    Monitor;

  const currentNavSection =
    pageView === "projects"
      ? "projects"
      : pageView === "stack"
        ? "stack"
        : activeSection;

  return (
    <div className="portfolio-page">
      <PointerEffects soundEnabled={soundEnabled} />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <div className="page-texture" aria-hidden="true">
        <span className="halftone page-texture__top" />
        <span className="halftone page-texture__bottom" />
      </div>

      <aside className="desktop-sidebar">
        <a
          className="brand"
          href={pageView === "home" ? "#home" : "/"}
          aria-label="Aayush Koirala, home"
          onClick={(event) => handleNavClick(event, "#home")}
        >
          <span className="brand__name">Aayush Koirala</span>
        </a>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const section = item.href.slice(1);
            const isActive = currentNavSection === section;
            const NavIcon = item.icon;

            return (
              <a
                href={pageView === "home" ? item.href : `/${item.href}`}
                key={item.href}
                className={isActive ? "is-active" : ""}
                aria-current={isActive ? "location" : undefined}
                onClick={(event) => handleNavClick(event, item.href)}
              >
                <span className="sidebar-nav__arrow" aria-hidden="true">
                  &rarr;
                </span>
                <NavIcon
                  className="sidebar-nav__icon"
                  size={14}
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
                <span className="sidebar-nav__label">{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-socials" aria-label="Social links">
            {sidebarSocialLinks.map((link) => (
              <a
                href={link.href}
                key={link.label}
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
              >
                <link.icon size={15} strokeWidth={1.6} aria-hidden="true" />
              </a>
            ))}
          </div>
          <div className="sidebar-controls">
            <ThemePicker
              value={themePreference}
              onChange={changeTheme}
              compact
            />
            <button
              className="sound-toggle"
              type="button"
              onClick={() => setSoundEnabled((current) => !current)}
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? "Disable interface sounds" : "Enable interface sounds"}
              title={soundEnabled ? "Sounds on" : "Sounds off"}
            >
              {soundEnabled ? (
                <Volume2 size={16} strokeWidth={1.7} aria-hidden="true" />
              ) : (
                <VolumeX size={16} strokeWidth={1.7} aria-hidden="true" />
              )}
            </button>
          </div>
          <p className="sidebar-bottom__copy">
            For work, collaborations, or anything else, reach me at
          </p>
          <a
            className="sidebar-bottom__email"
            href="mailto:aayushkoirala8848@gmail.com"
          >
            <Mail size={13} strokeWidth={1.6} aria-hidden="true" />
            Email me
          </a>
        </div>
      </aside>

      <header className="mobile-header">
        <a
          className="mobile-brand"
          href={pageView === "home" ? "#home" : "/"}
          aria-label="Aayush Koirala, home"
          onClick={(event) => handleNavClick(event, "#home")}
        >
          Aayush Koirala
        </a>
        <div className="mobile-header__actions">
          <button
            type="button"
            className="icon-button"
            onClick={cycleTheme}
            aria-label={`Current theme: ${themePreference}. Change theme`}
          >
            <QuickThemeIcon size={17} strokeWidth={1.7} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Open navigation"
          >
            <Menu size={19} strokeWidth={1.7} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div
        className={`mobile-menu ${menuOpen ? "is-open" : ""}`}
        id="mobile-menu"
        ref={mobileMenuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!menuOpen}
      >
        <div className="mobile-menu__top">
          <span>Navigation / Index</span>
          <button
            className="icon-button"
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X size={19} strokeWidth={1.7} aria-hidden="true" />
          </button>
        </div>
        <nav className="mobile-menu__nav" aria-label="Mobile navigation">
          {navItems.map((item, index) => {
            const isActive = currentNavSection === item.href.slice(1);
            const NavIcon = item.icon;

            return (
              <a
                href={pageView === "home" ? item.href : `/${item.href}`}
                key={item.href}
                className={isActive ? "is-active" : ""}
                aria-current={isActive ? "location" : undefined}
                onClick={(event) => handleNavClick(event, item.href)}
                style={{ "--menu-index": index }}
              >
                <NavIcon
                  className="mobile-menu__icon"
                  size={17}
                  strokeWidth={1.55}
                  aria-hidden="true"
                />
                <span className="mobile-menu__label">{item.label}</span>
                <ArrowDown
                  className="mobile-menu__arrow"
                  size={18}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </a>
            );
          })}
        </nav>
        <div className="mobile-menu__bottom">
          <p>Appearance</p>
          <div className="mobile-menu__controls">
            <ThemePicker
              value={themePreference}
              onChange={changeTheme}
            />
            <button
              className="sound-toggle"
              type="button"
              onClick={() => setSoundEnabled((current) => !current)}
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? "Disable interface sounds" : "Enable interface sounds"}
            >
              {soundEnabled ? (
                <Volume2 size={16} strokeWidth={1.7} aria-hidden="true" />
              ) : (
                <VolumeX size={16} strokeWidth={1.7} aria-hidden="true" />
              )}
            </button>
          </div>
          <div className="mobile-menu__socials">
            {socialLinks.map((link) => (
              <a
                href={link.href}
                key={link.label}
                target="_blank"
                rel="noreferrer"
              >
                {link.label}
                <ArrowUpRight size={12} strokeWidth={1.6} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <main id="main-content">
        {pageView === "projects" ? (
          <ProjectsDetailPage
            onBack={(event) => handleNavClick(event, "#projects")}
          />
        ) : pageView === "stack" ? (
          <StackDetailPage onBack={(event) => handleNavClick(event, "#stack")} />
        ) : (
          <>
        <section className="hero content-wrap" id="home" data-section>
          <div className="hero-profile">
            <figure className="hero-portrait hero-entrance">
              <span className="hero-portrait__media">
                <img
                  src="/black_and_white.png"
                  alt="Aayush Koirala"
                  className="hero-portrait__image hero-portrait__image--bw"
                />
                <img
                  src="/colour.png"
                  alt=""
                  aria-hidden="true"
                  className="hero-portrait__image hero-portrait__image--color"
                />
              </span>
            </figure>

            <div className="hero-summary">
              <h1 className="hero-entrance">Aayush Koirala</h1>
              <p className="hero-entrance intro-copy">
                I&apos;m a{" "}
                <span className="intro-tag">
                  <Code2 aria-hidden="true" />
                  full-stack
                </span>{" "}
                engineer currently focused on{" "}
                <span className="intro-tag">
                  <Braces aria-hidden="true" />
                  backend systems
                </span>{" "}
                and{" "}
                <span className="intro-ai">
                  <span className="intro-logos" aria-hidden="true">
                    <span className="intro-logo">
                      <SiGooglegemini />
                    </span>
                    <span className="intro-logo">
                      <SiOpenai />
                    </span>
                    <span className="intro-logo">
                      <SiClaude />
                    </span>
                  </span>
                  generative AI
                </span>. I build reliable{" "}
                <span className="intro-tag">
                  <Monitor aria-hidden="true" />
                  web
                </span>{" "}
                &amp;{" "}
                <span className="intro-tag">
                  <Smartphone aria-hidden="true" />
                  mobile apps
                </span>{" "}
                for real-world use.
              </p>
              <p className="hero-entrance intro-copy">
                I&apos;m seeking an internship and opportunities to contribute to
                ambitious{" "}
                <span className="intro-tag">
                  <Rocket aria-hidden="true" />
                  startup teams
                </span>, turn early ideas into dependable software, and grow through
                meaningful production work.
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

        <BuildStack onViewAll={openDetailPage} />

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
                onClick={(event) => openDetailPage("projects", event)}
              >
                all projects &rarr;
              </a>
            </div>
            <div className="project-deck" data-reveal>
              {projects.map((project, index) => (
                <ProjectDeckCard
                  project={project}
                  slot={deckSlots[index]}
                  onActivate={() => activateDeckCard(index)}
                  key={project.title}
                />
              ))}
            </div>
          </div>

          <div className="projects-mobile-layout">
            <SectionHeading
              number="04"
              label="selected work"
              title="Projects"
              description="Selected applications and platforms I have built."
            />

            <div className="featured-projects" data-reveal>
              {projects.map((project) => (
                <ProjectFeatureCard project={project} key={project.title} />
              ))}
            </div>

            <button
              className="view-all-projects"
              type="button"
              onClick={() => setShowAllProjects((current) => !current)}
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
              <ProjectRows className="is-open" id="more-projects" />
            )}
          </div>
        </section>

        <GitHubContributions />

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
            <a className="contact-card__email" href="mailto:aayushkoirala8848@gmail.com">
              <Mail size={16} strokeWidth={1.7} aria-hidden="true" />
              aayushkoirala8848@gmail.com
              <ArrowUpRight size={16} strokeWidth={1.7} aria-hidden="true" />
            </a>
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

          </>
        )}

        <footer className="site-footer content-wrap">
          <p>&copy; 2026 Aayush Koirala</p>
          <a
            href={pageView === "home" ? "#home" : "/"}
            onClick={(event) => handleNavClick(event, "#home")}
          >
            {pageView === "home" ? "Back to top" : "Back home"}
            <ArrowUpRight size={12} strokeWidth={1.6} aria-hidden="true" />
          </a>
        </footer>
      </main>
    </div>
  );
}

export default App;
