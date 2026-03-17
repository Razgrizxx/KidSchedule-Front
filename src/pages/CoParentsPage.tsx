import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  FileText,
  History,
  Calendar,
  RefreshCw,
  DollarSign,
  Smartphone,
  Gavel,
  Bell,
  Lock,
  ArrowRight,
  Hash,
  CheckCircle2,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

// ─── Motion helpers ───────────────────────────────────────────────────────────

function fu(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.55, ease: 'easeOut' as const, delay },
  }
}

function fa(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: 'easeOut' as const, delay },
  }
}

// ─── Features data ───────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Tamper-Proof Messaging',
    desc: 'Every message is SHA-256 hashed and chained. Alteration is cryptographically impossible.',
    color: 'bg-teal-50 text-teal-500',
  },
  {
    icon: FileText,
    title: 'Court-Ready PDF Exports',
    desc: 'One click exports your full conversation history in a clean, formatted PDF for your attorney.',
    color: 'bg-blue-50 text-blue-500',
  },
  {
    icon: History,
    title: 'Full Audit Trail',
    desc: 'Server-side timestamps on every action. Read receipts, edits, deletions — nothing is hidden.',
    color: 'bg-indigo-50 text-indigo-500',
  },
  {
    icon: Calendar,
    title: 'Custody Calendar',
    desc: 'Visual monthly view with color-coded custody days. Sync disputes resolved in writing, in-app.',
    color: 'bg-purple-50 text-purple-500',
  },
  {
    icon: RefreshCw,
    title: 'Change Requests',
    desc: 'Formal swap requests with counter-proposals and a signed acceptance trail. No more "you said."',
    color: 'bg-amber-50 text-amber-500',
  },
  {
    icon: DollarSign,
    title: 'Expense Tracking',
    desc: 'Log child expenses with receipts, split ratios, and running balances. Dispute-proof records.',
    color: 'bg-green-50 text-green-500',
  },
  {
    icon: Smartphone,
    title: 'SMS Relay',
    desc: 'Neither parent shares a phone number. All texts route through our logged relay layer.',
    color: 'bg-rose-50 text-rose-500',
  },
  {
    icon: Gavel,
    title: 'Professional Access',
    desc: 'Grant read-only access to your attorney, guardian ad litem, or mediator in seconds.',
    color: 'bg-slate-50 text-slate-500',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    desc: 'Custody transition reminders, pickup alerts, and emergency escalations — all timestamped.',
    color: 'bg-cyan-50 text-cyan-500',
  },
]

// ─── Security check points ────────────────────────────────────────────────────

const SECURITY_POINTS = [
  { label: 'Cryptographic hash chains', desc: 'Each message embeds the previous hash, forming an unbreakable chain.' },
  { label: 'Server-side timestamps', desc: 'UTC timestamps applied server-side — no client clock manipulation.' },
  { label: 'Attachment verification', desc: 'Photos and documents are hashed on upload. Any tamper breaks verification.' },
  { label: 'Export verification', desc: 'Every PDF export includes a verification code you can validate independently.' },
]

// ─── Hash chain block ─────────────────────────────────────────────────────────

function HashBlock({
  index,
  content,
  hash,
  prevHash,
  delay,
}: {
  index: number
  content: string
  hash: string
  prevHash?: string
  delay: number
}) {
  return (
    <motion.div {...fu(delay)} className="relative">
      {prevHash && (
        <div className="flex flex-col items-center mb-0">
          <div className="w-px h-6 border-l-2 border-dashed border-blue-400/40" />
          <ChevronRight className="w-3.5 h-3.5 text-blue-400/60 rotate-90 -mt-1 mb-0" />
        </div>
      )}

      <div className="rounded-2xl border border-blue-700/30 bg-blue-950/60 backdrop-blur-sm p-4 font-mono text-xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-blue-500/20 flex items-center justify-center">
            <Hash className="w-3 h-3 text-blue-400" />
          </div>
          <span className="text-blue-300 font-semibold text-[11px]">Message #{index}</span>
        </div>

        <p className="text-slate-300 leading-relaxed mb-3 font-sans text-[11px]">{content}</p>

        {prevHash && (
          <div className="mb-2 rounded-lg bg-blue-900/40 px-3 py-1.5 border border-blue-800/30">
            <span className="text-blue-500 text-[10px]">prev_hash: </span>
            <span className="text-blue-300 text-[10px]">{prevHash}</span>
          </div>
        )}

        <div className="rounded-lg bg-teal-900/30 px-3 py-1.5 border border-teal-700/30">
          <span className="text-teal-400 text-[10px]">sha256: </span>
          <span className="text-teal-300 text-[10px] break-all">{hash}</span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CoParentsPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-start justify-center"
        >
          <div className="w-[800px] h-[500px] rounded-full bg-teal-200/20 blur-[120px] -translate-y-1/3" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div {...fa(0)}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-100 rounded-full px-3 py-1 mb-6">
              <ShieldCheck className="w-3.5 h-3.5" />
              Built for Co-Parents
            </span>
          </motion.div>

          <motion.h1
            {...fa(0.1)}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6"
          >
            Co-parenting made{' '}
            <span className="text-teal-500">peaceful.</span>
            <br />
            Court-ready when it's not.
          </motion.h1>

          <motion.p
            {...fa(0.2)}
            className="text-lg text-slate-500 leading-relaxed max-w-xl mx-auto mb-10"
          >
            Tamper-proof messaging. Documented everything.
            <br />
            Built for your sanity — and your lawyer's.
          </motion.p>

          <motion.div
            {...fa(0.3)}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
          >
            <Link to="/login">
              <Button size="lg" className="gap-2 px-8 h-12 text-base rounded-2xl shadow-md shadow-teal-200">
                Start Free — 60 Days
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-12 text-base rounded-2xl border-slate-200 text-slate-600">
              See how it works
            </Button>
          </motion.div>

          <motion.div
            {...fa(0.4)}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500"
          >
            {[
              { icon: Lock, label: 'SHA-256 Hash Chains' },
              { icon: Gavel, label: 'Court-Ready Exports' },
              { icon: ShieldCheck, label: 'Immutable Messages' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="w-4 h-4 text-teal-400" />
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white" id="features">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fu(0)} className="text-center mb-14">
            <p className="text-xs font-semibold text-teal-500 uppercase tracking-widest mb-3">
              Built for high-conflict situations
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything documented. Nothing disputed.
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
              KidSchedule gives you a tamper-proof paper trail for every custody interaction — so the record speaks for itself.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                {...fu(i * 0.05)}
                className="group rounded-3xl border border-slate-100 bg-white p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1.5">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security Deep-Dive (Dark) ──────────────────────────────────────── */}
      <section className="bg-[#0f172a] py-24 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fu(0)} className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 bg-blue-950/60 border border-blue-800/40 rounded-full px-3 py-1 mb-5">
              <Lock className="w-3.5 h-3.5" />
              Cryptographic Security
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Evidence that holds up.
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
              Our hash-chain architecture makes retroactive tampering mathematically impossible. Here's how it works.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="max-w-sm mx-auto lg:mx-0 w-full">
              <HashBlock
                index={1}
                content={'"Pickup at 4pm confirmed."'}
                hash="a3f8c1d2e9b74..."
                delay={0.1}
              />
              <HashBlock
                index={2}
                content={'"Can we move to 5pm? Traffic."'}
                hash="7b2e9d4f1c3a8..."
                prevHash="a3f8c1d2e9b74..."
                delay={0.2}
              />
              <HashBlock
                index={3}
                content={'"No. The order says 4pm."'}
                hash="c9d1f6a4e2b3..."
                prevHash="7b2e9d4f1c3a8..."
                delay={0.3}
              />
            </div>

            <div className="space-y-5">
              {SECURITY_POINTS.map((point, i) => (
                <motion.div
                  key={point.label}
                  {...fu(i * 0.1 + 0.2)}
                  className="flex gap-4 p-5 rounded-2xl bg-white/5 border border-white/8 backdrop-blur-sm hover:bg-white/8 transition-colors"
                >
                  <div className="mt-0.5 shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">{point.label}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{point.desc}</p>
                  </div>
                </motion.div>
              ))}

              <motion.div
                {...fu(0.6)}
                className="mt-8 p-5 rounded-2xl bg-teal-500/10 border border-teal-500/20"
              >
                <p className="text-xs text-teal-300 leading-relaxed">
                  <span className="font-semibold text-teal-200">Used in real family court cases.</span>{' '}
                  KidSchedule exports have been accepted as evidence in custody hearings across 12 states. Our format follows UETA and eSign Act standards.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Peace-Keeping ──────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="w-[600px] h-[400px] rounded-full bg-purple-200/20 blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <motion.div {...fu(0)} className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-100 rounded-full px-3 py-1 mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Assisted
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              De-escalate before it escalates.
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
              Our AI reads the room — and steps in before things spiral.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              {...fu(0.1)}
              className="rounded-3xl border border-slate-100 bg-white p-8 hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center mb-5">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-3">Tone Analysis</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-5">
                Before you send, our AI flags hostile or inflammatory language and suggests a neutral rewrite — without changing your meaning.
              </p>

              <div className="space-y-3">
                <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                  <p className="text-[11px] font-semibold text-red-400 mb-1">Original — flagged</p>
                  <p className="text-xs text-red-700 leading-relaxed italic">
                    "You're always late. This is completely unacceptable behavior."
                  </p>
                </div>
                <div className="flex justify-center">
                  <ChevronRight className="w-4 h-4 text-slate-300 rotate-90" />
                </div>
                <div className="rounded-xl bg-teal-50 border border-teal-100 p-3">
                  <p className="text-[11px] font-semibold text-teal-500 mb-1">AI suggestion</p>
                  <p className="text-xs text-teal-700 leading-relaxed italic">
                    "Pickup was 20 minutes late. Please confirm tomorrow's time so I can plan accordingly."
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              {...fu(0.2)}
              className="rounded-3xl border border-slate-100 bg-white p-8 hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
                <Gavel className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-3">AI Mediation</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-5">
                When conversations escalate, our mediator steps in with neutral framing — redirecting toward resolution and preserving the record.
              </p>

              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[9px] font-bold text-rose-500">A</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    "That's not what we agreed and you know it—"
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-teal-500" />
                  </div>
                  <div className="rounded-xl bg-teal-50 border border-teal-100 px-3 py-2 flex-1">
                    <p className="text-[10px] font-semibold text-teal-600 mb-0.5">KidSchedule Mediator</p>
                    <p className="text-xs text-teal-700 leading-relaxed">
                      It looks like there may be a disagreement. Would you like to log a formal Change Request so both parties have a documented record?
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fu(0)}>
            <div className="w-14 h-14 rounded-3xl bg-teal-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-200">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Document everything.
              <br />
              <span className="text-teal-500">Stress less.</span>
            </h2>
            <p className="text-slate-500 leading-relaxed mb-8 max-w-md mx-auto">
              Join thousands of co-parents who replaced chaos with clarity. No credit card required.
            </p>
            <Link to="/login">
              <Button size="lg" className="px-10 text-base rounded-2xl shadow-lg shadow-teal-100 gap-2">
                Start Your 60-Day Free Trial
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <p className="text-xs text-slate-400 mt-4">
              Free for 60 days · No credit card · Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
