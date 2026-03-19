import { CalendarDays, Calendar, CalendarRange, Clock, List } from 'lucide-react'
import { useCalendarStore, type ViewMode } from '@/store/calendarStore'

const VIEWS: { mode: ViewMode; icon: React.ElementType; label: string }[] = [
  { mode: 'year',  icon: CalendarDays,  label: 'Year'  },
  { mode: 'month', icon: Calendar,      label: 'Month' },
  { mode: 'week',  icon: CalendarRange, label: 'Week'  },
  { mode: 'day',   icon: Clock,         label: 'Day'   },
  { mode: 'list',  icon: List,          label: 'List'  },
]

export function ViewSelector() {
  const { viewMode, setViewMode } = useCalendarStore()

  return (
    <div className="flex gap-0.5 p-1 bg-slate-100 rounded-xl">
      {VIEWS.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            viewMode === mode
              ? 'bg-white shadow-sm text-slate-800'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
