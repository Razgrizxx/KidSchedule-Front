import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { DashboardLayout } from './components/dashboard/DashboardLayout'
import { DashboardHome } from './pages/dashboard/DashboardHome'
import { CalendarPage } from './pages/dashboard/CalendarPage'
import { MessagesPage } from './pages/dashboard/MessagesPage'
import { ExpensesPage } from './pages/dashboard/ExpensesPage'
import { RequestsPage } from './pages/dashboard/RequestsPage'
import { MomentsPage } from './pages/dashboard/MomentsPage'
import { MediationPage } from './pages/dashboard/MediationPage'
import { OrganizationsPage } from './pages/dashboard/OrganizationsPage'
import { SettingsPage } from './pages/dashboard/SettingsPage'
import { FamilyPage } from './pages/dashboard/FamilyPage'
import { CoParentsPage } from './pages/CoParentsPage'
import { PTAPage } from './pages/PTAPage'
import { TeamsPage } from './pages/TeamsPage'
import { FamiliesPage } from './pages/FamiliesPage'
import { BlogListPage } from './pages/BlogListPage'
import { BlogDetailPage } from './pages/BlogDetailPage'
import { JoinPage } from './pages/JoinPage'
import { CaregiverAccessPage } from './pages/CaregiverAccessPage'
import { PublicOrgCalendarPage } from './pages/PublicOrgCalendarPage'
import { PricingPage } from './pages/PricingPage'
import { Toaster } from './components/ui/toaster'
import { useAuthStore } from './store/authStore'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const accessMode = useAuthStore((s) => s.accessMode)
  if (!token && accessMode !== 'caregiver') return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="moments" element={<MomentsPage />} />
            <Route path="mediation" element={<MediationPage />} />
            <Route path="family" element={<FamilyPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="organizations/:id" element={<OrganizationsPage />} />
          </Route>
          <Route path="/co-parents" element={<CoParentsPage />} />
          <Route path="/pta" element={<PTAPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/families" element={<FamiliesPage />} />
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/:slug" element={<BlogDetailPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/caregiver-access" element={<CaregiverAccessPage />} />
          <Route path="/org/:id/calendar" element={<PublicOrgCalendarPage />} />
        </Routes>
        <Toaster />
      </div>
    </HashRouter>
  )
}

export default App
