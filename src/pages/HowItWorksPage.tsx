import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { BENEFITS, BENEFIT_KEYS, TOOL_STATUSES } from '../lib/constants'
import { buttonClasses } from '../components/ui/Button'
import { BenefitIcon } from '../components/icons'

const STEPS = [
  {
    icon: Send,
    title: '1. Proposta',
    description:
      'Qualsevol persona pot proposar una eina sense crear cap compte. Cal indicar el nom, l’enllaç oficial, la descripció i com s’hi pot accedir.',
    detail: 'La proposta queda automàticament amb l’estat «Pendent de revisió».',
  },
  {
    icon: FileSearch,
    title: '2. Revisió',
    description:
      'L’equip administrador comprova que la proposta no estigui duplicada i que la informació sigui coherent. Si cal, es demana informació addicional.',
    detail: 'Es pot marcar «En revisió», fusionar amb una fitxa existent o rebutjar amb un motiu.',
  },
  {
    icon: ClipboardCheck,
    title: '3. Verificació',
    description:
      'Es consulta la font oficial: pàgina del pla educatiu, condicions d’accés, requisits de correu o verificació docent i límits del pla gratuït.',
    detail: 'La data de verificació i la font consultada queden registrades a l’historial.',
  },
  {
    icon: BadgeCheck,
    title: '4. Aprovació',
    description:
      'Si la informació es pot confirmar, la fitxa passa a «Verificada» i, si tot és correcte, es publica al catàleg.',
    detail: 'Cap dada es publica automàticament ni sense una verificació prèvia.',
  },
  {
    icon: CalendarClock,
    title: '5. Manteniment',
    description:
      'Cada sis mesos es revisen les condicions. Si la revisió venç, la fitxa es marca com a «Cal actualitzar» i s’indica clarament al catàleg.',
    detail: 'Qualsevol persona pot avisar d’un canvi des de la fitxa de l’eina.',
  },
]

const FAQ = [
  {
    question: 'Totes les eines del catàleg són gratuïtes?',
    answer:
      'No. El catàleg distingeix cinc tipus d’avantatge: versió premium gratuïta per a docents, llicència educativa gratuïta, pla gratuït amb funcions limitades, descompte especial i altres avantatges. Cada fitxa explica quines condicions cal complir i quins límits té l’oferta.',
  },
  {
    question: 'Per què algunes fitxes diuen «Cal actualitzar»?',
    answer:
      'Vol dir que la darrera verificació fa més de sis mesos. La fitxa continua visible perquè pot ser útil, però les condicions poden haver canviat. Sempre recomanem consultar la font oficial enllaçada.',
  },
  {
    question: 'Quant triga a publicar-se una proposta?',
    answer:
      'Depèn de la informació disponible. Si la font oficial és clara, la revisió pot ser ràpida. Si no es pot confirmar l’avantatge o el mètode d’accés, la proposta no es publica i es pot quedar pendent o ser rebutjada.',
  },
  {
    question: 'Es pot proposar una eina que ja existeix al catàleg?',
    answer:
      'El sistema ho detecta pel nom i pel domini web. Si una eina ja existeix, la proposta es bloqueja i s’indica la fitxa existent. Si el que vols és actualitzar dades, fes servir el botó «Aquesta informació ha canviat» de la fitxa.',
  },
  {
    question: 'Qui pot accedir a l’àrea d’administració?',
    answer:
      'Només els comptes autoritzats. Hi ha quatre rols: superadministrador, administrador, editor i consultor. Els permisos es comproven a la interfície i, en el mode Firebase, també a les regles de Firestore.',
  },
  {
    question: 'Es guarden les dades si tanco el navegador?',
    answer:
      'Sí. En el mode local, les dades es desen a IndexedDB del navegador. En el mode Firebase, es desen a Firestore i estan disponibles des de qualsevol dispositiu. El mode utilitzat es pot consultar a la configuració.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <nav aria-label="Fil d’Ariadna" className="text-sm text-slate-500">
        <Link to="/" className="hover:text-brand-800 hover:underline">
          Inici
        </Link>{' '}
        <span aria-hidden="true">/</span>{' '}
        <span className="font-medium text-slate-700">Com funciona</span>
      </nav>

      <header className="mt-4 max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-800">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Procés de verificació
        </span>
        <h1 className="mt-4 text-balance font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Com funciona Edueines
        </h1>
        <p className="mt-3 text-pretty text-base leading-relaxed text-slate-600">
          Edueines és un catàleg col·laboratiu, però no una llista oberta sense control. Cada
          fitxa segueix un circuit de proposta, revisió, verificació, aprovació i publicació.
          L’objectiu és que la informació sigui útil i fiable, no només abundant.
        </p>
      </header>

      <section aria-labelledby="circuit" className="mt-10">
        <h2 id="circuit" className="font-display text-2xl font-extrabold text-ink">
          El circuit d’una fitxa
        </h2>
        <ol className="mt-5 space-y-4">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="relative flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col items-center">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                {index < STEPS.length - 1 ? (
                  <span className="mt-2 hidden w-px flex-1 bg-slate-200 sm:block" aria-hidden="true" />
                ) : null}
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-ink">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.description}</p>
                <p className="mt-2 inline-flex items-start gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                  {step.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="estats" className="mt-10">
        <h2 id="estats" className="font-display text-2xl font-extrabold text-ink">
          Què vol dir cada estat
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {Object.entries(TOOL_STATUSES).map(([key, info]) => (
            <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${info.badge}`}
              >
                <span className={`size-1.5 rounded-full ${info.dot}`} aria-hidden="true" />
                {info.label}
              </span>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{info.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p className="leading-relaxed">
            No publiquem cap fitxa només perquè una font secundària ho asseguri. Si no es pot
            confirmar l’avantatge a la pàgina oficial, la informació es marca com a no
            verificada o la proposta es rebutja.
          </p>
        </div>
      </section>

      <section aria-labelledby="tipus" className="mt-10">
        <h2 id="tipus" className="font-display text-2xl font-extrabold text-ink">
          Tipus d’avantatge
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          La diferència entre «gratuït» i «pla gratuït limitat» és important. Cada categoria
          té un significat concret.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {BENEFIT_KEYS.map((key) => {
            const benefit = BENEFITS[key]
            return (
              <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${benefit.badge}`}
                >
                  <BenefitIcon name={benefit.icon} className="size-3.5" />
                  {benefit.label}
                </span>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {benefit.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="preguntes" className="mt-10">
        <h2 id="preguntes" className="font-display text-2xl font-extrabold text-ink">
          Preguntes freqüents
        </h2>
        <div className="mt-4 space-y-2">
          {FAQ.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-ink">
                {item.question}
                <span className="text-slate-400 transition group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-brand-200 bg-brand-800 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-extrabold text-white">
              Tens una eina per proposar?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-50">
              No cal cap compte. Amb el nom, l’enllaç oficial i una breu explicació ja podem
              començar la revisió.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/proposa"
              className={buttonClasses('outline', 'md', 'border-white/30 bg-white text-brand-900 hover:bg-brand-50')}
            >
              <Plus className="size-4" aria-hidden="true" />
              Proposa una eina
            </Link>
            <Link
              to="/cataleg"
              className={buttonClasses('ghost', 'md', 'text-white hover:bg-white/10')}
            >
              Explora el catàleg
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <XCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Edueines no rep cap compensació de les eines que apareixen al catàleg. Els enllaços són
        sempre oficials i no inclouen paràmetres d’afiliació.
      </p>
    </div>
  )
}
