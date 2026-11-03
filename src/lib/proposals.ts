import { getStore } from './store'
import type { Tool } from './types'
import { findToolDuplicate, type DuplicateCheck } from './duplicates'
import type { ProposalInput } from './schemas'
import type { Proposal } from './types'
import { generateReference, makeId, nowIso } from './utils'

export class DuplicateError extends Error {
  readonly check: DuplicateCheck

  constructor(check: DuplicateCheck) {
    super(check.label)
    this.name = 'DuplicateError'
    this.check = check
  }
}

export async function createProposal(input: ProposalInput): Promise<Proposal> {
  const store = await getStore()

  const tools = await store.getAll<Tool>('tools')
  const toolDuplicate = findToolDuplicate(tools, input.name, input.officialUrl)
  if (toolDuplicate.duplicate) {
    throw new DuplicateError(toolDuplicate)
  }

  const id = makeId('prop')
  const keys = [
    `name:${input.normalizedName.replace(/\s+/g, '-')}`,
    `domain:${input.domain}`,
  ].filter((key) => !key.endsWith(':'))

  const taken = await store.reserveKeys(keys, id)
  if (taken.length > 0) {
    const kind = taken[0].startsWith('name:') ? 'name' : 'domain'
    throw new DuplicateError({
      duplicate: true,
      kind,
      label:
        kind === 'name'
          ? 'Ja existeix una proposta amb un nom molt semblant. Si creus que és un error, contacta amb l’equip administrador.'
          : 'Aquest domini ja té una proposta registrada. Si creus que és un error, contacta amb l’equip administrador.',
      matchId: null,
      matchName: null,
    })
  }

  const now = nowIso()
  const proposal: Proposal = {
    id,
    name: input.name,
    normalizedName: input.normalizedName,
    officialUrl: input.officialUrl,
    domain: input.domain,
    description: input.description,
    categoryId: input.categoryId,
    benefitType: input.benefitType,
    accessMethod: input.accessMethod,
    requiresInstitutionalEmail: input.requiresInstitutionalEmail,
    requiresTeacherVerification: input.requiresTeacherVerification,
    levels: input.levels,
    proposerName: input.proposerName,
    proposerEmail: input.proposerEmail,
    observations: input.observations,
    status: 'pendent',
    createdAt: now,
    updatedAt: now,
    reviewedBy: '',
    reviewedByName: '',
    reviewedAt: null,
    rejectionReason: '',
    toolId: null,
    mergedIntoId: null,
    reference: generateReference(),
  }

  try {
    await store.put('proposals', id, proposal)
  } catch (error) {
    await store.releaseKeys(keys).catch(() => undefined)
    throw error
  }

  return proposal
}
