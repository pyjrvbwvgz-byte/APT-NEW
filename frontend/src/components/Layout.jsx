import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useSiteContent } from "../lib/siteContent";

export function Header({ right, marketing = false }) {
  const { content } = useSiteContent();
  const [open, setOpen] = useState(false);
  const links = marketing ? content?.nav?.links || [] : [];

  return (
    <div className="sticky top-0 z-40 theme-dark-bar" data-testid="site-header">
      {marketing && content?.announcement && (
        <div
          className="bg-[#38bdf8] text-[#08090b] overflow-hidden marquee-mask"
          data-testid="announcement-bar"
        >
          <div className="marquee-track py-1.5">
            {[0, 1].map((k) => (
              <span key={k} className="flex shrink-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span
                    key={i}
                    className="px-6 text-[10px] font-semibold uppercase tracking-[0.32em]"
                  >
                    {content.announcement}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}

      <header className="bg-[#0c0d10]/85 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 h-[68px] flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-3 shrink-0" data-testid="brand-link">
            <img src="/brand/apt-mark.png" alt="APT" className="h-9 w-auto logo-on-dark" />
            <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45 border-l border-white/15 pl-3">
              bruddatrain
            </span>
          </Link>

          {links.length > 0 && (
            <nav className="hidden lg:flex items-center gap-9" data-testid="site-nav">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60 hover:text-[#38bdf8]"
                  data-testid={`nav-link-${l.label.toLowerCase()}`}
                >
                  {l.label}
                </a>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3">{right}</div>
            {links.length > 0 && (
              <button
                onClick={() => setOpen((v) => !v)}
                className="lg:hidden h-9 w-9 grid place-items-center rounded-md border border-white/15 text-white/80"
                aria-label="Toggle menu"
                data-testid="mobile-menu-toggle"
              >
                {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {open && (
          <div className="lg:hidden border-t border-white/10 bg-[#0c0d10] px-4 py-5 space-y-4" data-testid="mobile-menu">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/70"
                data-testid={`mobile-nav-link-${l.label.toLowerCase()}`}
              >
                {l.label}
              </a>
            ))}
          </div>
        )}
      </header>
    </div>
  );
}

export function Footer() {
  const { content } = useSiteContent();
  const f = content?.footer || {};

  return (
    <footer className="bg-[#08090b] border-t border-white/10 mt-auto theme-dark-bar" data-testid="site-footer">
      {f.strapline && (
        <div className="border-b border-white/10 overflow-hidden marquee-mask">
          <div className="marquee-track py-4">
            {[0, 1].map((k) => (
              <span key={k} className="flex shrink-0">
                {Array.from({ length: 4 }).map((_, i) => (
                  <span
                    key={i}
                    className="font-display px-8 text-2xl sm:text-4xl font-bold uppercase tracking-tight text-white/[0.08]"
                  >
                    {f.strapline}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-14 grid gap-10 md:grid-cols-12">
        <div className="md:col-span-6">
          <img src="/brand/apt-mark.png" alt="APT" className="h-10 w-auto logo-on-dark" />
          <div className="font-display mt-5 text-2xl font-bold tracking-tight text-white">
            {f.brand}
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/45">{f.tagline}</p>
        </div>

        <div className="md:col-span-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#38bdf8]">
            {f.support_label}
          </div>
          {f.support_email && (
            <a
              href={`mailto:${f.support_email}`}
              className="mt-4 block text-sm text-white/70 hover:text-white"
              data-testid="footer-support-email"
            >
              {f.support_email}
            </a>
          )}
          <div className="mt-4 space-y-2">
            {(f.lines || []).map((l) => (
              <div key={l} className="text-sm text-white/45">
                {l}
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#38bdf8]">
            Access
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <Link to="/subscribe" className="block text-white/70 hover:text-white" data-testid="footer-subscribe-link">
              Subscribe
            </Link>
            <Link to="/auth" className="block text-white/70 hover:text-white" data-testid="footer-code-link">
              Client code portal
            </Link>
            <Link to="/admin" className="block text-white/45 hover:text-white" data-testid="footer-admin-link">
              Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-white/35">
          <div>
            © {new Date().getFullYear()} {f.copyright}
          </div>
          <div>apttrains.com</div>
        </div>
      </div>
    </footer>
  );
}
