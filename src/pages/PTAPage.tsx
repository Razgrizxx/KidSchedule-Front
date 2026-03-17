import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Layers,
  Megaphone,
  MessageCircle,
  CalendarDays,
  UserCheck,
  Bell,
  Smartphone,
  Lock,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  TrendingUp,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    icon: Users,
    title: "Member Directory",
    desc: "Searchable directory with parent profiles, contact info, and children details. Know your community.",
    color: "bg-blue-50 text-blue-500",
  },
  {
    icon: Layers,
    title: "Committees & Groups",
    desc: "Organize volunteers into committees with roles, leads, and dedicated communication channels.",
    color: "bg-purple-50 text-purple-500",
  },
  {
    icon: Megaphone,
    title: "Announcements",
    desc: "Send beautiful announcements to your entire membership or specific groups with one click.",
    color: "bg-amber-50 text-amber-500",
  },
  {
    icon: MessageCircle,
    title: "In-App Messaging",
    desc: "Direct messaging between members. No need to share personal phone numbers or emails.",
    color: "bg-teal-50 text-teal-500",
  },
  {
    icon: CalendarDays,
    title: "Event Management",
    desc: "Create events, track RSVPs, send reminders, and coordinate volunteers all in one place.",
    color: "bg-indigo-50 text-indigo-500",
  },
  {
    icon: UserCheck,
    title: "Member Approvals",
    desc: "Control who joins your PTA with approval workflows. Verify parents belong to your school.",
    color: "bg-green-50 text-green-500",
  },
  {
    icon: Bell,
    title: "Push Notifications",
    desc: "Instant notifications for announcements, messages, and events. Parents never miss important updates.",
    color: "bg-rose-50 text-rose-500",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    desc: "Works beautifully on phones, tablets, and desktops. Manage your PTA from anywhere.",
    color: "bg-cyan-50 text-cyan-500",
  },
  {
    icon: Lock,
    title: "Privacy & Security",
    desc: "Your member data stays private. Role-based access controls keep sensitive info protected.",
    color: "bg-slate-50 text-slate-500",
  },
];

// ─── Why PTAs love it ─────────────────────────────────────────────────────────

const BENEFITS = [
  {
    icon: Layers,
    title: "Stop juggling spreadsheets",
    desc: "All your member data, committees, and communications in one organized place.",
  },
  {
    icon: TrendingUp,
    title: "Increase parent engagement",
    desc: "Easy-to-use app means more parents actually participate and stay informed.",
  },
  {
    icon: Clock,
    title: "Save volunteer hours",
    desc: "Automate repetitive tasks like reminders, sign-ups, and member onboarding.",
  },
  {
    icon: RefreshCw,
    title: "Year-over-year continuity",
    desc: "New board members inherit organized history, not chaos. Easy transitions.",
  },
];

// ─── Stats ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "75%", label: "Less time on admin tasks" },
  { value: "3×", label: "More parent participation" },
  { value: "100%", label: "Free for PTAs" },
];

// ─── Email capture ────────────────────────────────────────────────────────────

function EmailCapture({
  label = "Get Early Access",
  size = "default",
}: {
  label?: string;
  size?: "default" | "lg";
}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-teal-600 font-medium">
        <CheckCircle2 className="w-5 h-5" />
        You're on the list! We'll be in touch.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex gap-2 ${size === "lg" ? "flex-col sm:flex-row" : ""}`}
    >
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={`${size === "lg" ? "h-12 text-base sm:w-72" : "w-56"} rounded-xl border-slate-200`}
      />
      <Button
        type="submit"
        className={`${size === "lg" ? "h-12 text-base rounded-xl px-8" : "rounded-xl"} gap-2 shrink-0`}
      >
        {label}
        <ArrowRight className="w-4 h-4" />
      </Button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PTAPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-start justify-center"
        >
          <div className="w-[800px] h-[500px] rounded-full bg-blue-200/20 blur-[120px] -translate-y-1/3" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div {...fa(0)}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-6">
              <GraduationCap className="w-3.5 h-3.5" />
              Now Available
            </span>
          </motion.div>

          <motion.h1
            {...fa(0.1)}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-4"
          >
            The complete <span className="text-blue-500">PTA platform.</span>
          </motion.h1>

          <motion.p
            {...fa(0.15)}
            className="text-lg sm:text-xl font-semibold text-slate-700 mb-4"
          >
            Everything your PTA needs in one place.
          </motion.p>

          <motion.p
            {...fa(0.2)}
            className="text-base text-slate-500 leading-relaxed max-w-xl mx-auto mb-10"
          >
            Member management, committees, announcements, messaging, and events
            — designed for busy parent volunteers.
          </motion.p>

          <motion.div {...fa(0.3)} className="flex justify-center">
            <EmailCapture label="Get Early Access" size="lg" />
          </motion.div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white" id="features">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fu(0)} className="text-center mb-14">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-3">
              Built by parents who understand the challenges
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything your PTA needs
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
              One platform that replaces the spreadsheets, group chats, and
              email chains your PTA runs on today.
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

      {/* ── Why PTAs love it ──────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fu(0)} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Why PTAs love KidSchedule
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
              From small school fundraisers to large district events — PTAs of
              every size see results fast.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-16">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                {...fu(i * 0.1)}
                className="flex gap-4 p-6 rounded-3xl bg-white border border-slate-100 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                  <b.icon className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <h3 className="text-sm font-semibold text-slate-800">
                      {b.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed pl-6">
                    {b.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats bar */}
          <motion.div
            {...fu(0.2)}
            className="grid grid-cols-3 divide-x divide-slate-100 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
          >
            {STATS.map((s) => (
              <div key={s.label} className="py-8 text-center px-4">
                <p className="text-3xl sm:text-4xl font-extrabold text-blue-500 mb-1">
                  {s.value}
                </p>
                <p className="text-xs text-slate-400 leading-snug">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works (3 steps) ────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fu(0)} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Up and running in minutes
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto leading-relaxed">
              No IT department needed. If you can send an email, you can run
              your PTA on KidSchedule.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Create your PTA",
                desc: `Set up your school's PTA in minutes. Add your name, school, and basic details.`,
              },
              {
                step: "02",
                title: "Invite members",
                desc: "Share a link or import from a spreadsheet. Members join with one tap.",
              },
              {
                step: "03",
                title: "Start communicating",
                desc: "Send your first announcement, create a committee, or schedule an event.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                {...fu(i * 0.12)}
                className="relative text-center p-6 rounded-3xl border border-slate-100 bg-slate-50"
              >
                <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white text-sm font-bold flex items-center justify-center mx-auto mb-4">
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
      <section className="py-24 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fu(0)}>
            <div className="w-14 h-14 rounded-3xl bg-blue-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Ready to modernize
              <br />
              <span className="text-blue-500">your PTA?</span>
            </h2>
            <p className="text-slate-500 leading-relaxed mb-8 max-w-md mx-auto">
              Join hundreds of PTAs already using KidSchedule to engage their
              parent community.
            </p>
            <div className="flex justify-center mb-4">
              <EmailCapture label="Get Started Free" size="lg" />
            </div>
            <p className="text-xs text-slate-400">
              Always free for PTAs · No credit card · Set up in minutes
            </p>

            <div className="mt-10 pt-8 border-t border-slate-100">
              <p className="text-sm text-slate-500 mb-4">
                Already have a KidSchedule account?
              </p>
              <Link to="/login">
                <Button
                  variant="outline"
                  className="rounded-xl border-slate-200 text-slate-600"
                >
                  Log in to your dashboard
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
