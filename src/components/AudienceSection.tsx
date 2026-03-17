import { motion } from 'framer-motion'
import { Users, GitBranch, Trophy, GraduationCap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface AudienceCard {
  icon: LucideIcon
  title: string
  description: string
}

const audiences: AudienceCard[] = [
  {
    icon: Users,
    title: 'Busy Families',
    description:
      'Juggling school, sports, music, and more? KidSchedule keeps every activity, pickup, and permission slip in one place — for every kid.',
  },
  {
    icon: GitBranch,
    title: 'Co-Parents',
    description:
      'Shared custody is complex. KidSchedule makes it simple — synced schedules, shared notes, and zero confusion about who has the kids when.',
  },
  {
    icon: Trophy,
    title: 'Teams & Clubs',
    description:
      'Coaches and club managers can publish practice schedules, game days, and events directly to member family calendars.',
  },
  {
    icon: GraduationCap,
    title: 'PTAs & Schools',
    description:
      'Share school events, early dismissal days, and fundraisers with every family — no more paper newsletters lost in the backpack.',
  },
]

export function AudienceSection() {
  return (
    <section className="py-24 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Built for how families really work
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Every family is different. KidSchedule adapts to yours.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {audiences.map((audience, index) => (
            <motion.div
              key={audience.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow duration-200">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
                    <audience.icon className="w-6 h-6 text-teal-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{audience.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{audience.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
