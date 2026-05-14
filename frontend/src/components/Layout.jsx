import { Link } from "react-router-dom";

export function Header({ right }) {
  return (
    <header
      className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-[#E5EFE8]"
      data-testid="site-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3" data-testid="brand-link">
          <img
            src="/brand/apt-mark.png"
            alt="APT — Abraham's Personal Training"
            className="h-8 w-auto"
          />
          <span className="hidden sm:inline-block text-[10px] uppercase tracking-[0.22em] text-[#5C7063] border-l border-[#E5EFE8] pl-3">
            bruddatrain
          </span>
        </Link>
        <div className="flex items-center gap-3">{right}</div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[#E5EFE8] bg-white/60 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row justify-between gap-4 text-sm text-[#5C7063]">
        <div className="flex items-center gap-3">
          <img src="/brand/apt-mark.png" alt="APT" className="h-6 w-auto" />
          <span>· bruddatrain · apttrains.com</span>
        </div>
        <div>© {new Date().getFullYear()} Abraham's Personal Training. Eat well, train hard.</div>
      </div>
    </footer>
  );
}
