import { Calendar } from 'lucide-react'

const footerLinks: Record<string, string[]> = {
  Product: ['Features', 'Pricing', 'School Directory', 'Mobile App', 'Integrations'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'COPPA Compliance'],
  Support: ['Help Center', 'Getting Started', 'Contact Support', 'System Status'],
  Contact: ['hello@kidschedule.com', 'Twitter / X', 'Instagram', 'Facebook'],
}

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-teal-400 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-800">KidSchedule</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              The family calendar built for real life.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-slate-800 mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-8 text-center">
          <p className="text-slate-400 text-sm">
            © 2026 KidSchedule. Made with ❤️ for co-parents everywhere. Build 0.5.217
          </p>
        </div>
      </div>
    </footer>
  )
}
