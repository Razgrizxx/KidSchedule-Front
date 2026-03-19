import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useAuthStore } from '@/store/authStore'
import { CaregiverDashboardView } from '@/pages/dashboard/CaregiverDashboardView'

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const appearance = useAuthStore((s) => s.appearance)
  const accessMode = useAuthStore((s) => s.accessMode)

  // Caregiver mode: bypass the full parent layout entirely
  if (accessMode === 'caregiver') {
    return <CaregiverDashboardView />
  }

  return (
    <div
      data-theme={appearance}
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--page-bg, #f8fafc)' }}
    >
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col lg:pl-60 min-w-0">
        <TopBar onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
