import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Globe,
  Lock,
  Rss,
  Users,
  CalendarDays,
  CheckSquare,
  Bell,
  MapPin,
  Home,
  ArrowRight,
  CheckCircle2,
  Trophy,
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
    icon: Globe,
    title: "Public Portal",
    desc: "Share a beautiful calendar page with parents. No login required. Just send the link.",
    color: "bg-orange-50 text-orange-500",
  },
  {
    icon: Lock,
    title: "Private Member View",
    desc: "Team members see more details — contact info, notes, locations. Control what's public vs. private.",
    color: "bg-slate-50 text-slate-500",
  },
  {
    icon: Rss,
    title: "Webcal / ICS Feeds",
    desc: "Parents subscribe in Google, Apple, or Outlook. Events auto-update when you make changes.",
    color: "bg-green-50 text-green-500",
  },
  {
    icon: Users,
    title: "Roster Management",
    desc: "Invite by email, SMS, or share link. Track who's joined. Manage roles (coach, parent, player).",
    color: "bg-blue-50 text-blue-500",
  },
  {
    icon: CalendarDays,
    title: "Bulk Scheduling",
    desc: "Add entire seasons at once. Recurring practices, game schedules, tournaments — all in minutes.",
    color: "bg-purple-50 text-purple-500",
  },
  {
    icon: CheckSquare,
    title: "RSVP & Attendance",
    desc: "Who's coming to practice? Who's driving to the away game? Track responses in one place.",
    color: "bg-teal-50 text-teal-500",
  },
  {
    icon: Bell,
    title: "Change Notifications",
    desc: "Practice moved? Game cancelled? Everyone gets notified instantly by email or push.",
    color: "bg-rose-50 text-rose-500",
  },
  {
    icon: MapPin,
    title: "Venue Management",
    desc: "Save locations with addresses and map links. Reuse them across events. Parents get directions.",
    color: "bg-amber-50 text-amber-500",
  },
  {
    icon: Home,
    title: "Family Integration",
    desc: "Team events flow into parents' family calendars. One view of all kid activities.",
    color: "bg-indigo-50 text-indigo-500",
  },
];

// ─── Calendar integrations ────────────────────────────────────────────────────

const INTEGRATIONS = [
  {
    name: "Google Calendar",
    desc: "Subscribe via URL. Events appear alongside work and family calendars.",
  },
  {
    name: "Apple Calendar",
    desc: "One-tap subscribe on iPhone. Syncs to Mac and iPad automatically.",
  },
  {
    name: "Outlook",
    desc: "Works with Outlook.com and desktop Outlook. Personal and work accounts.",
  },
  {
    name: "Any ICS-compatible app",
    desc: "Standard webcal feeds work everywhere. No proprietary lock-in.",
  },
];

// ─── Team types ───────────────────────────────────────────────────────────────

const TEAM_TYPES = [
  { emoji: "⚽", label: "Sports Teams", desc: "Soccer, baseball, basketball, hockey, swim..." },
  { emoji: "💃", label: "Dance & Music", desc: "Studios, recitals, competitions, lessons" },
  { emoji: "🏕️", label: "Scout Troops", desc: "Meetings, campouts, badge events" },
  { emoji: "🎭", label: "Clubs & Activities", desc: "Theater, robotics, academic teams" },
];

// ─── Sport tags ───────────────────────────────────────────────────────────────

const SPORT_TAGS = [
  "Youth Soccer",
  "Little League",
  "Swim Team",
  "Dance Studio",
  "Scout Troop",
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TeamsPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-start justify-center"
        >
          <div className="w-[800px] h-[500px] rounded-full bg-orange-200/20 blur-[120px] -translate-y-1/3" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div {...fa(0)}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-100 rounded-full px-3 py-1 mb-6">
              <Trophy className="w-3.5 h-3.5" />
              For Teams &amp; Groups
            </span>
          </motion.div>

          <motion.h1
            {...fa(0.1)}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-4"
          >
            One calendar.{" "}
            <span className="text-orange-500">Everyone in sync.</span>
          </motion.h1>

          <motion.p
            {...fa(0.2)}
            className="text-base text-slate-500 leading-relaxed max-w-xl mx-auto mb-10"
          >
            For sports teams, clubs, and groups that need everyone on the same
            page. Share schedules, track RSVPs, and keep parents informed.
          </motion.p>

          <motion.div
            {...fa(0.3)}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
          >
            <Link to="/login">
              <Button
                size="lg"
                className="gap-2 px-8 h-12 text-base rounded-2xl shadow-md shadow-orange-100 bg-orange-500 hover:bg-orange-600"
              >
                Create Your Team Calendar
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-base rounded-2xl border-slate-200 text-slate-600"
            >
              See All Features
            </Button>
          </motion.div>

          {/* Sport tags */}
          <motion.div
            {...fa(0.4)}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            {SPORT_TAGS.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium text-slate-500 bg-white border border-slate-100 rounded-full px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white" id="features">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fu(0)} className="text-center mb-14">
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-3">
              Stop the group text chaos
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything coaches and team managers need
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
              Get everyone on the same calendar. No more missed practices, last-minute texts, or confused parents.
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

      {/* ── 3 Steps ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fu(0)} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Get your team set up in 5 minutes
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto leading-relaxed">
              No technical knowledge needed. Just your team name and a schedule.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Create your team",
                desc: "Name it, add your logo, set your timezone. Done in 30 seconds.",
              },
              {
                step: "2",
                title: "Add your schedule",
                desc: "Enter events manually, paste from a spreadsheet, or import from another calendar.",
              },
              {
                step: "3",
                title: "Share with parents",
                desc: "Send the link. They subscribe. Everyone stays in sync automatically.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                {...fu(i * 0.12)}
                className="text-center p-6 rounded-3xl border border-slate-100 bg-white"
              >
                <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white text-sm font-bold flex items-center justify-center mx-auto mb-4">
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

      {/* ── Calendar integrations (dark) ──────────────────────────────────── */}
      <section className="bg-[#0f172a] py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fu(0)} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Works with every calendar app
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
              Standard ICS / webcal feeds mean parents add your schedule to the
              app they already use — and it stays updated automatically.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
            {INTEGRATIONS.map((item, i) => (
              <motion.div
                key={item.name}
                {...fu(i * 0.1)}
                className="flex gap-4 p-5 rounded-2xl bg-white/5 border border-white/8 hover:bg-white/8 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white mb-1">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div {...fu(0.3)} className="text-center">
            <div className="inline-flex items-center gap-4 text-2xl mb-4">
              <span>📱</span>
              <span>💻</span>
              <span>🖥️</span>
            </div>
            <p className="text-white font-semibold text-lg mb-1">
              One source of truth.
            </p>
            <p className="text-slate-400 text-sm">Every device stays in sync.</p>
          </motion.div>
        </div>
      </section>

      {/* ── Team types ────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fu(0)} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Built for groups like yours
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto leading-relaxed">
              Whether you have 10 kids or 200 families, KidSchedule scales to your group.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TEAM_TYPES.map((t, i) => (
              <motion.div
                key={t.label}
                {...fu(i * 0.08)}
                className="text-center p-6 rounded-3xl border border-slate-100 bg-slate-50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <span className="text-3xl mb-3 block">{t.emoji}</span>
                <h3 className="text-sm font-semibold text-slate-800 mb-1">
                  {t.label}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fu(0)}>
            <div className="w-14 h-14 rounded-3xl bg-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-100">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Stop the{" "}
              <span className="text-orange-500">"what time is practice?"</span>{" "}
              texts.
            </h2>
            <p className="text-slate-500 leading-relaxed mb-8 max-w-md mx-auto">
              Give your team one calendar that everyone can actually find and use.
            </p>
            <Link to="/login">
              <Button
                size="lg"
                className="px-10 text-base rounded-2xl shadow-lg shadow-orange-100 gap-2 bg-orange-500 hover:bg-orange-600"
              >
                Create Your Team Calendar Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <p className="text-xs text-slate-400 mt-4">
              Free for basic teams · Upgrade anytime
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
