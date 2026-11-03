import { Link } from 'react-router-dom'
import { ArrowLeft, Compass, Plus, Search } from 'lucide-react'
import { buttonClasses } from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:py-28">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Compass className="size-7" aria-hidden="true" />
      </span>
      <p className="mt-5 font-display text-sm font-bold uppercase tracking-widest text-brand-700">
        Error 404
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        No hem trobat aquesta pàgina
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600">
        Potser l’enllaç és incorrecte o la pàgina s’ha mogut. Pots tornar a l’inici, explorar el
        catàleg o proposar una eina que hi falta.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Link to="/" className={buttonClasses('primary', 'md')}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Torna a l’inici
        </Link>
        <Link to="/cataleg" className={buttonClasses('outline', 'md')}>
          <Search className="size-4" aria-hidden="true" />
          Explora el catàleg
        </Link>
        <Link to="/proposa" className={buttonClasses('ghost', 'md')}>
          <Plus className="size-4" aria-hidden="true" />
          Proposa una eina
        </Link>
      </div>
    </div>
  )
}
