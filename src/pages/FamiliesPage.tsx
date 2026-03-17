import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  Baby,
  Shield,
  DollarSign,
  MessageCircle,
  Images,
  Bell,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Heart,
  Clock,
  Layers,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

// ─── Motion helpers ───────────────────────────────────────────────────────────

function fu(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.55, ease: "easeOut" as const, delay },
  };
}

function fa(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: "easeOut" as const, delay },
  };
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Calendar,
    title: "Family Calendar",
    desc: "One shared calendar for every kid, activity, pickup, and appointment. Color-coded per child so nothing gets mixed up.",
    color: "bg-emerald-50 text-emerald-500",
  },
  {
    icon: Baby,
    title: "Per-Child Profiles",
    desc: "Health info, allergies, school details, and emergency contacts — all organized by child and instantly accessible.",
    color: "bg-teal-50 text-teal-500",
  },
  {
    icon: Shield,
    title: "Caregiver Access",
    desc: "Invite grandparents, nannies, and babysitters with custom permission levels. They see exactly what they need, nothing more.",
    color: "bg-purple-50 text-purple-500",
  },
  {
    icon: RefreshCw,
    title: "Custody Schedules",
    desc: "Visual custody calendar with alternating patterns. Both parents always know who has the kids and when — without texting.",
    color: "bg-blue-50 text-blue-500",
  },
  {
    icon: DollarSign,
    title: "Shared Expenses",
    desc: "Track school fees, activities, and medical costs. Split ratios, running balances, and receipt uploads — no spreadsheet needed.",
    color: "bg-amber-50 text-amber-500",
  },
  {
    icon: MessageCircle,
    title: "Family Messaging",
    desc: "A private chat for your family group. Immutable messages with timestamps — no third-party apps, no forwarded screenshots.",
    color: "bg-indigo-50 text-indigo-500",
  },
  {
    icon: Images,
    title: "Moments Gallery",
    desc: "A shared photo album for the whole family. Upload milestones, school events, and everyday moments all in one place.",
    color: "bg-rose-50 text-rose-500",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    desc: "Permission slips, pickup times, after-school activities. Automated reminders so nothing falls through the cracks.",
    color: "bg-orange-50 text-orange-500",
  },
  {
    icon: Users,
    title: "Co-Parent Coordination",
    desc: "Built-in change requests for schedule swaps. Counter-proposals, acceptances, and a full documented trail.",
    color: "bg-cyan-50 text-cyan-500",
  },
];

// ─── Pain points → solutions ──────────────────────────────────────────────────

const SOLUTIONS = [
  {
    icon: Clock,
    pain: "Constant schedule confusion",
    fix: "One shared calendar both parents and caregivers always see — updated in real time.",
  },
  {
    icon: Layers,
    pain: "Scattered across 5 apps",
    fix: "Calendar, messages, expenses, documents, and photos in a single place.",
  },
  {
    icon: Heart,
    pain: "Caregivers need info in emergencies",
    fix: "Instant access to allergies, doctors, and emergency contacts — no group chat hunting.",
  },
  {
    icon: Smile,
    pain: "Kids' memories lost everywhere",
    fix: "A shared family gallery that grows with them. Always findable, always safe.",
  },
];

// ─── Stats ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "4.8★", label: "Average app rating" },
  { value: "2 min", label: "Average setup time" },
  { value: "Free", label: "For families, always" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export function FamiliesPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-start justify-center"
        >
          <div className="w-[800px] h-[500px] rounded-full bg-emerald-200/25 blur-[120px] -translate-y-1/3" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div {...fa(0)}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1 mb-6">
              <Heart className="w-3.5 h-3.5" />
              For Busy Families
            </span>
          </motion.div>

          <motion.h1
            {...fa(0.1)}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6"
          >
            Everything for your family.{" "}
            <span className="text-emerald-500">Finally in one place.</span>
          </motion.h1>

          <motion.p
            {...fa(0.2)}
            className="text-lg text-slate-500 leading-relaxed max-w-xl mx-auto mb-10"
          >
            Schedules, caregivers, expenses, messages, and memories —
            organized for real family life, not the ideal version of it.
          </motion.p>

          <motion.div
            {...fa(0.3)}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
          >
            <Link to="/login">
              <Button
                size="lg"
                className="gap-2 px-8 h-12 text-base rounded-2xl shadow-md shadow-emerald-100 bg-emerald-500 hover:bg-emerald-600"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-base rounded-2xl border-slate-200 text-slate-600"
            >
              See how it works
            </Button>
          </motion.div>

          {/* Trust row */}
          <motion.div
            {...fa(0.4)}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500"
          >
            {[
              { icon: CheckCircle2, label: "Free forever for families" },
              { icon: Shield, label: "Private & secure" },
              { icon: Smile, label: "Works on any device" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="w-4 h-4 text-emerald-400" />
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Pain → Solution ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fu(0)} className="text-center mb-14">
            <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-3">
              Sound familiar?
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Family chaos, solved.
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
              KidSchedule was built around the specific frustrations of parents
              managing multiple kids, schedules, and caregivers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {SOLUTIONS.map((s, i) => (
              <motion.div
                key={s.pain}
                {...fu(i * 0.1)}
                className="rounded-3xl border border-slate-100 bg-slate-50 p-6 hover:shadow-md transition-all"
              >
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <s.icon className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 line-through mb-1">
                      {s.pain}
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {s.fix}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-50" id="features">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fu(0)} className="text-center mb-14">
            <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-3">
              Built for real family life
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything in one app
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
              Stop juggling Google Calendar, group texts, spreadsheets, and
              note apps. KidSchedule brings it all together.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                {...fu(i * 0.05)}
                className="rounded-3xl border border-slate-100 bg-white p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${f.color}`}
                >
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1.5">
                  {f.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar (dark) ──────────────────────────────────────────────── */}
      <section className="bg-[#0f172a] py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            {...fu(0)}
            className="grid grid-cols-3 divide-x divide-white/10 text-center"
          >
            {STATS.map((s) => (
              <div key={s.label} className="py-6 px-4">
                <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mb-1">
                  {s.value}
                </p>
                <p className="text-xs text-slate-400 leading-snug">{s.label}</p>
              </div>
            ))}
          </motion.div>

          <motion.div {...fu(0.2)} className="mt-12 text-center">
            <p className="text-white font-semibold text-lg mb-2">
              Designed for the whole family unit.
            </p>
            <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
              Parents, step-parents, grandparents, nannies — everyone gets
              exactly the access they need, and nothing they shouldn't see.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fu(0)} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Set up your family in minutes
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto leading-relaxed">
              No technical setup. Just your family's info and you're ready to go.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Add your children",
                desc: "Create a profile for each child with their info, color, and school details.",
              },
              {
                step: "2",
                title: "Invite your people",
                desc: "Add a co-parent, grandparent, or caregiver. Each gets the right level of access.",
              },
              {
                step: "3",
                title: "Live your life",
                desc: "Everything syncs automatically. Everyone always knows what's happening.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                {...fu(i * 0.12)}
                className="text-center p-6 rounded-3xl border border-slate-100 bg-slate-50"
              >
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white text-sm font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fu(0)}>
            <div className="w-14 h-14 rounded-3xl bg-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Less chaos.{" "}
              <span className="text-emerald-500">More family time.</span>
            </h2>
            <p className="text-slate-500 leading-relaxed mb-8 max-w-md mx-auto">
              Join families who ditched the spreadsheets and group chats — and
              actually enjoy knowing where everyone is supposed to be.
            </p>
            <Link to="/login">
              <Button
                size="lg"
                className="px-10 text-base rounded-2xl shadow-lg shadow-emerald-100 gap-2 bg-emerald-500 hover:bg-emerald-600"
              >
                Start Free — No Credit Card
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <p className="text-xs text-slate-400 mt-4">
              Free for families · Takes 2 minutes to set up
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
