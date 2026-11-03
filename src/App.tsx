import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from './components/layout/AppShell'
import { RequireStaff } from './components/RequireStaff'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingScreen } from './components/ui/Feedback'

const HomePage = lazy(() => import('./pages/HomePage'))
const CatalogPage = lazy(() => import('./pages/CatalogPage'))
const ToolDetailPage = lazy(() => import('./pages/ToolDetailPage'))
const ProposePage = lazy(() => import('./pages/ProposePage'))
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminProposalsPage = lazy(() => import('./pages/admin/AdminProposalsPage'))
const AdminProposalDetailPage = lazy(
  () => import('./pages/admin/AdminProposalDetailPage'),
)
const AdminToolsPage = lazy(() => import('./pages/admin/AdminToolsPage'))
const AdminToolEditorPage = lazy(() => import('./pages/admin/AdminToolEditorPage'))
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage'))
const AdminHistoryPage = lazy(() => import('./pages/admin/AdminHistoryPage'))
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'))

export function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="cataleg" element={<CatalogPage />} />
            <Route path="eines/:slug" element={<ToolDetailPage />} />
            <Route path="proposa" element={<ProposePage />} />
            <Route path="com-funciona" element={<HowItWorksPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="/admin/entrar" element={<AdminLoginPage />} />
          <Route element={<RequireStaff />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="propostes" element={<AdminProposalsPage />} />
              <Route path="propostes/:id" element={<AdminProposalDetailPage />} />
              <Route path="eines" element={<AdminToolsPage />} />
              <Route path="eines/nova" element={<AdminToolEditorPage />} />
              <Route path="eines/:id" element={<AdminToolEditorPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="usuaris" element={<AdminUsersPage />} />
              <Route path="avisos" element={<AdminReportsPage />} />
              <Route path="historial" element={<AdminHistoryPage />} />
              <Route path="configuracio" element={<AdminSettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>

      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: { fontFamily: 'var(--font-sans)' },
        }}
      />
    </ErrorBoundary>
  )
}
