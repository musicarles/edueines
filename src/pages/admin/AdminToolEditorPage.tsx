import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  GitMerge,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../lib/auth/AuthProvider'
import { useCollection } from '../../lib/use-collection'
import { useData } from '../../lib/data-context'
import { can } from '../../lib/permissions'
import {
  BENEFITS,
  BENEFIT_KEYS,
  LEVELS,
  REVIEW_MONTHS,
  TOOL_STATUSES,
} from '../../lib/constants'
import {
  canPublish,
  isPublicTool,
  reviewLabel,
  verificationState,
} from '../../lib/catalog'
import { findToolDuplicate } from '../../lib/duplicates'
import { addHistory, diffValues } from '../../lib/history'
import { parseToolForm, type FieldErrors } from '../../lib/schemas'
import {
  archiveTool,
  dateInputToIso,
  deleteTool,
  mergeTools,
  publishTool,
  restoreTool,
  toDateInputValue,
  unpublishTool,
  verifyTool,
} from '../../lib/workflow'
import { getStore } from '../../lib/store'
import type { BenefitType, Tool, ToolStatus } from '../../lib/types'
import {
  addMonths,
  cn,
  formatDate,
  nowIso,
  slugify,
} from '../../lib/utils'
import { AdminCard, AdminPageHeader } from '../../components/admin/AdminUI'
import { Button, buttonClasses } from '../../components/ui/Button'
import { Field, Select, Textarea, TextInput } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { LoadingBlock, EmptyState } from '../../components/ui/Feedback'
import { ToolStatusBadge } from '../../components/StatusBadge'

type YesNo = 'si' | 'no' | 'no-ho-se'

function toYesNo(value: boolean | null): YesNo {
  if (value === true) return 'si'
  if (value === false) return 'no'
  return 'no-ho-se'
}

interface Draft {
  name: string
  officialUrl: string
  shortDescription: string
  fullDescription: string
  educationalUses: string
  categoryId: string
  benefitType: BenefitType | ''
  accessConditions: string
  accessMethod: string
  signupInstructions: string
  officialSource: string
  verificationNotes: string
  requiresInstitutionalEmail: YesNo
  requiresTeacherVerification: YesNo
  levels: string[]
  status: ToolStatus
  featured: boolean
  popularity: string
  color: string
}

const EMPTY_DRAFT: Draft = {
  name: '',
  officialUrl: '',
  shortDescription: '',
  fullDescription: '',
  educationalUses: '',
  categoryId: '',
  benefitType: '',
  accessConditions: '',
  accessMethod: '',
  signupInstructions: '',
  officialSource: '',
  verificationNotes: '',
  requiresInstitutionalEmail: 'no-ho-se',
  requiresTeacherVerification: 'no-ho-se',
  levels: [],
  status: 'pendent',
  featured: false,
  popularity: '0',
  color: '#0F766E',
}

function draftFrom(tool: Tool): Draft {
  return {
    name: tool.name,
    officialUrl: tool.officialUrl,
    shortDescription: tool.shortDescription,
    fullDescription: tool.fullDescription,
    educationalUses: tool.educationalUses,
    categoryId: tool.categoryId,
    benefitType: tool.benefitType,
    accessConditions: tool.accessConditions,
    accessMethod: tool.accessMethod,
    signupInstructions: tool.signupInstructions,
    officialSource: tool.officialSource,
    verificationNotes: tool.verificationNotes,
    requiresInstitutionalEmail: toYesNo(tool.requiresInstitutionalEmail),
    requiresTeacherVerification: toYesNo(tool.requiresTeacherVerification),
    levels: tool.levels,
    status: tool.status,
    featured: tool.featured,
    popularity: String(tool.popularity),
    color: tool.color,
  }
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Nom',
  officialUrl: 'URL oficial',
  shortDescription: 'Descripció breu',
  fullDescription: 'Descripció completa',
  educationalUses: 'Utilitats educatives',
  categoryId: 'Categoria',
  benefitType: 'Tipus d’avantatge',
  accessConditions: 'Condicions d’accés',
  accessMethod: 'Mètode d’accés',
  signupInstructions: 'Passos de registre',
  officialSource: 'Font oficial',
  verificationNotes: 'Notes de verificació',
  requiresInstitutionalEmail: 'Correu institucional',
  requiresTeacherVerification: 'Verificació docent',
  levels: 'Nivells educatius',
  status: 'Estat',
  featured: 'Destacada',
  popularity: 'Popularitat',
  color: 'Color',
}

export default function AdminToolEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'nova'
  const navigate = useNavigate()
  const { user } = useAuth()
  const { categories } = useData()
  const { items: tools, loading, refresh } = useCollection<Tool>('tools')
  const tool = isNew ? undefined : tools.find((item) => item.id === id)
  const initialized = useRef<string | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [working, setWorking] = useState(false)
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [verifyDate, setVerifyDate] = useState(toDateInputValue(nowIso()))
  const [verifySource, setVerifySource] = useState('')
  const [verifyNotes, setVerifyNotes] = useState('')
  const [archiveReason, setArchiveReason] = useState('')
  const [mergeTarget, setMergeTarget] = useState('')
  const [mergeReason, setMergeReason] = useState('')

  useEffect(() => {
    if (isNew) {
      if (initialized.current !== 'new') {
        setDraft(EMPTY_DRAFT)
        initialized.current = 'new'
      }
      return
    }
    if (tool && initialized.current !== tool.id) {
      setDraft(draftFrom(tool))
      initialized.current = tool.id
    }
  }, [isNew, tool])

  useEffect(() => {
    if (tool && verifyOpen) {
      setVerifySource(tool.officialSource || tool.officialUrl)
      setVerifyNotes(tool.verificationNotes)
      setVerifyDate(toDateInputValue(nowIso()))
    }
  }, [tool, verifyOpen])

  const actor = user ? { uid: user.uid, name: user.displayName } : null
  const canEdit = can(user?.role, 'tools.edit')
  const canVerify = can(user?.role, 'tools.verify')
  const canManagePublication = can(user?.role, 'tools.publish')
  const canArchive = can(user?.role, 'tools.archive')
  const readOnly = !canEdit

  const state = tool ? verificationState(tool) : 'never'
  const mergeCandidates = useMemo(
    () => tools.filter((item) => item.id !== tool?.id && item.status !== 'no_vigent'),
    [tools, tool?.id],
  )

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function toggleLevel(level: string, checked: boolean) {
    update(
      'levels',
      checked ? [...draft.levels, level] : draft.levels.filter((item) => item !== level),
    )
  }

  function buildFormData(): FormData {
    const formData = new FormData()
    formData.set('name', draft.name)
    formData.set('officialUrl', draft.officialUrl)
    formData.set('shortDescription', draft.shortDescription)
    formData.set('fullDescription', draft.fullDescription)
    formData.set('educationalUses', draft.educationalUses)
    formData.set('categoryId', draft.categoryId)
    formData.set('benefitType', draft.benefitType)
    formData.set('accessConditions', draft.accessConditions)
    formData.set('accessMethod', draft.accessMethod)
    formData.set('signupInstructions', draft.signupInstructions)
    formData.set('officialSource', draft.officialSource || draft.officialUrl)
    formData.set('verificationNotes', draft.verificationNotes)
    formData.set('requiresInstitutionalEmail', draft.requiresInstitutionalEmail)
    formData.set('requiresTeacherVerification', draft.requiresTeacherVerification)
    for (const level of draft.levels) formData.append('levels', level)
    formData.set('status', draft.status)
    if (draft.featured) formData.set('featured', 'on')
    formData.set('popularity', draft.popularity)
    formData.set('color', draft.color)
    return formData
  }

  async function uniqueToolId(name: string): Promise<string> {
    const base = slugify(name) || 'eina'
    let candidate = base
    let counter = 2
    while (tools.some((item) => item.id === candidate)) {
      candidate = `${base}-${counter}`
      counter += 1
    }
    return candidate
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!actor || !canEdit) return
    const parsed = parseToolForm(buildFormData())
    if (!parsed.ok) {
      setErrors(parsed.errors)
      const first = document.querySelector<HTMLElement>('[aria-invalid="true"]')
      first?.focus()
      toast.error('Revisa els camps marcats.')
      return
    }
    setErrors({})
    const data = parsed.data

    const others = tools.filter((item) => item.id !== tool?.id)
    const duplicate = findToolDuplicate(others, data.name, data.officialUrl)
    if (duplicate.duplicate) {
      toast.error(duplicate.label)
      return
    }

    if (tool && data.status === 'publicada' && !canPublish(tool)) {
      toast.error(
        'No es pot publicar una fitxa sense una verificació vigent de menys de sis mesos.',
      )
      return
    }

    setSaving(true)
    try {
      const store = await getStore()
      const now = nowIso()
      if (tool) {
        const next: Tool = {
          ...tool,
          ...data,
          status: canManagePublication ? data.status : tool.status,
          updatedAt: now,
          publishedAt:
            (canManagePublication ? data.status : tool.status) === 'publicada'
              ? (tool.publishedAt ?? now)
              : tool.publishedAt,
        }
        const changes = diffValues(
          tool as unknown as Record<string, unknown>,
          next as unknown as Record<string, unknown>,
          FIELD_LABELS,
        )
        await store.put('tools', tool.id, next)
        await addHistory({
          entityType: 'eina',
          entityId: tool.id,
          entityName: next.name,
          action: 'editada',
          summary:
            changes.length > 0
              ? `Fitxa editada. Canvis: ${changes.map((change) => change.field).join(', ')}.`
              : 'Fitxa desada sense canvis de contingut.',
          actorUid: actor.uid,
          actorName: actor.name,
          changes,
        })
        await refresh()
        toast.success('Fitxa desada.')
      } else {
        const toolId = await uniqueToolId(data.name)
        const next: Tool = {
          ...data,
          id: toolId,
          slug: toolId,
          status: 'pendent',
          featured: data.featured,
          popularity: data.popularity,
          color: data.color,
          lastVerifiedAt: null,
          nextReviewAt: null,
          createdAt: now,
          updatedAt: now,
          publishedAt: null,
          proposalId: null,
          archivedReason: '',
          mergedIntoId: null,
        }
        await store.put('tools', toolId, next)
        await addHistory({
          entityType: 'eina',
          entityId: toolId,
          entityName: next.name,
          action: 'creada',
          summary:
            'Fitxa creada manualment des de l’administració. Queda pendent de verificació.',
          actorUid: actor.uid,
          actorName: actor.name,
          changes: [],
        })
        await refresh()
        toast.success('Fitxa creada. Ara cal verificar-la abans de publicar-la.')
        navigate(`/admin/eines/${toolId}`)
      }
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut desar la fitxa.')
    } finally {
      setSaving(false)
    }
  }

  async function handleVerify() {
    if (!tool || !actor) return
    if (!verifyDate || !verifySource.trim()) {
      toast.error('Indica la data i la font oficial de la verificació.')
      return
    }
    setWorking(true)
    try {
      await verifyTool(
        tool,
        {
          verifiedAt: dateInputToIso(verifyDate),
          source: verifySource.trim(),
          notes: verifyNotes.trim(),
        },
        actor,
      )
      await refresh()
      setVerifyOpen(false)
      toast.success(
        `Verificació registrada. Propera revisió: ${formatDate(
          addMonths(dateInputToIso(verifyDate), REVIEW_MONTHS),
        )}.`,
      )
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut verificar.')
    } finally {
      setWorking(false)
    }
  }

  async function handlePublish() {
    if (!tool || !actor) return
    setWorking(true)
    try {
      await publishTool(tool, actor)
      await refresh()
      toast.success('Fitxa publicada al catàleg.')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut publicar.')
    } finally {
      setWorking(false)
    }
  }

  async function handleUnpublish() {
    if (!tool || !actor) return
    setWorking(true)
    try {
      await unpublishTool(tool, actor)
      await refresh()
      toast.success('Fitxa retirada del catàleg públic.')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut retirar.')
    } finally {
      setWorking(false)
    }
  }

  async function handleArchive() {
    if (!tool || !actor) return
    if (!archiveReason.trim()) {
      toast.error('Indica el motiu pel qual l’eina deixa de ser vigent.')
      return
    }
    setWorking(true)
    try {
      await archiveTool(tool, archiveReason, actor)
      await refresh()
      setArchiveOpen(false)
      setArchiveReason('')
      toast.success('Fitxa arxivada com a no vigent.')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut arxivar.')
    } finally {
      setWorking(false)
    }
  }

  async function handleRestore() {
    if (!tool || !actor) return
    setWorking(true)
    try {
      await restoreTool(tool, actor)
      await refresh()
      toast.success('Fitxa restaurada.')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut restaurar.')
    } finally {
      setWorking(false)
    }
  }

  async function handleDelete() {
    if (!tool || !actor) return
    setWorking(true)
    try {
      await deleteTool(tool, actor)
      toast.success('Fitxa eliminada definitivament.')
      navigate('/admin/eines')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut eliminar.')
    } finally {
      setWorking(false)
    }
  }

  async function handleMerge() {
    if (!tool || !actor) return
    const target = tools.find((item) => item.id === mergeTarget)
    if (!target) {
      toast.error('Tria la fitxa de destí.')
      return
    }
    setWorking(true)
    try {
      await mergeTools(tool, target, actor, mergeReason)
      await refresh()
      toast.success(`Fitxa fusionada amb «${target.name}».`)
      navigate('/admin/eines')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut fusionar.')
    } finally {
      setWorking(false)
    }
  }

  if (!isNew && loading) {
    return <LoadingBlock label="Carregant la fitxa…" />
  }

  if (!isNew && !tool) {
    return (
      <EmptyState
        icon={<Wrench className="size-5" />}
        title="No hem trobat aquesta eina"
        description="Pot ser que s’hagi eliminat o que l’enllaç no sigui correcte."
        action={
          <Link to="/admin/eines" className={buttonClasses('primary', 'md')}>
            Torna a les eines
          </Link>
        }
      />
    )
  }

  return (
    <div>
      <AdminPageHeader
        backTo="/admin/eines"
        backLabel="Torna a les eines"
        title={isNew ? 'Nova eina' : (tool?.name ?? 'Fitxa')}
        description={
          isNew
            ? 'Crea una fitxa manualment. Quedarà pendent de revisió fins que en verifiquis les condicions.'
            : `Estat actual: ${tool ? TOOL_STATUSES[tool.status].label : '—'} · darrera verificació: ${formatDate(
                tool?.lastVerifiedAt ?? null,
              )}`
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {tool ? <ToolStatusBadge status={tool.status} /> : null}
            {tool && isPublicTool(tool) ? (
              <Link to={`/eines/${tool.slug}`} className={buttonClasses('outline', 'sm')}>
                <Eye className="size-3.5" aria-hidden="true" />
                Veure fitxa
              </Link>
            ) : null}
          </div>
        }
      />

      {!isNew && tool ? (
        <div
          className={cn(
            'mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 text-sm',
            state === 'ok' && 'border-emerald-200 bg-emerald-50 text-emerald-900',
            state === 'due-soon' && 'border-amber-200 bg-amber-50 text-amber-900',
            state === 'overdue' && 'border-orange-200 bg-orange-50 text-orange-900',
            state === 'never' && 'border-slate-200 bg-white text-slate-700',
          )}
        >
          <p className="inline-flex items-center gap-2 font-semibold">
            {state === 'ok' ? (
              <ShieldCheck className="size-4" aria-hidden="true" />
            ) : (
              <AlertTriangle className="size-4" aria-hidden="true" />
            )}
            {reviewLabel(tool)}
            {tool.nextReviewAt ? (
              <span className="font-normal">· propera revisió: {formatDate(tool.nextReviewAt)}</span>
            ) : null}
          </p>
          {canVerify ? (
            <Button size="sm" variant={state === 'ok' ? 'outline' : 'primary'} onClick={() => setVerifyOpen(true)}>
              <BadgeCheck className="size-4" aria-hidden="true" />
              Registra una verificació
            </Button>
          ) : null}
        </div>
      ) : null}

      {readOnly ? (
        <p className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
          Tens accés de consulta: pots veure la fitxa però no modificar-la.
        </p>
      ) : null}

      <form onSubmit={handleSave} className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <AdminCard title="Informació principal">
            <fieldset disabled={readOnly || saving} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="name" label="Nom de l’eina" required error={errors.name}>
                  <TextInput
                    id="name"
                    value={draft.name}
                    onChange={(event) => update('name', event.target.value)}
                    invalid={Boolean(errors.name)}
                    maxLength={120}
                    required
                  />
                </Field>
                <Field id="officialUrl" label="URL oficial" required error={errors.officialUrl}>
                  <TextInput
                    id="officialUrl"
                    type="url"
                    value={draft.officialUrl}
                    onChange={(event) => update('officialUrl', event.target.value)}
                    invalid={Boolean(errors.officialUrl)}
                    required
                  />
                </Field>
              </div>

              <Field
                id="shortDescription"
                label="Descripció breu"
                required
                error={errors.shortDescription}
                hint="Apareix a les targetes del catàleg. Màxim 240 caràcters."
              >
                <Textarea
                  id="shortDescription"
                  rows={2}
                  value={draft.shortDescription}
                  onChange={(event) => update('shortDescription', event.target.value)}
                  invalid={Boolean(errors.shortDescription)}
                  maxLength={240}
                  required
                />
              </Field>

              <Field id="fullDescription" label="Descripció completa" required error={errors.fullDescription}>
                <Textarea
                  id="fullDescription"
                  rows={5}
                  value={draft.fullDescription}
                  onChange={(event) => update('fullDescription', event.target.value)}
                  invalid={Boolean(errors.fullDescription)}
                  required
                />
              </Field>

              <Field id="educationalUses" label="Utilitats educatives" required error={errors.educationalUses}>
                <Textarea
                  id="educationalUses"
                  rows={4}
                  value={draft.educationalUses}
                  onChange={(event) => update('educationalUses', event.target.value)}
                  invalid={Boolean(errors.educationalUses)}
                  required
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="categoryId" label="Categoria" required error={errors.categoryId}>
                  <Select
                    id="categoryId"
                    value={draft.categoryId}
                    onChange={(event) => update('categoryId', event.target.value)}
                    invalid={Boolean(errors.categoryId)}
                    required
                  >
                    <option value="">Tria una categoria…</option>
                    {categories
                      .filter((category) => category.active)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </Select>
                </Field>
                <Field id="benefitType" label="Tipus d’avantatge" required error={errors.benefitType}>
                  <Select
                    id="benefitType"
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
            </fieldset>
          </AdminCard>

          <AdminCard
            title="Accés i condicions"
            description="Aquesta informació és la que més consulta el professorat. Cal ser concret i prudent."
          >
            <fieldset disabled={readOnly || saving} className="space-y-5">
              <Field id="accessConditions" label="Condicions d’accés" required error={errors.accessConditions}>
                <Textarea
                  id="accessConditions"
                  rows={4}
                  value={draft.accessConditions}
                  onChange={(event) => update('accessConditions', event.target.value)}
                  invalid={Boolean(errors.accessConditions)}
                  required
                />
              </Field>

              <Field id="accessMethod" label="Com s’hi accedeix" required error={errors.accessMethod}>
                <Textarea
                  id="accessMethod"
                  rows={3}
                  value={draft.accessMethod}
                  onChange={(event) => update('accessMethod', event.target.value)}
                  invalid={Boolean(errors.accessMethod)}
                  required
                />
              </Field>

              <Field id="signupInstructions" label="Passos per registrar-s’hi" required error={errors.signupInstructions}>
                <Textarea
                  id="signupInstructions"
                  rows={4}
                  value={draft.signupInstructions}
                  onChange={(event) => update('signupInstructions', event.target.value)}
                  invalid={Boolean(errors.signupInstructions)}
                  required
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="officialSource" label="Font oficial verificada" required error={errors.officialSource}>
                  <TextInput
                    id="officialSource"
                    type="url"
                    value={draft.officialSource}
                    onChange={(event) => update('officialSource', event.target.value)}
                    invalid={Boolean(errors.officialSource)}
                    required
                  />
                </Field>
                <Field
                  id="verificationNotes"
                  label="Notes de verificació"
                  optional
                  error={errors.verificationNotes}
                  hint="Queden visibles a la fitxa pública."
                >
                  <Textarea
                    id="verificationNotes"
                    rows={2}
                    value={draft.verificationNotes}
                    onChange={(event) => update('verificationNotes', event.target.value)}
                  />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="requiresInstitutionalEmail" label="Cal correu institucional?">
                  <Select
                    id="requiresInstitutionalEmail"
                    value={draft.requiresInstitutionalEmail}
                    onChange={(event) =>
                      update('requiresInstitutionalEmail', event.target.value as YesNo)
                    }
                  >
                    <option value="no-ho-se">No ho sé</option>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </Select>
                </Field>
                <Field id="requiresTeacherVerification" label="Cal verificar la condició de docent?">
                  <Select
                    id="requiresTeacherVerification"
                    value={draft.requiresTeacherVerification}
                    onChange={(event) =>
                      update('requiresTeacherVerification', event.target.value as YesNo)
                    }
                  >
                    <option value="no-ho-se">No ho sé</option>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </Select>
                </Field>
              </div>

              <fieldset>
                <legend className="text-sm font-semibold text-ink">
                  Nivells educatius <span className="text-rose-600">*</span>
                </legend>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {LEVELS.map((level) => {
                    const active = draft.levels.includes(level.value)
                    return (
                      <label
                        key={level.value}
                        className={cn(
                          'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition',
                          active
                            ? 'border-brand-600 bg-brand-700 text-white'
                            : 'border-slate-200 bg-white text-slate-600',
                        )}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={active}
                          onChange={(event) => toggleLevel(level.value, event.target.checked)}
                        />
                        {level.label}
                      </label>
                    )
                  })}
                </div>
                {errors.levels ? (
                  <p className="mt-1 text-xs font-medium text-rose-700" role="alert">
                    {errors.levels}
                  </p>
                ) : null}
              </fieldset>
            </fieldset>
          </AdminCard>

          <AdminCard title="Publicació i presentació">
            <fieldset disabled={readOnly || saving} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-3">
                {canManagePublication && !isNew ? (
                  <Field id="status" label="Estat de la fitxa" hint="Publicar requereix verificació vigent.">
                    <Select
                      id="status"
                      value={draft.status}
                      onChange={(event) => update('status', event.target.value as ToolStatus)}
                    >
                      {Object.entries(TOOL_STATUSES).map(([key, info]) => (
                        <option key={key} value={key}>
                          {info.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}

                <Field id="color" label="Color del monograma" hint="Format #RRGGBB.">
                  <div className="flex items-center gap-2">
                    <input
                      id="color"
                      type="color"
                      value={draft.color}
                      onChange={(event) => update('color', event.target.value.toUpperCase())}
                      className="size-10 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-0.5"
                    />
                    <TextInput
                      aria-label="Codi de color"
                      value={draft.color}
                      onChange={(event) => update('color', event.target.value.toUpperCase())}
                      invalid={Boolean(errors.color)}
                      maxLength={7}
                    />
                  </div>
                </Field>

                <Field id="popularity" label="Popularitat (0-100)" hint="Ordena el catàleg per «Més populars».">
                  <TextInput
                    id="popularity"
                    type="number"
                    min={0}
                    max={100}
                    value={draft.popularity}
                    onChange={(event) => update('popularity', event.target.value)}
                    invalid={Boolean(errors.popularity)}
                  />
                </Field>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-cream/60 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(event) => update('featured', event.target.checked)}
                  className="mt-0.5 size-4 rounded border-slate-300 accent-brand-700"
                />
                <span>
                  <span className="block font-semibold text-ink">Eina destacada</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Apareixerà a la secció «Eines destacades» de la pàgina d’inici.
                  </span>
                </span>
              </label>

              {isNew ? (
                <p className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs leading-relaxed text-sky-900">
                  Les fitxes noves es creen sempre amb l’estat «Pendent de revisió». Un cop desada,
                  podràs registrar-ne la verificació i publicar-la.
                </p>
              ) : null}
            </fieldset>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">
                {isNew
                  ? 'La fitxa no serà visible fins que es verifiqui i es publiqui.'
                  : 'Els canvis queden registrats a l’historial amb el teu nom.'}
              </p>
              {canEdit ? (
                <Button type="submit" disabled={saving}>
                  <Save className="size-4" aria-hidden="true" />
                  {saving ? 'Desant…' : isNew ? 'Crea la fitxa' : 'Desa els canvis'}
                </Button>
              ) : null}
            </div>
          </AdminCard>
        </div>

        <aside className="space-y-4">
          {!isNew && tool ? (
            <>
              <AdminCard title="Verificació">
                <dl className="space-y-2.5 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Darrera verificació
                    </dt>
                    <dd className="mt-0.5 font-semibold text-ink">{formatDate(tool.lastVerifiedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Propera revisió
                    </dt>
                    <dd className="mt-0.5 font-semibold text-ink">{formatDate(tool.nextReviewAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Estat de revisió
                    </dt>
                    <dd className="mt-0.5">{reviewLabel(tool)}</dd>
                  </div>
                </dl>
                <div className="mt-4 space-y-2">
                  {canVerify ? (
                    <Button variant="outline" className="w-full" onClick={() => setVerifyOpen(true)}>
                      <CalendarCheck className="size-4" aria-hidden="true" />
                      Verifica la fitxa
                    </Button>
                  ) : null}
                  {canManagePublication && tool.status === 'verificada' ? (
                    <Button
                      className="w-full"
                      disabled={working || !canPublish(tool)}
                      onClick={handlePublish}
                    >
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                      Publica
                    </Button>
                  ) : null}
                  {canManagePublication && isPublicTool(tool) ? (
                    <Button variant="outline" className="w-full" disabled={working} onClick={handleUnpublish}>
                      <EyeOff className="size-4" aria-hidden="true" />
                      Retira del catàleg
                    </Button>
                  ) : null}
                </div>
                {tool.status === 'verificada' && !canPublish(tool) ? (
                  <p className="mt-3 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
                    Cal una verificació de menys de sis mesos per publicar.
                  </p>
                ) : null}
              </AdminCard>

              <AdminCard title="Accions de manteniment">
                <div className="space-y-2">
                  {tool.status === 'no_vigent' && canArchive ? (
                    <Button variant="outline" className="w-full" disabled={working} onClick={handleRestore}>
                      <RotateCcw className="size-4" aria-hidden="true" />
                      Restaura la fitxa
                    </Button>
                  ) : null}
                  {tool.status !== 'no_vigent' && canArchive ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={working}
                      onClick={() => setArchiveOpen(true)}
                    >
                      <Archive className="size-4" aria-hidden="true" />
                      Marca com a no vigent
                    </Button>
                  ) : null}
                  {canArchive ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={working}
                      onClick={() => setMergeOpen(true)}
                    >
                      <GitMerge className="size-4" aria-hidden="true" />
                      Fusiona amb una altra eina
                    </Button>
                  ) : null}
                  {canArchive ? (
                    <Button
                      variant="ghost"
                      className="w-full text-rose-700 hover:bg-rose-50"
                      disabled={working}
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Elimina la fitxa
                    </Button>
                  ) : null}
                </div>
                {tool.archivedReason ? (
                  <p className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
                    <strong className="font-semibold">Motiu d’arxivament:</strong>{' '}
                    {tool.archivedReason}
                  </p>
                ) : null}
                {tool.mergedIntoId ? (
                  <p className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
                    Aquesta fitxa es va fusionar amb una altra.
                  </p>
                ) : null}
              </AdminCard>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
                <h2 className="font-display text-base font-bold text-ink">Enllaços</h2>
                <div className="mt-3 space-y-2 text-xs">
                  <a
                    href={tool.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-semibold text-brand-800 hover:underline"
                  >
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                    Lloc oficial de l’eina
                  </a>
                  <a
                    href={tool.officialSource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-semibold text-brand-800 hover:underline"
                  >
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                    Font verificada
                  </a>
                  {tool.proposalId ? (
                    <Link
                      to={`/admin/propostes/${tool.proposalId}`}
                      className="flex items-center gap-1.5 font-semibold text-brand-800 hover:underline"
                    >
                      <Sparkles className="size-3.5" aria-hidden="true" />
                      Proposta d’origen
                    </Link>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
              <h2 className="font-display text-base font-bold text-ink">Abans de crear</h2>
              <ul className="mt-2 space-y-2 text-xs leading-relaxed">
                <li>· Comprova que l’eina no existeixi ja al catàleg.</li>
                <li>· Fes servir l’enllaç oficial, sense paràmetres d’afiliació.</li>
                <li>· La fitxa es crearà com a pendent de revisió.</li>
                <li>· Després podràs registrar la verificació i publicar-la.</li>
              </ul>
            </div>
          )}

          <Link
            to="/admin/eines"
            className="flex items-center gap-1.5 px-1 text-xs font-semibold text-slate-500 hover:text-brand-800"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Torna a la llista d’eines
          </Link>
        </aside>
      </form>

      <Modal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        title="Registra una verificació"
        description={`Comprova la informació a la font oficial i deixa constància de la data. La propera revisió es programarà a ${REVIEW_MONTHS} mesos.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setVerifyOpen(false)} disabled={working}>
              Cancel·la
            </Button>
            <Button onClick={handleVerify} disabled={working}>
              {working ? 'Desant…' : 'Registra la verificació'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field id="verify-date" label="Data de la verificació" required>
            <input
              id="verify-date"
              type="date"
              value={verifyDate}
              max={toDateInputValue(nowIso())}
              onChange={(event) => setVerifyDate(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
            />
          </Field>
          <Field id="verify-source" label="Font oficial consultada" required>
            <TextInput
              id="verify-source"
              type="url"
              value={verifySource}
              onChange={(event) => setVerifySource(event.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field
            id="verify-notes"
            label="Notes"
            optional
            hint="Queden visibles a la fitxa pública. Indica què s’ha comprovat i quines limitacions hi ha."
          >
            <Textarea
              id="verify-notes"
              rows={4}
              value={verifyNotes}
              onChange={(event) => setVerifyNotes(event.target.value)}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title="Marca la fitxa com a no vigent"
        description="La fitxa desapareixerà del catàleg públic però es conservarà a l’administració i a l’historial."
        footer={
          <>
            <Button variant="ghost" onClick={() => setArchiveOpen(false)} disabled={working}>
              Cancel·la
            </Button>
            <Button variant="danger" onClick={handleArchive} disabled={working}>
              {working ? 'Arxivant…' : 'Marca com a no vigent'}
            </Button>
          </>
        }
      >
        <Field
          id="archive-reason"
          label="Motiu"
          required
          hint="Per exemple: l’eina ha retirat l’oferta educativa o ha canviat de propietari."
        >
          <Textarea
            id="archive-reason"
            rows={3}
            value={archiveReason}
            onChange={(event) => setArchiveReason(event.target.value)}
          />
        </Field>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Elimina la fitxa definitivament"
        description="Aquesta acció no es pot desfer. Si només vols amagar-la del catàleg, fes servir l’arxivament."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={working}>
              Cancel·la
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={working}>
              {working ? 'Eliminant…' : 'Elimina definitivament'}
            </Button>
          </>
        }
      >
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          S’eliminarà la fitxa «{tool?.name}» i no es podrà recuperar. L’historial conservarà el
          registre de l’eliminació.
        </p>
      </Modal>

      <Modal
        open={mergeOpen}
        onClose={() => setMergeOpen(false)}
        title="Fusiona aquesta fitxa amb una altra"
        description="La fitxa actual quedarà com a no vigent i apuntarà a la fitxa de destí. No s’eliminen dades."
        footer={
          <>
            <Button variant="ghost" onClick={() => setMergeOpen(false)} disabled={working}>
              Cancel·la
            </Button>
            <Button onClick={handleMerge} disabled={working || !mergeTarget}>
              {working ? 'Fusionant…' : 'Fusiona'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field id="merge-target-tool" label="Fitxa de destí" required>
            <Select
              id="merge-target-tool"
              value={mergeTarget}
              onChange={(event) => setMergeTarget(event.target.value)}
            >
              <option value="">Tria una fitxa…</option>
              {mergeCandidates.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.domain}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="merge-tool-reason" label="Motiu de la fusió" optional>
            <Textarea
              id="merge-tool-reason"
              rows={3}
              value={mergeReason}
              onChange={(event) => setMergeReason(event.target.value)}
              placeholder="Nom alternatiu, domini duplicat, canvi de marca…"
            />
          </Field>
        </div>
      </Modal>
    </div>
  )
}
