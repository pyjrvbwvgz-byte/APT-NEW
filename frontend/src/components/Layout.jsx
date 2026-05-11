import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";

export function Header({ right }) {
  return (
    <header
      className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-[#E5EFE8]"
      data-testid="site-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" data-testid="brand-link">
          <div className="w-9 h-9 rounded-lg brand-gradient flex items-center justify-center text-white">
            <Leaf className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display font-bold text-lg text-[#111C15] tracking-tight">
              ABPT
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#5C7063]">
              bruddatrain
            </div>
          </div>
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
        <div>
          <span className="font-display font-bold text-[#111C15]">ABPT</span> ·
          bruddatrain · apt_train.ie
        </div>
        <div>© {new Date().getFullYear()} ABPT. Eat well, train hard.</div>
      </div>
    </footer>
  );
}
