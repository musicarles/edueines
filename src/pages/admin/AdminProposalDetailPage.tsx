import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  GitMerge,
  Inbox,
  Mail,
  RotateCcw,
  Save,
  User,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../lib/auth/AuthProvider'
import { useCollection } from '../../lib/use-collection'
import { useData } from '../../lib/data-context'
import { can } from '../../lib/permissions'
import { BENEFITS, BENEFIT_KEYS, LEVELS, PROPOSAL_STATUSES } from '../../lib/constants'
import { findToolDuplicate } from '../../lib/duplicates'
import { addHistory, diffValues } from '../../lib/history'
import {
  approveProposal,
  markProposalInReview,
  mergeProposalInto,
  rejectProposal,
} from '../../lib/workflow'
import { parseProposalForm, type FieldErrors } from '../../lib/schemas'
import { getStore } from '../../lib/store'
import type { BenefitType, Proposal, Tool } from '../../lib/types'
import { cn, formatDateTime, nowIso } from '../../lib/utils'
import { AdminPageHeader } from '../../components/admin/AdminUI'
import { Button, buttonClasses } from '../../components/ui/Button'
import { Field, Select, Textarea, TextInput } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { LoadingBlock, EmptyState } from '../../components/ui/Feedback'
import { ProposalStatusBadge } from '../../components/StatusBadge'
import { BenefitIcon } from '../../components/icons'

type YesNo = 'si' | 'no' | 'no-ho-se'

function toYesNo(value: boolean | null): YesNo {
  if (value === true) return 'si'
  if (value === false) return 'no'
  return 'no-ho-se'
}

interface Draft {
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

function draftFrom(proposal: Proposal): Draft {
  return {
    name: proposal.name,
    officialUrl: proposal.officialUrl,
    description: proposal.description,
    categoryId: proposal.categoryId,
    benefitType: proposal.benefitType,
    accessMethod: proposal.accessMethod,
    requiresInstitutionalEmail: toYesNo(proposal.requiresInstitutionalEmail),
    requiresTeacherVerification: toYesNo(proposal.requiresTeacherVerification),
    levels: proposal.levels,
    proposerName: proposal.proposerName,
    proposerEmail: proposal.proposerEmail,
    observations: proposal.observations,
  }
}

export default function AdminProposalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { categories } = useData()
  const { items: proposals, loading, refresh } = useCollection<Proposal>('proposals')
  const { items: tools, refresh: refreshTools } = useCollection<Tool>('tools')
  const proposal = proposals.find((item) => item.id === id)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [working, setWorking] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [mergeTarget, setMergeTarget] = useState('')
  const [mergeReason, setMergeReason] = useState('')
  const [mergeQuery, setMergeQuery] = useState('')

  useEffect(() => {
    if (proposal) setDraft(draftFrom(proposal))
  }, [proposal?.id, proposal?.updatedAt])

  const duplicate = useMemo(() => {
    if (!draft) return null
    return findToolDuplicate(tools, draft.name, draft.officialUrl)
  }, [tools, draft])

  const mergeCandidates = useMemo(() => {
    const needle = mergeQuery.trim().toLowerCase()
    return tools
      .filter((tool) => tool.status !== 'no_vigent')
      .filter((tool) =>
        needle
          ? `${tool.name} ${tool.domain}`.toLowerCase().includes(needle)
          : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'ca'))
      .slice(0, 40)
  }, [tools, mergeQuery])

  const actor = user ? { uid: user.uid, name: user.displayName } : null
  const canReview = can(user?.role, 'proposals.review')
  const canApprove = can(user?.role, 'proposals.approve')
  const readOnly = !canReview

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function toggleLevel(level: string, checked: boolean) {
    if (!draft) return
    update(
      'levels',
      checked ? [...draft.levels, level] : draft.levels.filter((item) => item !== level),
    )
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!proposal || !draft || !actor) return
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
      toast.error('Revisa els camps marcats.')
      return
    }

    setSaving(true)
    try {
      const store = await getStore()
      const data = parsed.data
      const labels: Record<string, string> = {
        name: 'Nom',
        officialUrl: 'URL oficial',
        description: 'Descripció',
        categoryId: 'Categoria',
        benefitType: 'Tipus d’avantatge',
        accessMethod: 'Mètode d’accés',
        requiresInstitutionalEmail: 'Correu institucional',
        requiresTeacherVerification: 'Verificació docent',
        levels: 'Nivells educatius',
        proposerName: 'Persona que proposa',
        proposerEmail: 'Correu de contacte',
        observations: 'Observacions',
      }
      const after = {
        ...data,
        updatedAt: nowIso(),
      }
      const changes = diffValues(
        proposal as unknown as Record<string, unknown>,
        after as unknown as Record<string, unknown>,
        labels,
      )
      await store.patch<Proposal>('proposals', proposal.id, after)
      await addHistory({
        entityType: 'proposta',
        entityId: proposal.id,
        entityName: data.name,
        action: 'editada',
        summary:
          changes.length > 0
            ? `Proposta editada abans de la decisió. Canvis: ${changes
                .map((change) => change.field)
                .join(', ')}.`
            : 'Proposta desada sense canvis de contingut.',
        actorUid: actor.uid,
        actorName: actor.name,
        changes,
      })
      await refresh()
      toast.success('Canvis desats.')
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : 'No s’han pogut desar els canvis.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleInReview() {
    if (!proposal || !actor) return
    setWorking(true)
    try {
      await markProposalInReview(proposal, actor)
      await refresh()
      toast.success('Proposta marcada en revisió.')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut actualitzar.')
    } finally {
      setWorking(false)
    }
  }

  async function handleApprove(publish: boolean) {
    if (!proposal || !actor) return
    setWorking(true)
    try {
      const tool = await approveProposal(proposal, actor, publish)
      await refresh()
      await refreshTools()
      toast.success(
        publish
          ? 'Proposta aprovada i publicada al catàleg.'
          : 'Proposta aprovada. La fitxa queda verificada, pendent de publicar.',
      )
      navigate(`/admin/eines/${tool.id}`)
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : 'No s’ha pogut aprovar la proposta.',
      )
    } finally {
      setWorking(false)
    }
  }

  async function handleReject() {
    if (!proposal || !actor) return
    if (rejectReason.trim().length < 5) {
      toast.error('Indica un motiu de rebuig d’almenys 5 caràcters.')
      return
    }
    setWorking(true)
    try {
      await rejectProposal(proposal, rejectReason, actor)
      await refresh()
      setRejectOpen(false)
      setRejectReason('')
      toast.success('Proposta rebutjada i motiu desat.')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut rebutjar.')
    } finally {
      setWorking(false)
    }
  }

  async function handleMerge() {
    if (!proposal || !actor) return
    const target = tools.find((tool) => tool.id === mergeTarget)
    if (!target) {
      toast.error('Tria la fitxa amb què vols fusionar la proposta.')
      return
    }
    setWorking(true)
    try {
      await mergeProposalInto(proposal, target, actor, mergeReason)
      await refresh()
      setMergeOpen(false)
      toast.success(`Proposta fusionada amb «${target.name}».`)
      navigate('/admin/propostes')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut fusionar.')
    } finally {
      setWorking(false)
    }
  }

  if (loading) {
    return <LoadingBlock label="Carregant la proposta…" />
  }

  if (!proposal) {
    return (
      <EmptyState
        icon={<Inbox className="size-5" />}
        title="No hem trobat aquesta proposta"
        description="Pot ser que s’hagi eliminat o que l’enllaç no sigui correcte."
        action={
          <Link to="/admin/propostes" className={buttonClasses('primary', 'md')}>
            Torna a les propostes
          </Link>
        }
      />
    )
  }

  const decided = ['aprovada', 'rebutjada', 'fusionada'].includes(proposal.status)

  return (
    <div>
      <AdminPageHeader
        backTo="/admin/propostes"
        backLabel="Torna a les propostes"
        title={proposal.name}
        description={`Referència ${proposal.reference} · rebuda el ${formatDateTime(proposal.createdAt)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ProposalStatusBadge status={proposal.status} />
            {duplicate?.duplicate && duplicate.matchId ? (
              <Link
                to={`/admin/eines/${duplicate.matchId}`}
                className={buttonClasses('outline', 'sm')}
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
                Fitxa existent
              </Link>
            ) : null}
          </div>
        }
      />

      {readOnly ? (
        <p className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
          Tens accés de consulta: pots revisar la proposta i el seu historial, però no modificar-la
          ni prendre decisions.
        </p>
      ) : null}

      {decided ? (
        <div
          className={cn(
            'mb-5 rounded-2xl border p-4 text-sm',
            proposal.status === 'aprovada' && 'border-emerald-200 bg-emerald-50 text-emerald-900',
            proposal.status === 'rebutjada' && 'border-rose-200 bg-rose-50 text-rose-900',
            proposal.status === 'fusionada' && 'border-slate-200 bg-slate-50 text-slate-700',
          )}
        >
          <p className="inline-flex items-center gap-2 font-semibold">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            {PROPOSAL_STATUSES[proposal.status].label}
            {proposal.reviewedAt ? ` · ${formatDateTime(proposal.reviewedAt)}` : ''}
          </p>
          {proposal.reviewedByName ? (
            <p className="mt-1 text-xs">Decisió de {proposal.reviewedByName}.</p>
          ) : null}
          {proposal.rejectionReason ? (
            <p className="mt-2 rounded-lg bg-white/60 p-2 text-xs">{proposal.rejectionReason}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
            {proposal.toolId ? (
              <Link to={`/admin/eines/${proposal.toolId}`} className="underline">
                Obre la fitxa creada o fusionada
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {duplicate?.duplicate && !decided ? (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {duplicate.label} Pots fusionar la proposta amb la fitxa existent per no duplicar
            informació.
          </p>
          {canApprove ? (
            <Button variant="outline" size="sm" onClick={() => setMergeOpen(true)}>
              <GitMerge className="size-3.5" aria-hidden="true" />
              Fusiona
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <form onSubmit={handleSave} className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-lg font-bold text-ink">Dades de la proposta</h2>
            <p className="mt-1 text-sm text-slate-600">
              Pots corregir la informació abans de prendre una decisió. Cada canvi queda
              registrat a l’historial.
            </p>

            <fieldset disabled={readOnly || saving} className="mt-5 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="name" label="Nom de l’eina" required error={errors.name}>
                  <TextInput
                    id="name"
                    value={draft?.name ?? ''}
                    onChange={(event) => update('name', event.target.value)}
                    invalid={Boolean(errors.name)}
                  />
                </Field>
                <Field id="officialUrl" label="URL oficial" required error={errors.officialUrl}>
                  <TextInput
                    id="officialUrl"
                    type="url"
                    value={draft?.officialUrl ?? ''}
                    onChange={(event) => update('officialUrl', event.target.value)}
                    invalid={Boolean(errors.officialUrl)}
                  />
                </Field>
              </div>

              <Field id="description" label="Descripció i utilitat educativa" required error={errors.description}>
                <Textarea
                  id="description"
                  rows={5}
                  value={draft?.description ?? ''}
                  onChange={(event) => update('description', event.target.value)}
                  invalid={Boolean(errors.description)}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="categoryId" label="Categoria" required error={errors.categoryId}>
                  <Select
                    id="categoryId"
                    value={draft?.categoryId ?? ''}
                    onChange={(event) => update('categoryId', event.target.value)}
                    invalid={Boolean(errors.categoryId)}
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
                    value={draft?.benefitType ?? ''}
                    onChange={(event) => update('benefitType', event.target.value as BenefitType)}
                    invalid={Boolean(errors.benefitType)}
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

              <Field id="accessMethod" label="Mètode d’accés" required error={errors.accessMethod}>
                <Textarea
                  id="accessMethod"
                  rows={4}
                  value={draft?.accessMethod ?? ''}
                  onChange={(event) => update('accessMethod', event.target.value)}
                  invalid={Boolean(errors.accessMethod)}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="requiresInstitutionalEmail" label="Cal correu institucional?">
                  <Select
                    id="requiresInstitutionalEmail"
                    value={draft?.requiresInstitutionalEmail ?? 'no-ho-se'}
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
                    value={draft?.requiresTeacherVerification ?? 'no-ho-se'}
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
                <legend className="text-sm font-semibold text-ink">Nivells educatius</legend>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {LEVELS.map((level) => {
                    const active = draft?.levels.includes(level.value) ?? false
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
                        {level.short}
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

              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="proposerName" label="Persona que proposa" optional error={errors.proposerName}>
                  <TextInput
                    id="proposerName"
                    value={draft?.proposerName ?? ''}
                    onChange={(event) => update('proposerName', event.target.value)}
                  />
                </Field>
                <Field id="proposerEmail" label="Correu de contacte" optional error={errors.proposerEmail}>
                  <TextInput
                    id="proposerEmail"
                    type="email"
                    value={draft?.proposerEmail ?? ''}
                    onChange={(event) => update('proposerEmail', event.target.value)}
                    invalid={Boolean(errors.proposerEmail)}
                  />
                </Field>
              </div>

              <Field id="observations" label="Observacions" optional error={errors.observations}>
                <Textarea
                  id="observations"
                  rows={3}
                  value={draft?.observations ?? ''}
                  onChange={(event) => update('observations', event.target.value)}
                />
              </Field>
            </fieldset>

            {!readOnly ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">
                  Els canvis no modifiquen l’estat de la proposta.
                </p>
                <Button type="submit" disabled={saving}>
                  <Save className="size-4" aria-hidden="true" />
                  {saving ? 'Desant…' : 'Desa els canvis'}
                </Button>
              </div>
            ) : null}
          </section>
        </form>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-base font-bold text-ink">Decisió</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Aprovar crea una fitxa verificada. Si tries publicar, la fitxa apareix
              immediatament al catàleg.
            </p>

            <div className="mt-4 space-y-2">
              {canReview && !decided ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleInReview}
                  disabled={working || proposal.status === 'en_revisio'}
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  {proposal.status === 'en_revisio' ? 'Ja està en revisió' : 'Marca en revisió'}
                </Button>
              ) : null}

              {canApprove && !decided ? (
                <>
                  <Button
                    className="w-full"
                    onClick={() => handleApprove(true)}
                    disabled={working}
                  >
                    <BadgeCheck className="size-4" aria-hidden="true" />
                    Aprova i publica
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleApprove(false)}
                    disabled={working}
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Aprova sense publicar
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setMergeOpen(true)}
                    disabled={working}
                  >
                    <GitMerge className="size-4" aria-hidden="true" />
                    Fusiona amb una eina
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-rose-700 hover:bg-rose-50"
                    onClick={() => setRejectOpen(true)}
                    disabled={working}
                  >
                    <XCircle className="size-4" aria-hidden="true" />
                    Rebutja la proposta
                  </Button>
                </>
              ) : null}

              {!canReview ? (
                <p className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-500">
                  El teu rol no permet prendre decisions sobre propostes.
                </p>
              ) : null}

              {decided ? (
                <p className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-500">
                  Aquesta proposta ja té una decisió. Pots consultar-ne les dades i l’historial.
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
            <h2 className="font-display text-base font-bold text-ink">Resum</h2>
            <dl className="mt-3 space-y-2.5">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Avantatge
                </dt>
                <dd className="mt-1">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
                      BENEFITS[proposal.benefitType].badge,
                    )}
                  >
                    <BenefitIcon name={BENEFITS[proposal.benefitType].icon} className="size-3.5" />
                    {BENEFITS[proposal.benefitType].short}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Domini
                </dt>
                <dd className="mt-0.5 break-all font-medium text-ink">{proposal.domain}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contacte
                </dt>
                <dd className="mt-0.5 space-y-1 text-xs text-slate-600">
                  {proposal.proposerName ? (
                    <p className="inline-flex items-center gap-1.5">
                      <User className="size-3.5" aria-hidden="true" />
                      {proposal.proposerName}
                    </p>
                  ) : (
                    <p>Sense nom</p>
                  )}
                  {proposal.proposerEmail ? (
                    <p className="inline-flex items-center gap-1.5 break-all">
                      <Mail className="size-3.5" aria-hidden="true" />
                      {proposal.proposerEmail}
                    </p>
                  ) : (
                    <p>Sense correu</p>
                  )}
                </dd>
              </div>
              {proposal.observations ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Observacions
                  </dt>
                  <dd className="mt-0.5 text-xs leading-relaxed text-slate-600">
                    {proposal.observations}
                  </dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-4 border-t border-slate-100 pt-3">
              <a
                href={proposal.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-800 hover:underline"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
                Obre la font oficial
              </a>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-base font-bold text-ink">Recordatori</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Abans d’aprovar, comprova a la font oficial el tipus d’avantatge, els requisits
              d’accés, els límits del pla i els nivells educatius. No aprovem informació que no
              es pugui contrastar.
            </p>
          </section>
        </aside>
      </div>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Rebutja la proposta"
        description="El motiu es desa a l’historial i allibera el bloqueig de duplicats."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectOpen(false)} disabled={working}>
              Cancel·la
            </Button>
            <Button variant="danger" onClick={handleReject} disabled={working}>
              {working ? 'Rebutjant…' : 'Rebutja'}
            </Button>
          </>
        }
      >
        <Field
          id="reject-reason"
          label="Motiu del rebuig"
          required
          hint="Explica què no s’ha pogut verificar o per què no encaixa al catàleg."
        >
          <Textarea
            id="reject-reason"
            rows={4}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Per exemple: no s’ha pogut confirmar l’avantatge a la pàgina oficial."
          />
        </Field>
      </Modal>

      <Modal
        open={mergeOpen}
        onClose={() => setMergeOpen(false)}
        title="Fusiona amb una fitxa existent"
        description="La proposta es marcarà com a fusionada i no es crearà cap fitxa nova."
        footer={
          <>
            <Button variant="ghost" onClick={() => setMergeOpen(false)} disabled={working}>
              Cancel·la
            </Button>
            <Button onClick={handleMerge} disabled={working || !mergeTarget}>
              {working ? 'Fusionant…' : 'Fusiona la proposta'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {duplicate?.duplicate && duplicate.matchId ? (
            <button
              type="button"
              onClick={() => setMergeTarget(duplicate.matchId ?? '')}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-sm hover:bg-amber-100"
            >
              <span>
                <span className="block font-semibold text-ink">Possible duplicat detectat</span>
                <span className="text-xs text-slate-600">{duplicate.matchName}</span>
              </span>
              <ArrowRight className="size-4 text-amber-700" aria-hidden="true" />
            </button>
          ) : null}

          <Field id="merge-query" label="Cerca la fitxa de destí">
            <TextInput
              id="merge-query"
              value={mergeQuery}
              onChange={(event) => setMergeQuery(event.target.value)}
              placeholder="Nom o domini…"
            />
          </Field>

          <Field id="merge-target" label="Fitxa de destí" required>
            <Select
              id="merge-target"
              value={mergeTarget}
              onChange={(event) => setMergeTarget(event.target.value)}
            >
              <option value="">Tria una fitxa…</option>
              {mergeCandidates.map((tool) => (
                <option key={tool.id} value={tool.id}>
                  {tool.name} · {tool.domain}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            id="merge-reason"
            label="Motiu o nota de la fusió"
            optional
            hint="Quedarà registrat a l’historial."
          >
            <Textarea
              id="merge-reason"
              rows={3}
              value={mergeReason}
              onChange={(event) => setMergeReason(event.target.value)}
              placeholder="Mateixa eina, domini duplicat o nom comercial alternatiu…"
            />
          </Field>
        </div>
      </Modal>
    </div>
  )
}
