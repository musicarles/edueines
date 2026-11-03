import { Link } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-lg font-extrabold tracking-tight text-ink">
              Edueines
            </p>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-600">
              Un catàleg col·laboratiu per descobrir eines digitals amb avantatges per al
              professorat i mantenir-ne les condicions actualitzades.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold text-ink">Navegació</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <Link className="hover:text-brand-800 hover:underline" to="/">
                  Inici
                </Link>
              </li>
              <li>
                <Link className="hover:text-brand-800 hover:underline" to="/cataleg">
                  Catàleg d’eines
                </Link>
              </li>
              <li>
                <Link className="hover:text-brand-800 hover:underline" to="/com-funciona">
                  Com funciona la verificació
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold text-ink">Participa</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <Link className="hover:text-brand-800 hover:underline" to="/proposa">
                  Proposa una eina
                </Link>
              </li>
              <li>
                <Link className="hover:text-brand-800 hover:underline" to="/cataleg?estat=pendents">
                  Eines pendents de revisió
                </Link>
              </li>
              <li>
                <Link className="hover:text-brand-800 hover:underline" to="/cataleg?estat=verificades">
                  Eines verificades
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold text-ink">Administració</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <Link
                  className="inline-flex items-center gap-1.5 hover:text-brand-800 hover:underline"
                  to="/admin"
                >
                  <LockKeyhole className="size-3.5" aria-hidden="true" />
                  Accés restringit
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Edueines</p>
          <p>
            Les condicions de cada eina es verifiquen periòdicament. Consulta sempre la font
            oficial abans de contractar res.
          </p>
        </div>
      </div>
    </footer>
  )
}
