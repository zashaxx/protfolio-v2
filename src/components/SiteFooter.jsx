import { ArrowUpRight } from "lucide-react";

export default function SiteFooter({ pageView, onNavigate }) {
  return (
    <footer className="site-footer content-wrap" data-reveal>
      <p>&copy; 2026 Aayush Koirala</p>
      <a
        href={pageView === "home" ? "#home" : "/"}
        onClick={(event) => onNavigate(event, "#home")}
      >
        {pageView === "home" ? "Back to top" : "Back home"}
        <ArrowUpRight size={12} strokeWidth={1.6} aria-hidden="true" />
      </a>
    </footer>
  );
}
