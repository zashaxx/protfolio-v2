import { FaGithub, FaGitlab } from 'react-icons/fa6';
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
  SiJavascript,
  SiVercel,
  SiFastapi,
  SiPython,
  SiSqlalchemy,
  SiVite,
  SiDocker,
  SiGit,
} from 'react-icons/si';

const iconMap = {
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
  'GitHub': FaGithub,
  'GitLab': FaGitlab,
};

const brandColors = {
  'React': '#61DAFB',
  'Node.js': '#339933',
  'Express': '#000000',
  'MongoDB': '#47A248',
  'Socket.io': '#010101',
  'Stripe': '#008CDD',
  'Firebase': '#FFCA28',
  'Next.js': '#000000',
  'TypeScript': '#3178C6',
  'PostgreSQL': '#4169E1',
  'tRPC': '#2596BE',
  'Clerk Auth': '#6C47FF',
  'Clerk': '#6C47FF',
  'AI Integration': '#412991',
  'CSS3': '#1572B6',
  'CSS': '#1572B6',
  'JavaScript': '#F7DF1E',
  'Vercel': '#000000',
  'FastAPI': '#009688',
  'Python': '#3776AB',
  'SQLAlchemy': '#D71F00',
  'Vite': '#646CFF',
  'Docker': '#2496ED',
  'Git': '#F05032',
  'GitHub': '#181717',
  'GitLab': '#FC6D26',
};

export default function TechIcon({ name, size = 16 }) {
  const Icon = iconMap[name];
  const brandColor = brandColors[name];

  if (!Icon) {
    return <span>{name}</span>;
  }

  return (
    <span
      className="tech-icon"
      tabIndex={0}
      role="button"
      style={brandColor ? { '--brand': brandColor } : undefined}
    >
      <Icon size={size} />
      <span className="tech-icon__label">{name}</span>
    </span>
  );
}
