import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'

export function Testimonial() {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-teal-50/40 to-white">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 md:p-14 text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-8">
            <Quote className="w-6 h-6 text-teal-400" />
          </div>
          <blockquote className="text-2xl md:text-3xl font-medium text-slate-700 leading-relaxed mb-8">
            "KidSchedule saved my sanity. Between two schools, three activities, and sharing
            custody, I used to live in spreadsheets. Now it's all just... there."
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-semibold text-sm">
              MR
            </div>
            <div className="text-left">
              <div className="text-slate-800 font-semibold text-sm">Michelle R.</div>
              <div className="text-slate-400 text-xs">Mom of 3</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
