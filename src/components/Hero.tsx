import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const checkItems = [
  '45,000+ school calendars',
  'Syncs to any calendar app',
  'Share with caregivers',
]

export function Hero() {
  return (
    <section className="bg-gradient-to-b from-teal-50 to-white pt-24 pb-32 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 leading-tight tracking-tight mb-6">
            The family calendar<br className="hidden sm:block" />
            that actually works.
          </h1>
          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            School schedules, activities, and everyone's stuff — finally in one place.
            Syncs everywhere. Works for any family.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Button size="lg" className="shadow-md shadow-teal-200/60 px-8">
            Start Free for 60 Days
          </Button>
          <Button variant="ghost" className="flex items-center gap-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50">
            See How It Works <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8"
        >
          {checkItems.map((item) => (
            <div key={item} className="flex items-center gap-2 text-slate-500 text-sm">
              <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
