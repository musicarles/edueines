import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Info,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useData } from '../lib/data-context'
import { BENEFITS, BENEFIT_KEYS, LEVELS } from '../lib/constants'
import { parseProposalForm, type FieldErrors, type ProposalInput } from '../lib/schemas'
import { ensurePublicWriteAccess } from '../lib/public-access'
import { createProposal, DuplicateError } from '../lib/proposals'
import { findToolDuplicate } from '../lib/duplicates'
import { isPublicTool } from '../lib/catalog'
import { cn } from '../lib/utils'
import { buttonClasses } from '../components/ui/Button'
import { Field, FormSection, Select, Textarea, TextInput, CheckboxCard } from '../components/ui/Field'
import { BenefitIcon } from '../components/icons'
import type { BenefitType, Proposal } from '../lib/types'

const DRAFT_KEY = 'edueines:proposal-draft'
const START_KEY = 'edueines:proposal-start'
const MIN_FILL_MS = 4000

type YesNo = 'si' | 'no' | 'no-ho-se'

interface DraftState {
  name: string
  officialUrl: string
  description: string
  categoryId: string
  benefitType: BenefitType | ''
  accessMethod: string
  requiresInstitutionalEmail: YesNo
  requiresTeacherVerification: YesNo
  levels: string[]
  proposerName: string
  proposerEmail: string
  observations: string
}

const EMPTY_DRAFT: DraftState = {
  name: '',
  officialUrl: '',
  description: '',
  categoryId: '',
  benefitType: '',
  accessMethod: '',
  requiresInstitutionalEmail: 'no-ho-se',
  requiresTeacherVerification: 'no-ho-se',
  levels: [],
  proposerName: '',
  proposerEmail: '',
  observations: '',
}

function readDraft(): DraftState | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<DraftState>
    return { ...EMPTY_DRAFT, ...parsed, levels: parsed.levels ?? [] }
  } catch {
    return null
  }
}

function saveDraft(draft: DraftState) {
  try {
    const isEmpty =
      !draft.name &&
      !draft.officialUrl &&
      !draft.description &&
      !draft.accessMethod &&
      !draft.proposerName &&
      !draft.proposerEmail &&
      !draft.observations
    if (isEmpty) {
      window.localStorage.removeItem(DRAFT_KEY)
      return
    }
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...draft, savedAt: new Date().toISOString() }),
    )
  } catch {
    // L'auto-desament és una comoditat: si el navegador el bloqueja, no aturem el formulari.
  }
}

export default function ProposePage() {
  const { tools, categories, loading } = useData()
  const [searchParams] = useSearchParams()
  const initialCategory = searchParams.get('categoria') ?? ''
  const restored = useRef(false)
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT)
  const [draftRestored, setDraftRestored] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null)
  const [duplicateToolSlug, setDuplicateToolSlug] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<Proposal | null>(null)
  const [honeypot, setHoneypot] = useState('')

  useEffect(() => {
    if (restored.current) return
    restored.current = true
    const saved = readDraft()
    if (saved) {
      setDraft(saved)
      setDraftRestored(true)
    } else if (initialCategory) {
      setDraft((current) => ({ ...current, categoryId: initialCategory }))
    }
    if (!window.sessionStorage.getItem(START_KEY)) {
      window.sessionStorage.setItem(START_KEY, String(Date.now()))
    }
  }, [initialCategory])

  useEffect(() => {
    if (created) return
    saveDraft(draft)
  }, [draft, created])

  const activeCategories = useMemo(
    () => categories.filter((category) => category.active),
    [categories],
  )

  const obviousDuplicate = useMemo(() => {
    if (draft.name.trim().length < 3 || draft.officialUrl.trim().length < 4) return null
    const check = findToolDuplicate(tools, draft.name, draft.officialUrl)
    if (!check.duplicate) return null
    const tool = tools.find((item) => item.id === check.matchId)
    return { check, slug: tool && isPublicTool(tool) ? tool.slug : null }
  }, [draft.name, draft.officialUrl, tools])

  function update<K extends keyof DraftState>(key: K, value: DraftState[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
    setDuplicateMessage(null)
    setDuplicateToolSlug(null)
  }

  function toggleLevel(level: string, checked: boolean) {
    update(
      'levels',
      checked
        ? [...draft.levels, level]
        : draft.levels.filter((item) => item !== level),
    )
  }

  function clearDraft() {
    setDraft(EMPTY_DRAFT)
    setDraftRestored(false)
    setErrors({})
    window.localStorage.removeItem(DRAFT_KEY)
    toast.success('S’ha descartat l’esborrany desat.')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (honeypot) return

    const startedAt = Number(window.sessionStorage.getItem(START_KEY) ?? 0)
    if (startedAt && Date.now() - startedAt < MIN_FILL_MS) {
      setErrors({
        form: 'Espera uns segons abans d’enviar el formulari. Així evitem enviaments automàtics.',
      })
      return
    }

    const formData = new FormData()
    formData.set('name', draft.name)
    formData.set('officialUrl', draft.officialUrl)
    formData.set('description', draft.description)
    formData.set('categoryId', draft.categoryId)
    formData.set('benefitType', draft.benefitType)
    formData.set('accessMethod', draft.accessMethod)
    formData.set('requiresInstitutionalEmail', draft.requiresInstitutionalEmail)
    formData.set('requiresTeacherVerification', draft.requiresTeacherVerification)
    for (const level of draft.levels) formData.append('levels', level)
    formData.set('proposerName', draft.proposerName)
    formData.set('proposerEmail', draft.proposerEmail)
    formData.set('observations', draft.observations)

    const parsed = parseProposalForm(formData)
    if (!parsed.ok) {
      setErrors(parsed.errors)
      const first = document.querySelector<HTMLElement>('[aria-invalid="true"]')
      first?.focus()
      toast.error('Revisa els camps marcats abans d’enviar la proposta.')
      return
    }

    setErrors({})
    setSubmitting(true)
    try {
      await ensurePublicWriteAccess()
      const proposal = await createProposal(parsed.data as ProposalInput)
      setCreated(proposal)
      setDraft(EMPTY_DRAFT)
      window.localStorage.removeItem(DRAFT_KEY)
      window.sessionStorage.removeItem(START_KEY)
      toast.success('Proposta enviada. Gràcies per col·laborar!')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (caught) {
      if (caught instanceof DuplicateError) {
        setDuplicateMessage(caught.message)
        setDuplicateToolSlug(caught.check.matchId ? findSlug(caught.check.matchId) : null)
        toast.error('Aquesta eina ja consta al sistema.')
      } else {
        toast.error(
          caught instanceof Error
            ? caught.message
            : 'No s’ha pogut enviar la proposta. Torna-ho a provar.',
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  function findSlug(toolId: string): string | null {
    const tool = tools.find((item) => item.id === toolId)
    return tool && isPublicTool(tool) ? tool.slug : null
  }

  if (created) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="rounded-3xl border border-emerald-200 bg-white p-7 text-center shadow-sm sm:p-10">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-extrabold text-ink sm:text-3xl">
            Proposta rebuda
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            Gràcies per ajudar a fer créixer el catàleg. La proposta «{created.name}» queda amb
            l’estat <strong className="font-semibold text-amber-800">Pendent de revisió</strong>.
            L’equip administrador en verificarà les condicions abans de publicar-la. No es
            publica res automàticament.
          </p>
          <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-slate-200 bg-cream p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Referència de la proposta
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink">
              {created.reference}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Guarda aquesta referència si necessites fer-ne seguiment.
            </p>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Link to="/cataleg" className={buttonClasses('primary', 'md')}>
              Torna al catàleg
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreated(null)
                window.sessionStorage.setItem(START_KEY, String(Date.now()))
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className={buttonClasses('outline', 'md')}
            >
              <Plus className="size-4" aria-hidden="true" />
              Proposa una altra eina
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <nav aria-label="Fil d’Ariadna" className="text-sm text-slate-500">
        <Link to="/" className="hover:text-brand-800 hover:underline">
          Inici
        </Link>{' '}
        <span aria-hidden="true">/</span>{' '}
        <span className="font-medium text-slate-700">Proposa una eina</span>
      </nav>

      <header className="mt-4 max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-800">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          No cal crear cap compte
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Proposa una eina
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
          Explica’ns quina eina vols afegir i quin avantatge ofereix al professorat. Revisarem
          la informació a la font oficial abans de publicar-la. Els camps amb asterisc són
          obligatoris.
        </p>
        <ul className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
          <li className="flex items-start gap-2">
            <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
            Es desa automàticament mentre escrius
          </li>
          <li className="flex items-start gap-2">
            <Clock3 className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden="true" />
            Estat inicial: Pendent de revisió
          </li>
          <li className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0 text-sky-600" aria-hidden="true" />
            Evitem eines duplicades
          </li>
        </ul>
      </header>

      {draftRestored ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          <p className="inline-flex items-center gap-2">
            <Info className="size-4 shrink-0" aria-hidden="true" />
            Hem recuperat l’esborrany que vas començar.
          </p>
          <button
            type="button"
            onClick={clearDraft}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold hover:bg-sky-100"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Descarta l’esborrany
          </button>
        </div>
      ) : null}

      {duplicateMessage ? (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Aquesta eina ja existeix</p>
            <p className="mt-0.5 leading-relaxed">{duplicateMessage}</p>
            {duplicateToolSlug ? (
              <Link
                to={`/eines/${duplicateToolSlug}`}
                className="mt-2 inline-flex items-center gap-1.5 font-semibold underline"
              >
                Consulta la fitxa existent
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {obviousDuplicate && !duplicateMessage ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <Info className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
          <p>
            {obviousDuplicate.check.label}{' '}
            {obviousDuplicate.slug ? (
              <Link to={`/eines/${obviousDuplicate.slug}`} className="font-semibold text-brand-800 underline">
                Consulta’n la fitxa
              </Link>
            ) : (
              'Si creus que és un error, explica-ho a les observacions.'
            )}
          </p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="website">No omplis aquest camp</label>
          <input
            id="website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />
        </div>

        <FormSection
          step="1"
          title="Quina eina proposes?"
          description="Indica el nom comercial i l’adreça oficial. No fem servir enllaços d’afiliació."
        >
          <Field
            id="name"
            label="Nom de l’eina"
            required
            error={errors.name}
            hint="Per exemple: Canva Education, NotebookLM o Kahoot!."
          >
            <TextInput
              id="name"
              name="name"
              value={draft.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="Nom de l’eina"
              autoComplete="off"
              invalid={Boolean(errors.name)}
              maxLength={120}
              required
            />
          </Field>

          <Field
            id="officialUrl"
            label="URL oficial"
            required
            error={errors.officialUrl}
            hint="L’adreça de la pàgina oficial de l’eina o de l’oferta educativa."
          >
            <TextInput
              id="officialUrl"
              name="officialUrl"
              type="url"
              inputMode="url"
              value={draft.officialUrl}
              onChange={(event) => update('officialUrl', event.target.value)}
              placeholder="https://exemple.cat/educacio"
              invalid={Boolean(errors.officialUrl)}
              required
            />
          </Field>

          <Field
            id="description"
            label="Descripció i utilitat educativa"
            required
            error={errors.description}
            hint="Què fa l’eina i com pot ajudar el professorat o l’alumnat? Mínim 20 caràcters."
          >
            <Textarea
              id="description"
              name="description"
              rows={5}
              value={draft.description}
              onChange={(event) => update('description', event.target.value)}
              placeholder="Descriu l’eina i posa exemples d’ús a l’aula…"
              invalid={Boolean(errors.description)}
              maxLength={3000}
              required
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="categoryId" label="Categoria" required error={errors.categoryId}>
              <Select
                id="categoryId"
                name="categoryId"
                value={draft.categoryId}
                onChange={(event) => update('categoryId', event.target.value)}
                invalid={Boolean(errors.categoryId)}
                required
              >
                <option value="">Tria una categoria…</option>
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              id="benefitType"
              label="Tipus d’avantatge"
              required
              error={errors.benefitType}
              hint="Tria l’opció que descriu millor l’oferta educativa."
            >
              <Select
                id="benefitType"
                name="benefitType"
                value={draft.benefitType}
                onChange={(event) => update('benefitType', event.target.value as BenefitType)}
                invalid={Boolean(errors.benefitType)}
                required
              >
                <option value="">Tria un avantatge…</option>
                {BENEFIT_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {BENEFITS[key].label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </FormSection>

        <FormSection
          step="2"
          title="Com s’hi pot accedir?"
          description="Aquesta informació és clau: hi ha eines gratuïtes, però també n’hi ha que només ofereixen un pla limitat o un descompte."
        >
          <Field
            id="accessMethod"
            label="Mètode d’accés"
            required
            error={errors.accessMethod}
            hint="Per exemple: registre amb correu del centre, sol·licitud d’una llicència educativa o compte gratuït."
          >
            <Textarea
              id="accessMethod"
              name="accessMethod"
              rows={4}
              value={draft.accessMethod}
              onChange={(event) => update('accessMethod', event.target.value)}
              placeholder="Explica com es pot obtenir l’accés i quins requisits hi ha…"
              invalid={Boolean(errors.accessMethod)}
              maxLength={1500}
              required
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="requiresInstitutionalEmail"
              label="Cal correu institucional?"
              error={errors.requiresInstitutionalEmail}
            >
              <Select
                id="requiresInstitutionalEmail"
                name="requiresInstitutionalEmail"
                value={draft.requiresInstitutionalEmail}
                onChange={(event) =>
                  update('requiresInstitutionalEmail', event.target.value as YesNo)
                }
              >
                <option value="no-ho-se">No ho sé</option>
                <option value="si">Sí, cal correu del centre</option>
                <option value="no">No cal</option>
              </Select>
            </Field>

            <Field
              id="requiresTeacherVerification"
              label="Cal verificar la condició de docent?"
              error={errors.requiresTeacherVerification}
            >
              <Select
                id="requiresTeacherVerification"
                name="requiresTeacherVerification"
                value={draft.requiresTeacherVerification}
                onChange={(event) =>
                  update('requiresTeacherVerification', event.target.value as YesNo)
                }
              >
                <option value="no-ho-se">No ho sé</option>
                <option value="si">Sí, cal acreditar-ho</option>
                <option value="no">No cal</option>
              </Select>
            </Field>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-ink">
              Nivells educatius <span className="text-rose-600">*</span>
            </legend>
            <p className="mt-1 text-xs text-slate-500">
              Selecciona tots els nivells en què l’eina és adequada.
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {LEVELS.map((level) => (
                <CheckboxCard
                  key={level.value}
                  id={`level-${level.value}`}
                  name="levels"
                  value={level.value}
                  label={level.label}
                  checked={draft.levels.includes(level.value)}
                  onChange={(checked) => toggleLevel(level.value, checked)}
                />
              ))}
            </div>
            {errors.levels ? (
              <p role="alert" className="mt-2 text-xs font-medium text-rose-700">
                {errors.levels}
              </p>
            ) : null}
          </fieldset>
        </FormSection>

        <FormSection
          step="3"
          title="Qui ho proposa?"
          description="Aquestes dades són opcionals. Només les farem servir per contactar-te si cal confirmar algun detall."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="proposerName" label="El teu nom" optional error={errors.proposerName}>
              <TextInput
                id="proposerName"
                name="proposerName"
                value={draft.proposerName}
                onChange={(event) => update('proposerName', event.target.value)}
                placeholder="Nom i cognoms"
                autoComplete="name"
                maxLength={120}
              />
            </Field>
            <Field
              id="proposerEmail"
              label="Correu electrònic"
              optional
              error={errors.proposerEmail}
              hint="No el publicarem mai."
            >
              <TextInput
                id="proposerEmail"
                name="proposerEmail"
                type="email"
                value={draft.proposerEmail}
                onChange={(event) => update('proposerEmail', event.target.value)}
                placeholder="nom@centre.cat"
                autoComplete="email"
                invalid={Boolean(errors.proposerEmail)}
              />
            </Field>
          </div>

          <Field
            id="observations"
            label="Observacions"
            optional
            error={errors.observations}
            hint="Qualsevol detall que ens ajudi a revisar la proposta: canvis recents, condicions especials, etc."
          >
            <Textarea
              id="observations"
              name="observations"
              rows={4}
              value={draft.observations}
              onChange={(event) => update('observations', event.target.value)}
              placeholder="Altres comentaris…"
              maxLength={2000}
            />
          </Field>
        </FormSection>

        {errors.form ? (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {errors.form}
          </p>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              required
              className="mt-0.5 size-4 rounded border-slate-300 accent-brand-700"
            />
            <span>
              Confirmo que la informació és correcta segons el que conec i que no incloc dades
              personals de terceres persones. Entenc que la proposta no es publicarà
              automàticament.
            </span>
          </label>

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-slate-500">
              Revisarem la font oficial abans de publicar la fitxa. Si no es pot verificar, la
              proposta no s’aprovarà.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={clearDraft}
                disabled={submitting}
                className={buttonClasses('ghost', 'md')}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Neteja
              </button>
              <button
                type="submit"
                disabled={submitting || loading}
                className={cn(buttonClasses('primary', 'md'), 'min-w-44')}
              >
                <Send className="size-4" aria-hidden="true" />
                {submitting ? 'Enviant…' : 'Envia la proposta'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
