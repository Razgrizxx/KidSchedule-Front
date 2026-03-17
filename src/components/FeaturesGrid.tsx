import { motion } from 'framer-motion'
import { School, Sparkles, RefreshCw, Baby, Share2, Bell } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: School,
    title: 'School Calendar Sync',
    description:
      "Automatically pull in your school's calendar — including holidays, early dismissals, and events — from 45,000+ districts.",
  },
  {
    icon: Sparkles,
    title: 'AI Calendar Import',
    description:
      'Snap a photo of any paper schedule or flyer. Our AI reads it and adds it to your calendar instantly.',
  },
  {
    icon: RefreshCw,
    title: 'Syncs Everywhere',
    description:
      'Works with Google Calendar, Apple Calendar, and Outlook. Your family schedule lives wherever you do.',
  },
  {
    icon: Baby,
    title: 'Child-by-Child View',
    description:
      'See the full week for each kid individually, or get a combined family view. Color-coded, clean, and easy to scan.',
  },
  {
    icon: Share2,
    title: 'Share with Caregivers',
    description:
      'Grandparents, nannies, and coaches can view relevant schedules without needing full access to your family account.',
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description:
      'Get notified before school events, activities, and important deadlines — customized for each family member.',
  },
]

export function FeaturesGrid() {
  return (
    <section id="features" className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Features that save you time
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Everything your family needs, nothing you don't.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="flex gap-4"
            >
              <div className="w-11 h-11 rounded-2xl bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                <feature.icon className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
