import { flushSync } from 'react-dom'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Menu, MoonStar, SunMedium, X } from 'lucide-react'
import { FaGithub, FaInstagram, FaLinkedinIn } from 'react-icons/fa6'
import Preloader from './components/Preloader'
import './App.css'

const navItems = [
  { label: 'About', href: '#about' },
  { label: 'Work', href: '#work' },
  { label: 'Contact', href: '#contact' },
]

const socialLinks = [
  { label: 'GitHub', href: 'https://github.com/zashaxx', icon: FaGithub },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/aayushkoirala8848/', icon: FaLinkedinIn },
  { label: 'Instagram', href: 'https://www.instagram.com/flawedaayush', icon: FaInstagram },
]

const featuredWork = [
  {
    title: 'Brand systems that stay consistent',
    text: 'Design and build polished interfaces with a focus on clarity, motion, and reliable component structure.',
  },
  {
    title: 'Fast frontends with clean interactions',
    text: 'Create landing pages and portfolio sites that feel lightweight, responsive, and easy to extend.',
  },
  {
    title: 'Dark mode done properly',
    text: 'Offer a readable white default theme and a strong dark mode without losing contrast or hierarchy.',
  },
]

const projects = [
  {
    title: 'MERCH Nepal',
    subtitle: 'Merchandise Selling Website',
    text: 'A full-stack e-commerce platform built using the MERN stack. Features include seller registration, customer interaction, administrative controls, payment integration, and real-time live chat functionality.',
    href: 'https://github.com/zashaxx/Merch-Nepal',
    stack: ['React', 'Node.js', 'Express', 'MongoDB', 'Socket.io', 'Stripe'],
    accent: 'M',
  },
  {
    title: 'GoodNotes',
    subtitle: 'Notes Downloading Website',
    text: "A targeted resource educational portal website designed for Pokhara University students to easily access and download necessary notes and educational materials, improving study efficiency.",
    href: 'https://github.com/zashaxx/GoodNotesFinal',
    stack: ['React', 'Firebase', 'Responsive UI', 'Content Management'],
    accent: 'G',
  },
  {
    title: 'Nep Tube',
    subtitle: 'Nepal Video Streaming Website',
    text: "A Nepal-based video streaming application. This project is currently in the development phase, focusing on content delivery optimization and user interface design. (In Progress)",
    href: '#',
    stack: ['React', 'Video Delivery', 'UI Design', 'In Progress'],
    accent: 'N',
  },
]

const aboutSkills = [
  {
    title: 'Frontend Development (React Focus)',
    items: ['HTML', 'CSS', 'JavaScript (ES6+)', 'React JS', 'SASS/SCSS'],
  },
  {
    title: 'Backend & Database (MERN + SQL)',
    items: ['Node JS', 'Express JS', 'MongoDB', 'SQL (Relational DBs)', 'Git / GitHub', 'REST APIs'],
  },
]

function App() {
  const preferredTheme = useMemo(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    const savedTheme = window.localStorage.getItem('theme')

    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }, [])

  const [theme, setTheme] = useState(preferredTheme)
  const [showNav, setShowNav] = useState(false)
  const [isAtTop, setIsAtTop] = useState(true)
  const [showHero, setShowHero] = useState(false)
  const [showCta, setShowCta] = useState(false)
  const [showFrame, setShowFrame] = useState(false)
  const [isLoaderDone, setIsLoaderDone] = useState(false)
  const [activeSection, setActiveSection] = useState('about')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    window.scrollTo(0, 0)

    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto'
      }
    }
  }, [])

  useEffect(() => {
    if (!isLoaderDone) {
      return undefined
    }

    let lastScrollY = window.scrollY
    let ticking = false

    const updateNavVisibility = () => {
      const currentScrollY = window.scrollY
      const atTop = currentScrollY <= 24
      const scrollingUp = currentScrollY < lastScrollY
      const scrollingDown = currentScrollY > lastScrollY

      setIsAtTop(atTop)

      if (scrollingUp) {
        setShowNav(true)
      } else if (scrollingDown) {
        setShowNav(false)
        setIsMobileMenuOpen(false)
      }

      lastScrollY = currentScrollY
      ticking = false
    }

    const onScroll = () => {
      if (ticking) {
        return
      }

      ticking = true
      window.requestAnimationFrame(updateNavVisibility)
    }

    const navTimer = window.setTimeout(() => setShowNav(true), 0)
    const heroTimer = window.setTimeout(() => setShowHero(true), 1150)
    const ctaTimer = window.setTimeout(() => setShowCta(true), 2350)
    const frameTimer = window.setTimeout(() => setShowFrame(true), 2650)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.clearTimeout(navTimer)
      window.clearTimeout(heroTimer)
      window.clearTimeout(ctaTimer)
      window.clearTimeout(frameTimer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [isLoaderDone])

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('main section'))

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting)

        if (visibleEntry?.target?.id) {
          setActiveSection(visibleEntry.target.id)
        }
      },
      {
        rootMargin: '-45% 0px -45% 0px',
        threshold: 0.2,
      },
    )

    sections.forEach((section) => observer.observe(section))

    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
            obs.unobserve(entry.target)
          }
        })
      },
      {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.18,
      },
    )

    const revealElements = document.querySelectorAll('.reveal-group')
    revealElements.forEach((el) => revealObserver.observe(el))

    return () => {
      observer.disconnect()
      revealObserver.disconnect()
    }
  }, [])

  const toggleTheme = (event) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    const fallbackRect = event.currentTarget.getBoundingClientRect()
    const originX = event.clientX || fallbackRect.left + fallbackRect.width / 2
    const originY = event.clientY || fallbackRect.top + fallbackRect.height / 2

    document.documentElement.style.setProperty('--x', `${originX}px`)
    document.documentElement.style.setProperty('--y', `${originY}px`)
    document.documentElement.dataset.transitionTheme = nextTheme

    const commitTheme = () => {
      document.documentElement.classList.toggle('dark', nextTheme === 'dark')
      document.documentElement.setAttribute('data-theme', nextTheme)
      setTheme(nextTheme)
    }

    if (typeof document.startViewTransition === 'function') {
      const transition = document.startViewTransition(() => {
        flushSync(commitTheme)
      })

      transition.finished.finally(() => {
        delete document.documentElement.dataset.transitionTheme
      })
      return
    }

    flushSync(commitTheme)
    delete document.documentElement.dataset.transitionTheme
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((currentValue) => !currentValue)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className={`portfolio-page ${showFrame ? 'is-frame-visible' : ''}`}>
      <Preloader onHidden={() => setIsLoaderDone(true)} />

      <div className="portfolio-shell">
        <header
          className={`portfolio-nav ${showNav ? 'is-visible' : ''} ${isAtTop ? 'is-top-page' : 'is-scrolled'} ${isMobileMenuOpen ? 'is-menu-open' : ''}`}
        >
          <a className="brand-mark" href="#top" aria-label="Home">
            <svg className="brand-mark__icon" viewBox="0 0 100 100" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <circle className="brand-mark__circle" cx="50" cy="50" r="36" stroke="currentColor" strokeWidth="12" />
              <g className="brand-mark__asterisk">
                <path d="M50 12V88" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
                <path d="M18 30L82 70" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
                <path d="M18 70L82 30" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
              </g>
            </svg>
          </a>

          <div className="nav-cluster">
            <nav className="portfolio-nav__links" aria-label="Primary">
              {navItems.map((item, index) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={activeSection === item.href.slice(1) ? 'is-active' : ''}
                  style={{ '--nav-index': index }}
                  onClick={closeMobileMenu}
                >
                  <span>{String(index + 1).padStart(2, '0')}.</span>
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="nav-actions">
              <button
                className="theme-button"
                type="button"
                onClick={toggleTheme}
                aria-pressed={theme === 'dark'}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <span className="theme-button__icon" aria-hidden="true">
                  {theme === 'dark' ? <SunMedium size={22} strokeWidth={2.5} /> : <MoonStar size={22} strokeWidth={2.5} />}
                </span>
              </button>

              <button
                className={`menu-button ${isMobileMenuOpen ? 'is-active' : ''}`}
                type="button"
                onClick={toggleMobileMenu}
                aria-expanded={isMobileMenuOpen}
                aria-controls="primary-navigation"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                <div className="hamburger">
                  <div className="hamburger-box">
                    <div className="hamburger-inner"></div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className={`mobile-nav-panel ${isMobileMenuOpen ? 'is-open' : ''}`} id="primary-navigation">
            <nav className="mobile-nav-links" aria-label="Mobile Primary">
              {navItems.map((item, index) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={activeSection === item.href.slice(1) ? 'is-active' : ''}
                  style={{ transitionDelay: `${index * 60}ms` }}
                  onClick={closeMobileMenu}
                >
                  <span>{String(index + 1).padStart(2, '0')}.</span>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </header>

        <aside className={`side-rail side-rail--left ${showFrame ? 'is-visible' : ''}`} aria-label="Social links">
          {socialLinks.map((link) => (
            <a key={link.label} href={link.href} aria-label={link.label} target="_blank" rel="noreferrer">
              <span className="side-rail__icon" aria-hidden="true">
                <link.icon size={24} />
              </span>
            </a>
          ))}
          <span className="side-rail__line" />
        </aside>

        <aside className={`side-rail side-rail--right ${showFrame ? 'is-visible' : ''}`} aria-label="Contact email">
          <a className="side-rail__email" href="mailto:aayushkoirala8848@gmail.com" aria-label="Email aayushkoirala8848@gmail.com">
            aayushkoirala8848@gmail.com
          </a>
          <span className="side-rail__line" />
        </aside>

        <main className="portfolio-content" id="top">
          <section className={`hero ${showHero ? 'is-visible' : ''}`} id="top">
            <p className={`hero__eyebrow ${showHero ? 'is-visible' : ''}`}>Hi, my name is</p>
            <h1 className={`hero__title ${showHero ? 'is-visible' : ''}`}>Aayush Koirala.</h1>
            <h2 className={`hero__subtitle ${showHero ? 'is-visible' : ''}`}>I build clean digital experiences for the web.</h2>
            <p className={`hero__copy ${showHero ? 'is-visible' : ''}`}>
              I design and develop portfolio sites, product pages, and interface systems that feel calm in white mode,
              sharp in dark mode, and smooth from the moment they load.
            </p>

            <div className="hero__actions">
              <a className={`button button--primary hero__cta ${showCta ? 'is-visible' : ''}`} href="#work">
                Explore Work
              </a>
              <a className="button button--ghost" href="#contact">
                Contact Me
              </a>
            </div>
          </section>

          <section className="about-section reveal-group reveal-group--about" id="about">
            <div className="section-heading section-heading--about">
              <span>01.</span>
              <h3>About Me</h3>
              <span className="section-heading__line" aria-hidden="true" />
            </div>

            <div className="about-layout">
              <div className="about-copy">
                <article className="about-card about-card--bio">
                  <p>
                    Hello! I&apos;m <strong>Aayush Koirala</strong>, a developer in the making based in Nepal. Currently studying Computer Engineering at{' '}
                    <strong>Nepal Engineering College</strong>, I am focused on mastering the <strong>MERN stack</strong> for Full Stack Development.
                  </p>
                  <p>
                    My toolkit centers around <strong>JavaScript</strong>, including <strong>React</strong> for the frontend and <strong>Node.js/Express</strong> for the backend.
                    I am proficient with <strong>MongoDB</strong> and actively learning <strong>SQL</strong> for relational data architecture.
                  </p>
                  <p>
                    When I&apos;m not building web applications, you can find me immersed in a good book, a movie, or a video game.
                  </p>
                </article>

                <div className="about-skills">
                  {aboutSkills.map((group) => (
                    <article className="about-card about-card--skills" key={group.title}>
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

              <div className="portrait-swap" aria-label="Portrait of Aayush Koirala">
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

          <section className="feature-section reveal-group" id="work">
            <div className="section-heading">
              <span>Selected Focus</span>
              <h3>Built to feel intentional and lightweight.</h3>
            </div>

            <div className="feature-grid">
              {featuredWork.map((item) => (
                <article className="feature-card" key={item.title}>
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </article>
              ))}
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
                <article className={`project-showcase ${index % 2 === 1 ? 'project-showcase--reverse' : ''}`} key={project.title}>
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
                    <span className="project-kicker">Featured Project</span>
                    <h4>{project.title}</h4>

                    <div className="project-description-card">
                      <p>{project.text}</p>
                    </div>

                    <p className="project-stack">
                      {project.stack.join(' ')}
                    </p>

                    <div className="project-links">
                      <a
                        className="project-link"
                        href={project.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${project.title} on GitHub`}
                        title={`Open ${project.title} on GitHub`}
                      >
                        <FaGithub size={20} aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="contact-section reveal-group" id="contact">
            <div className="section-heading">
              <span>Contact</span>
              <h3>Let’s build your next portfolio or landing page.</h3>
            </div>

            <a className="button button--primary button--contact" href="mailto:hello@example.com">
              Say Hello
            </a>
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
