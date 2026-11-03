import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fbfaf7]">
      <ScrollToTop />
      <a
        href="#contingut"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Salta al contingut
      </a>
      <Header />
      <main id="contingut" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
