import { useState, useCallback, useEffect, useRef } from 'react';
import {
  SiReact,
  SiNodedotjs,
  SiExpress,
  SiMongodb,
  SiSocketdotio,
  SiStripe,
  SiFirebase,
  SiNextdotjs,
  SiTypescript,
  SiPostgresql,
  SiTrpc,
  SiClerk,
  SiOpenai,
  SiCss,
  SiHtml5,
  SiJavascript,
  SiVercel,
  SiFastapi,
  SiPython,
  SiSqlalchemy,
  SiVite,
  SiDocker,
  SiGit,
  SiGithub,
  SiGitlab,
} from 'react-icons/si';

const iconMap = {
  'HTML': SiHtml5,
  'React': SiReact,
  'Node.js': SiNodedotjs,
  'Express': SiExpress,
  'MongoDB': SiMongodb,
  'Socket.io': SiSocketdotio,
  'Stripe': SiStripe,
  'Firebase': SiFirebase,
  'Next.js': SiNextdotjs,
  'TypeScript': SiTypescript,
  'PostgreSQL': SiPostgresql,
  'tRPC': SiTrpc,
  'Clerk Auth': SiClerk,
  'Clerk': SiClerk,
  'AI Integration': SiOpenai,
  'CSS3': SiCss,
  'CSS': SiCss,
  'JavaScript': SiJavascript,
  'Vercel': SiVercel,
  'FastAPI': SiFastapi,
  'Python': SiPython,
  'SQLAlchemy': SiSqlalchemy,
  'Vite': SiVite,
  'Docker': SiDocker,
  'Git': SiGit,
  'GitHub': SiGithub,
  'GitLab': SiGitlab,
};

export default function TechIcon({ name, size = 16, collapsed = false }) {
  const [open, setOpen] = useState(false);
  const selfRef = useRef(null);
  const Icon = iconMap[name];

  const toggle = useCallback(() => {
    if (!collapsed) return;
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        window.dispatchEvent(
          new CustomEvent('tech-icon-close-others', { detail: selfRef.current })
        );
      }
      return next;
    });
  }, [collapsed]);

  useEffect(() => {
    if (!collapsed) return;
    const handler = (e) => {
      if (e.detail !== selfRef.current) {
        setOpen(false);
      }
    };
    window.addEventListener('tech-icon-close-others', handler);
    return () => window.removeEventListener('tech-icon-close-others', handler);
  }, [collapsed]);

  if (!Icon) {
    return <span>{name}</span>;
  }

  return (
    <span
      ref={selfRef}
      className={`tech-icon ${collapsed ? 'tech-icon--collapsed' : ''} ${open ? 'is-open' : ''}`}
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      role={collapsed ? 'button' : undefined}
      tabIndex={collapsed ? 0 : undefined}
      onKeyDown={collapsed ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } } : undefined}
    >
      <Icon size={size} />
      <span className="tech-icon__label">{name}</span>
    </span>
  );
}
