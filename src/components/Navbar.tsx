import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Menu, X, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-400 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">KidSchedule</span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
              Pricing
            </a>
            <a href="#blog" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
              Blog
            </a>
            <Link to="/co-parents" className="flex items-center gap-1.5 text-slate-600 hover:text-teal-600 text-sm font-medium transition-colors">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              For Co-Parents
            </Link>
            <a href="#pta" className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
              For PTAs
              <Badge variant="new" className="text-xs">New</Badge>
            </a>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log In</Button>
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
          <a href="#features" className="block text-slate-600 hover:text-slate-900 text-sm font-medium py-2.5" onClick={() => setIsOpen(false)}>Features</a>
          <a href="#pricing" className="block text-slate-600 hover:text-slate-900 text-sm font-medium py-2.5" onClick={() => setIsOpen(false)}>Pricing</a>
          <a href="#blog" className="block text-slate-600 hover:text-slate-900 text-sm font-medium py-2.5" onClick={() => setIsOpen(false)}>Blog</a>
          <Link to="/co-parents" className="flex items-center gap-1.5 text-slate-600 hover:text-teal-600 text-sm font-medium py-2.5" onClick={() => setIsOpen(false)}>
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            For Co-Parents
          </Link>
          <a href="#pta" className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-medium py-2.5" onClick={() => setIsOpen(false)}>
            For PTAs <Badge variant="new" className="text-xs">New</Badge>
          </a>
          <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
            <Link to="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" size="sm" className="w-full">Log In</Button>
            </Link>
            <Link to="/login" onClick={() => setIsOpen(false)}>
              <Button size="sm" className="w-full">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
