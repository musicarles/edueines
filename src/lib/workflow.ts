import { REVIEW_MONTHS } from './constants'
import { addHistory } from './history'
import { canPublish } from './catalog'
import { duplicateKeys } from './duplicates'
import { getStore } from './store'
import type { ChangeReport, Proposal, Tool, ToolStatus, Verification } from './types'
import {
  addMonths,
  makeId,
  normalizeNameForComparison,
  nowIso,
  slugify,
  truncate,
} from './utils'

export interface Actor {
  uid: string
  name: string
}

export interface VerificationInput {
  verifiedAt: string
  source: string
  notes: string
}

export function dateInputToIso(value: string): string {
  if (!value) return nowIso()
  if (value.includes('T')) return new Date(value).toISOString()
  const parsed = new Date(`${value}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? nowIso() : parsed.toISOString()
}

export function toDateInputValue(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function uniqueToolId(name: string): Promise<string> {
  const store = await getStore()
  const base = slugify(name) || makeId('tool')
  let candidate = base
  let counter = 2
  while (await store.get<Tool>('tools', candidate)) {
    candidate = `${base}-${counter}`
    counter += 1
  }
  return candidate
}

async function recordVerification(
  tool: Tool,
  input: VerificationInput,
  actor: Actor,
): Promise<Verification> {
  const store = await getStore()
  const verificationId = makeId('ver')
  const verification: Verification = {
    id: verificationId,
    toolId: tool.id,
    toolName: tool.name,
    verifiedAt: tool.lastVerifiedAt ?? nowIso(),
    nextReviewAt: tool.nextReviewAt ?? nowIso(),
    source: input.source,
    notes: input.notes,
    adminUid: actor.uid,
    adminName: actor.name,
    createdAt: nowIso(),
  }
  await store.put('verifications', verificationId, verification)
  return verification
}

export async function approveProposal(
  proposal: Proposal,
  actor: Actor,
  publish: boolean,
): Promise<Tool> {
  const store = await getStore()
  const now = nowIso()
  const toolId = await uniqueToolId(proposal.name)
  const nextReviewAt = addMonths(now, REVIEW_MONTHS)

  const tool: Tool = {
    id: toolId,
    name: proposal.name,
    slug: toolId,
    normalizedName: normalizeNameForComparison(proposal.name),
    officialUrl: proposal.officialUrl,
    domain: proposal.domain,
    shortDescription: truncate(proposal.description, 180),
    fullDescription: proposal.description,
    educationalUses: proposal.description,
    categoryId: proposal.categoryId,
    benefitType: proposal.benefitType,
    accessConditions: proposal.accessMethod,
    accessMethod: proposal.accessMethod,
    signupInstructions: proposal.accessMethod,
    requiresInstitutionalEmail: proposal.requiresInstitutionalEmail,
    requiresTeacherVerification: proposal.requiresTeacherVerification,
    levels: proposal.levels,
    officialSource: proposal.officialUrl,
    verificationNotes: `Fitxa creada a partir de la proposta ${proposal.reference}. Cal completar les utilitats educatives i els passos de registre.`,
    status: publish ? 'publicada' : 'verificada',
    featured: false,
    popularity: 0,
    color: '#0f766e',
    lastVerifiedAt: now,
    nextReviewAt,
    createdAt: now,
    updatedAt: now,
    publishedAt: publish ? now : null,
    proposalId: proposal.id,
    archivedReason: '',
    mergedIntoId: null,
  }

  await store.put('tools', toolId, tool)
  await recordVerification(
    tool,
    {
      verifiedAt: now,
      source: proposal.officialUrl,
      notes: 'Verificació inicial en aprovar la proposta.',
    },
    actor,
  )
  await store.patch<Proposal>('proposals', proposal.id, {
    status: 'aprovada',
    toolId,
    reviewedBy: actor.uid,
    reviewedByName: actor.name,
    reviewedAt: now,
    updatedAt: now,
    rejectionReason: '',
  })
  await addHistory({
    entityType: 'proposta',
    entityId: proposal.id,
    entityName: proposal.name,
    action: 'aprovada',
    summary: publish
      ? `Proposta aprovada, verificada i publicada com a «${tool.name}».`
      : `Proposta aprovada i verificada. La fitxa queda com a verificada, pendent de publicar.`,
    actorUid: actor.uid,
    actorName: actor.name,
    changes: [],
  })
  await addHistory({
    entityType: 'eina',
    entityId: tool.id,
    entityName: tool.name,
    action: 'creada',
    summary: `Fitxa creada a partir de la proposta ${proposal.reference}.`,
    actorUid: actor.uid,
    actorName: actor.name,
    changes: [],
  })
  return tool
}

export async function rejectProposal(
  proposal: Proposal,
  reason: string,
  actor: Actor,
): Promise<void> {
  const store = await getStore()
  const now = nowIso()
  await store.patch<Proposal>('proposals', proposal.id, {
    status: 'rebutjada',
    rejectionReason: reason.trim(),
    reviewedBy: actor.uid,
    reviewedByName: actor.name,
    reviewedAt: now,
    updatedAt: now,
  })
  await store.releaseKeys(duplicateKeys(proposal.name, proposal.officialUrl))
  await addHistory({
    entityType: 'proposta',
    entityId: proposal.id,
    entityName: proposal.name,
    action: 'rebutjada',
    summary: `Proposta rebutjada: ${reason.trim() || 'sense motiu especificat'}.`,
    actorUid: actor.uid,
    actorName: actor.name,
    changes: [],
  })
}

export async function mergeProposalInto(
  proposal: Proposal,
  target: Tool,
  actor: Actor,
  reason = '',
): Promise<void> {
  const store = await getStore()
  const now = nowIso()
  await store.patch<Proposal>('proposals', proposal.id, {
    status: 'fusionada',
    mergedIntoId: target.id,
    toolId: target.id,
    reviewedBy: actor.uid,
    reviewedByName: actor.name,
    reviewedAt: now,
    updatedAt: now,
  })
  await store.releaseKeys(duplicateKeys(proposal.name, proposal.officialUrl))
  await addHistory({
    entityType: 'proposta',
    entityId: proposal.id,
    entityName: proposal.name,
    action: 'fusionada',
    summary: `Proposta fusionada amb la fitxa existent «${target.name}».${
      reason.trim() ? ` Motiu: ${reason.trim()}` : ''
    }`,
    actorUid: actor.uid,
    actorName: actor.name,
    changes: [],
  })
}

export async function markProposalInReview(
  proposal: Proposal,
  actor: Actor,
): Promise<void> {
  const store = await getStore()
  const now = nowIso()
  await store.patch<Proposal>('proposals', proposal.id, {
    status: 'en_revisio',
    reviewedBy: actor.uid,
    reviewedByName: actor.name,
    reviewedAt: now,
    updatedAt: now,
  })
  await addHistory({
    entityType: 'proposta',
    entityId: proposal.id,
    entityName: proposal.name,
    action: 'en_revisio',
    summary: 'La proposta s’ha marcat en revisió.',
    actorUid: actor.uid,
    actorName: actor.name,
    changes: [],
  })
}

export async function verifyTool(
  tool: Tool,
  input: VerificationInput,
  actor: Actor,
): Promise<Tool> {
  const store = await getStore()
  const verifiedAt = dateInputToIso(input.verifiedAt)
  const nextReviewAt = addMonths(verifiedAt, REVIEW_MONTHS)
  const wasPublished = tool.status === 'publicada' || tool.status === 'cal_actualitzar'
  const status: ToolStatus =
    tool.status === 'no_vigent' ? 'no_vigent' : wasPublished ? 'publicada' : 'verificada'
  const updated: Tool = {
    ...tool,
    lastVerifiedAt: verifiedAt,
    nextReviewAt,
    status,
    officialSource: input.source || tool.officialSource,
    verificationNotes: input.notes || tool.verificationNotes,
    updatedAt: nowIso(),
  }
  await store.put('tools', tool.id, updated)
  await recordVerification(updated, { ...input, verifiedAt }, actor)
  await addHistory({
    entityType: 'eina',
    entityId: tool.id,
    entityName: tool.name,
    action: 'verificada',
    summary: `Verificació registrada amb data ${new Intl.DateTimeFormat('ca-ES', {
      dateStyle: 'long',
    }).format(new Date(verifiedAt))}. Propera revisió: ${new Intl.DateTimeFormat('ca-ES', {
      dateStyle: 'long',
    }).format(new Date(nextReviewAt))}.`,
    actorUid: actor.uid,
    actorName: actor.name,
    changes: [],
  })
  return updated
}

export async function publishTool(tool: Tool, actor: Actor): Promise<Tool> {
  if (!canPublish(tool)) {
    throw new Error(
      'Cal verificar la fitxa (amb una verificació de menys de sis mesos) abans de publicar-la.',
    )
  }
  const store = await getStore()
  const updated: Tool = {
    ...tool,
    status: 'publicada',
    publishedAt: tool.publishedAt ?? nowIso(),
    updatedAt: nowIso(),
  }
  await store.put('tools', tool.id, updated)
  await addHistory({
    entityType: 'eina',
    entityId: tool.id,
    entityName: tool.name,
    action: 'publicada',
    summary: 'La fitxa s’ha publicat al catàleg.',
    actorUid: actor.uid,
    actorName: actor.name,
    changes: [],
  })
  return updated
}

export async function unpublishTool(tool: Tool, actor: Actor): Promise<Tool> {
  const store = await getStore()
  const updated: Tool = {
    ...tool,
    status: 'verificada',
    publishedAt: null,
    updatedAt: nowIso(),
  }
  await store.put('tools', tool.id, updated)
  await addHistory({
    entityType: 'eina',
    entityId: tool.id,
    entityName: tool.name,
    action: 'retirada',
    summary: 'La fitxa s’ha retirat del catàleg públic i queda com a verificada.',
    actorUid: actor.uid,
    actorName: actor.name,
    changes: [],
  })
  return updated
}

export async function archiveTool(
  tool: Tool,
  reason: string,
  actor: Actor,
): Promise<Tool> {
  const store = await getStore()
  const updated: Tool = {
    ...tool,
    status: 'no_vigent',
    archivedReason: reason.trim() || 'Sense motiu especificat.',
    updatedAt: nowIso(),
  }
  await store.put('tools', tool.id, updated)
  await addHistory({
    entityType: 'eina',
    entityId: tool.id,
    entityName: tool.name,
    action: 'arxivada',
    summary: `Fitxa marcada com a no vigent: ${updated.archivedReason}`,
    actorUid: actor.uid,
    actorName: actor.name,
    changes: [],
  })
  return updated
}

export async function restoreTool(tool: Tool, actor: Actor): Promise<Tool> {
  const store = await getStore()
  const status: ToolStatus = canPublish(tool) ? 'publicada' : 'verificada'
  const updated: Tool = {
    ...tool,
    status,
    archivedReason: '',
    mergedIntoId: null,
    updatedAt: nowIso(),
  }
  await store.put('tools', tool.id, updated)
  await addHistory({
    entityType: 'eina',
    entityId: tool.id,
    entityName: tool.name,
    action: 'restaurada',
    summary:
      status === 'publicada'
        ? 'La fitxa s’ha restaurat i torna a ser visible al catàleg.'
        : 'La fitxa s’ha restaurat, però queda com a verificada fins que es torni a publicar.',
    actorUid: actor.uid,
    actorName: actor.name,
    changes: [],
  })
  return updated
}

export async function mergeTools(
  source: Tool,
  target: Tool,
  actor: Actor,
  reason: string,
): Promise<void> {
  const store = await getStore()
  const updated: Tool = {
    ...source,
    status: 'no_vigent',
    mergedIntoId: target.id,
    archivedReason: `Fusionada amb «${target.name}». ${reason.trim()}`.trim(),
    updatedAt: nowIso(),
  }
  await store.put('tools', source.id, updated)
  await addHistory({
    entityType: 'eina',
    entityId: source.id,
    entityName: source.name,
    action: 'fusionada',
    summary: `Fitxa fusionada amb «${target.name}». ${reason.trim()}`.trim(),
    actorUid: actor.uid,
    actorName: actor.name,
    changes: [],
  })
}

export async function resolveReport(
  report: ChangeReport,
  actor: Actor,
): Promise<void> {
  const store = await getStore()
  const now = nowIso()
  await store.patch<ChangeReport>('reports', report.id, {
    status: 'resolt',
    resolvedAt: now,
    resolvedBy: actor.name,
  })
  await addHistory({
    entityType: 'avís',
    entityId: report.id,
    entityName: report.toolName,
    action: 'resolt',
    summary: `Avís de canvi marcat com a resolt per a «${report.toolName}».`,
    actorUid: actor.uid,
    actorName: actor.name,
    changes: [],
  })
}

export async function reopenReport(
  report: ChangeReport,
  actor: Actor,
): Promise<void> {
  const store = await getStore()
  await store.patch<ChangeReport>('reports', report.id, {
    status: 'nou',
    resolvedAt: null,
    resolvedBy: '',
  })
  await addHistory({
    entityType: 'avís',
    entityId: report.id,
    entityName: report.toolName,
    action: 'reobert',
    summary: `Avís de canvi reobert per a «${report.toolName}».`,
    actorUid: actor.uid,
    actorName: actor.name,
    changes: [],
  })
}

export async function deleteTool(tool: Tool, actor: Actor): Promise<void> {
  const store = await getStore()
  await store.remove('tools', tool.id)
  await addHistory({
    entityType: 'eina',
    entityId: tool.id,
    entityName: tool.name,
    action: 'eliminada',
    summary: 'La fitxa s’ha eliminat definitivament.',
    actorUid: actor.uid,
    actorName: actor.name,
    changes: [],
  })
}
