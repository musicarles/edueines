import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { LockKeyhole, Menu, Plus, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { buttonClasses } from '../ui/Button'
import { Logo } from '../Logo'

const NAV_ITEMS = [
  { to: '/', label: 'Inici', end: true },
  { to: '/cataleg', label: 'Catàleg', end: false },
  { to: '/com-funciona', label: 'Com funciona', end: false },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#fbfaf7]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-18 lg:px-8">
        <Logo />

        <nav aria-label="Navegació principal" className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
                  isActive
                    ? 'bg-brand-50 text-brand-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-ink',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            to="/admin"
            className="inline-flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            aria-label="Àrea d'administració"
            title="Àrea d'administració"
          >
            <LockKeyhole className="size-4.5" aria-hidden="true" />
          </Link>
          <Link to="/proposa" className={buttonClasses('primary', 'md')}>
            <Plus className="size-4" aria-hidden="true" />
            Proposa una eina
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 lg:hidden"
          aria-expanded={open}
          aria-controls="menu-mobil"
          aria-label={open ? 'Tanca el menú' : 'Obre el menú'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div id="menu-mobil" className="border-t border-slate-200 bg-white px-4 pb-5 pt-3 lg:hidden">
          <nav aria-label="Navegació principal mòbil" className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-xl px-3 py-2.5 text-sm font-semibold',
                    isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-700 hover:bg-slate-50',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/admin"
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <LockKeyhole className="size-4" aria-hidden="true" />
              Administració
            </Link>
          </nav>
          <Link
            to="/proposa"
            className={buttonClasses('primary', 'md', 'mt-3 w-full')}
          >
            <Plus className="size-4" aria-hidden="true" />
            Proposa una eina
          </Link>
        </div>
      ) : null}
    </header>
  )
}
