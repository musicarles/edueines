import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ExternalLink,
  Flag,
  FolderTree,
  History,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../../lib/auth/AuthProvider'
import { ROLES } from '../../lib/constants'
import { can, type Permission } from '../../lib/permissions'
import { DATA_MODE } from '../../lib/env'
import { useCollection } from '../../lib/use-collection'
import type { Proposal } from '../../lib/types'
import { cn } from '../../lib/utils'
import { LogoMark } from '../../components/Logo'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  permission: Permission
  end?: boolean
  badge?: number
}

export default function AdminLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { items: proposals } = useCollection<Proposal>('proposals')

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const pendingProposals = proposals.filter((proposal) => proposal.status === 'pendent').length

  const navItems: NavItem[] = [
    { to: '/admin', label: 'Tauler', icon: LayoutDashboard, permission: 'tools.view', end: true },
    {
      to: '/admin/propostes',
      label: 'Propostes',
      icon: Inbox,
      permission: 'proposals.view',
      badge: pendingProposals,
    },
    { to: '/admin/eines', label: 'Eines', icon: Wrench, permission: 'tools.view' },
    {
      to: '/admin/categories',
      label: 'Categories',
      icon: FolderTree,
      permission: 'categories.manage',
    },
    { to: '/admin/avisos', label: 'Avisos', icon: Flag, permission: 'reports.manage' },
    { to: '/admin/usuaris', label: 'Usuaris', icon: Users, permission: 'users.manage' },
    { to: '/admin/historial', label: 'Historial', icon: History, permission: 'history.view' },
    {
      to: '/admin/configuracio',
      label: 'Configuració',
      icon: Settings,
      permission: 'settings.manage',
    },
  ]

  const visibleItems = navItems.filter((item) => can(user?.role, item.permission))

  async function handleSignOut() {
    await signOut()
    navigate('/admin/entrar', { replace: true })
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link to="/admin" className="inline-flex items-center gap-2.5">
          <LogoMark className="size-9" />
          <span className="font-display text-lg font-extrabold tracking-tight text-ink">
            Edueines
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Tanca el menú"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mx-4 rounded-xl border border-slate-200 bg-cream/70 p-3">
        <p className="truncate text-sm font-semibold text-ink">{user?.displayName}</p>
        <p className="truncate text-xs text-slate-500">{user?.email}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {user ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset',
                ROLES[user.role].badge,
              )}
            >
              <ShieldCheck className="size-3" aria-hidden="true" />
              {ROLES[user.role].label}
            </span>
          ) : null}
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
            {DATA_MODE === 'firebase' ? 'Firebase' : 'Local'}
          </span>
        </div>
      </div>

      <nav aria-label="Navegació d’administració" className="mt-4 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
                isActive
                  ? 'bg-brand-50 text-brand-900'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-ink',
              )
            }
          >
            <item.icon className="size-4.5 shrink-0" aria-hidden="true" />
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800">
                {item.badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-slate-200 p-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-ink"
        >
          <ExternalLink className="size-4.5" aria-hidden="true" />
          Veure el lloc públic
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
        >
          <LogOut className="size-4.5" aria-hidden="true" />
          Tanca la sessió
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:block">
        {sidebar}
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]"
            onClick={() => setMenuOpen(false)}
            aria-label="Tanca el menú"
          />
          <div className="relative h-full w-72 max-w-[85vw] border-r border-slate-200 bg-white shadow-xl">
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex size-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Obre el menú"
            aria-expanded={menuOpen}
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <p className="hidden text-sm font-semibold text-slate-500 lg:block">
            Panell d’administració
          </p>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/proposa"
              className="hidden rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 sm:inline-flex"
            >
              Nova proposta pública
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {user ? ROLES[user.role].label : ''}
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
