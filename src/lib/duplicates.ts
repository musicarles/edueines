import type { Proposal, Tool } from './types'
import { getDomain, normalizeNameForComparison, slugify } from './utils'

export type DuplicateKind = 'name' | 'domain'

export interface DuplicateCheck {
  duplicate: boolean
  kind: DuplicateKind | null
  label: string
  matchId: string | null
  matchName: string | null
}

export const NO_DUPLICATE: DuplicateCheck = {
  duplicate: false,
  kind: null,
  label: '',
  matchId: null,
  matchName: null,
}

export function duplicateKeys(name: string, url: string): string[] {
  const keys: string[] = []
  const nameKey = slugify(name)
  const domain = getDomain(url)
  if (nameKey) keys.push(`name:${nameKey}`)
  if (domain) keys.push(`domain:${domain}`)
  return keys
}

export function duplicateKeyLabels(name: string, url: string): string[] {
  const labels: string[] = []
  if (slugify(name)) labels.push('nom de l’eina')
  if (getDomain(url)) labels.push('domini web')
  return labels
}

export function findToolDuplicate(tools: Tool[], name: string, url: string): DuplicateCheck {
  const normalizedName = normalizeNameForComparison(name)
  const domain = getDomain(url)
  const nameMatch = tools.find(
    (tool) =>
      !tool.mergedIntoId &&
      normalizeNameForComparison(tool.name) === normalizedName,
  )
  if (nameMatch) {
    return {
      duplicate: true,
      kind: 'name',
      label: `Ja existeix una eina amb el nom «${nameMatch.name}».`,
      matchId: nameMatch.id,
      matchName: nameMatch.name,
    }
  }
  if (domain) {
    const domainMatch = tools.find(
      (tool) => !tool.mergedIntoId && tool.domain === domain,
    )
    if (domainMatch) {
      return {
        duplicate: true,
        kind: 'domain',
        label: `El domini ${domain} ja consta al catàleg com a «${domainMatch.name}».`,
        matchId: domainMatch.id,
        matchName: domainMatch.name,
      }
    }
  }
  return NO_DUPLICATE
}

export function findProposalDuplicate(
  proposals: Proposal[],
  name: string,
  url: string,
  excludeId?: string,
): DuplicateCheck {
  const normalizedName = normalizeNameForComparison(name)
  const domain = getDomain(url)
  const active = proposals.filter(
    (proposal) =>
      proposal.id !== excludeId &&
      proposal.status !== 'rebutjada' &&
      proposal.status !== 'fusionada',
  )
  const nameMatch = active.find(
    (proposal) => normalizeNameForComparison(proposal.name) === normalizedName,
  )
  if (nameMatch) {
    return {
      duplicate: true,
      kind: 'name',
      label: `Ja hi ha una proposta amb aquest nom (${nameMatch.reference}).`,
      matchId: nameMatch.id,
      matchName: nameMatch.name,
    }
  }
  if (domain) {
    const domainMatch = active.find((proposal) => proposal.domain === domain)
    if (domainMatch) {
      return {
        duplicate: true,
        kind: 'domain',
        label: `Ja hi ha una proposta per a aquest domini (${domainMatch.reference}).`,
        matchId: domainMatch.id,
        matchName: domainMatch.name,
      }
    }
  }
  return NO_DUPLICATE
}
