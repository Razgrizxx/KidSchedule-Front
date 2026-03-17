import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Calendar, Menu, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── SmartNavLink ─────────────────────────────────────────────────────────────
// On "/": smooth-scrolls to #id.
// On any other page: navigates to /#id (landing page will scroll on mount).

function SmartNavLink({
  id,
  children,
  className,
  onClick,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    onClick?.();
    if (location.pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      void navigate(`/#${id}`);
    }
  }

  return (
    <a href={`#${id}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const linkClass =
    "text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors";
  const mobileLinkClass =
    "block text-slate-600 hover:text-slate-900 text-sm font-medium py-2.5";

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo — always goes home */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-400 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">
              KidSchedule
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <SmartNavLink id="features" className={linkClass}>
              Features
            </SmartNavLink>
            <SmartNavLink id="pricing" className={linkClass}>
              Pricing
            </SmartNavLink>
            <Link to="/blog" className={linkClass}>
              Blog
            </Link>
            <Link
              to="/families"
              className="text-slate-600 hover:text-emerald-600 text-sm font-medium transition-colors"
            >
              For Families
            </Link>

            <Link
              to="/co-parents"
              className="flex items-center gap-1.5 text-slate-600 hover:text-teal-600 text-sm font-medium transition-colors"
            >
              For Co-Parents
            </Link>
            <Link
              to="/teams"
              className="text-slate-600 hover:text-orange-500 text-sm font-medium transition-colors"
            >
              For Teams
            </Link>
            <Link
              to="/pta"
              className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 text-sm font-medium transition-colors"
            >
              For PTAs
              <Badge variant="new" className="text-xs">
                New
              </Badge>
            </Link>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Log In
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1">
          <Link
            to="/families"
            className="block text-slate-600 hover:text-emerald-600 text-sm font-medium py-2.5"
            onClick={() => setIsOpen(false)}
          >
            For Families
          </Link>
          <SmartNavLink
            id="features"
            className={mobileLinkClass}
            onClick={() => setIsOpen(false)}
          >
            Features
          </SmartNavLink>
          <SmartNavLink
            id="pricing"
            className={mobileLinkClass}
            onClick={() => setIsOpen(false)}
          >
            Pricing
          </SmartNavLink>
          <Link
            to="/blog"
            className={mobileLinkClass}
            onClick={() => setIsOpen(false)}
          >
            Blog
          </Link>
          <Link
            to="/co-parents"
            className="flex items-center gap-1.5 text-slate-600 hover:text-teal-600 text-sm font-medium py-2.5"
            onClick={() => setIsOpen(false)}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            For Co-Parents
          </Link>
          <Link
            to="/teams"
            className="block text-slate-600 hover:text-orange-500 text-sm font-medium py-2.5"
            onClick={() => setIsOpen(false)}
          >
            For Teams
          </Link>
          <Link
            to="/pta"
            className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 text-sm font-medium py-2.5"
            onClick={() => setIsOpen(false)}
          >
            For PTAs{" "}
            <Badge variant="new" className="text-xs">
              New
            </Badge>
          </Link>
          <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
            <Link to="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" size="sm" className="w-full">
                Log In
              </Button>
            </Link>
            <Link to="/login" onClick={() => setIsOpen(false)}>
              <Button size="sm" className="w-full">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
