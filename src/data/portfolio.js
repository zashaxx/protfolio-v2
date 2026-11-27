import { BookOpen, Braces, FolderKanban, Layers3, Mail, Monitor, Moon, Play, ShoppingBag, Sun, UserRound } from "lucide-react";
import { FaGithub, FaInstagram, FaLinkedinIn, FaWhatsapp } from "react-icons/fa6";

export const navItems = [
  { label: "Profile", href: "#about", icon: UserRound },
  { label: "Expertise", href: "#expertise", icon: Braces },
  { label: "Stack", href: "#stack", icon: Layers3 },
  { label: "Work", href: "#projects", icon: FolderKanban },
  { label: "Activity", href: "#github", icon: FaGithub },
  { label: "Contact", href: "#contact", icon: Mail },
];

export const socialLinks = [
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

export const sidebarSocialLinks = socialLinks.slice(0, 2);
export const contactEmail = "aayushkoirala8848@gmail.com";

export const expertise = [
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

export const projects = [
  {
    title: "MERCH Nepal",
    preview: "/projects/merch-nepal.svg",
    subtitle: "Full-stack commerce platform",
    description:
      "A MERN e-commerce system with seller onboarding, administrative controls, Stripe payments, and real-time support chat.",
    stack: ["React", "Node.js", "MongoDB", "Socket.io", "Stripe"],
    href: "https://github.com/zashaxx/Merch-Nepal",
    icon: ShoppingBag,
  },
  {
    title: "GoodNotes",
    preview: "/projects/goodnotes.svg",
    subtitle: "University resource library",
    description:
      "A focused education portal that helps Pokhara University students find and download the notes they need without friction.",
    stack: ["React", "Firebase", "Node.js", "Responsive UI"],
    href: "https://github.com/zashaxx/GoodNotesFinal",
    icon: BookOpen,
  },
  {
    title: "Nep Tube",
    preview: "/projects/nep-tube.svg",
    subtitle: "Nepal video platform",
    description:
      "A full-stack streaming product with Clerk authentication, AI-assisted tools, PostgreSQL, tRPC, and dedicated video delivery.",
    stack: ["Next.js", "TypeScript", "PostgreSQL", "tRPC", "AI"],
    href: "https://github.com/zashaxx/neptube",
    icon: Play,
  },
];

export const otherProjects = [
  {
    title: "Chromatiq",
    preview: "/projects/chromatiq.png",
    type: "Colour game",
    description:
      "A compact colour-perception game with immediate feedback and a deliberately simple interface.",
    tech: ["Next.js", "React", "Vercel"],
    source: "https://github.com/zashaxx/chromatiq",
    live: "https://chromatiq.vercel.app/",
  },
  {
    title: "Cow & Bull",
    preview: "/projects/cow-and-bull.png",
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
    source: "https://github.com/zashaxx/protfolio-v2",
    live: "https://aayush-koirala.com.np",
  },
];

export const galleryProjects = [
  otherProjects[0],
  projects[1],
  projects[0],
  projects[2],
  otherProjects[1],
];

export const themeOptions = [
  { value: "system", label: "Device", icon: Monitor },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
];
