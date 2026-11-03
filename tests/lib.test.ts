import { describe, expect, it } from 'vitest'
import {
  canPublish,
  computeStats,
  filterTools,
  isPublicTool,
  parseCatalogFilters,
  sortTools,
  verificationState,
} from '../src/lib/catalog'
import { can, permissionsFor } from '../src/lib/permissions'
import {
  duplicateKeys,
  findProposalDuplicate,
  findToolDuplicate,
} from '../src/lib/duplicates'
import { parseProposalForm } from '../src/lib/schemas'
import {
  getDomain,
  normalizeNameForComparison,
  normalizeUrl,
  slugify,
} from '../src/lib/utils'
import type { Category, Proposal, Tool } from '../src/lib/types'

function makeTool(overrides: Partial<Tool> = {}): Tool {
  return {
    id: 'tool-1',
    name: 'Eina Exemple',
    slug: 'eina-exemple',
    normalizedName: 'eina exemple',
    officialUrl: 'https://exemple.cat',
    domain: 'exemple.cat',
    shortDescription: 'Descripció breu de l’eina.',
    fullDescription: 'Descripció completa de l’eina de prova.',
    educationalUses: 'Utilitats educatives de prova.',
    categoryId: 'altres',
    benefitType: 'pla-gratuit',
    accessConditions: 'Condicions d’accés de prova.',
    accessMethod: 'Mètode d’accés de prova.',
    signupInstructions: 'Instruccions de registre.',
    requiresInstitutionalEmail: null,
    requiresTeacherVerification: null,
    levels: ['primaria'],
    status: 'publicada',
    featured: false,
    popularity: 10,
    color: '#0F766E',
    lastVerifiedAt: '2026-01-01T00:00:00.000Z',
    nextReviewAt: '2026-07-01T00:00:00.000Z',
    officialSource: 'https://exemple.cat/condicions',
    verificationNotes: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    publishedAt: '2026-01-01T00:00:00.000Z',
    createdBy: 'admin',
    updatedBy: 'admin',
    ...overrides,
  } as Tool
}

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'altres',
    name: 'Altres',
    slug: 'altres',
    description: '',
    icon: 'shapes',
    color: '#64748B',
    active: true,
    order: 99,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Category
}

function makeProposal(overrides: Partial<Proposal> = {}): Proposal {
  return {
    id: 'prop-1',
    reference: 'EDU-2026-0001',
    name: 'Eina Exemple',
    normalizedName: 'eina exemple',
    officialUrl: 'https://exemple.cat',
    domain: 'exemple.cat',
    description: 'Descripció de la proposta de prova.',
    categoryId: 'altres',
    benefitType: 'pla-gratuit',
    accessMethod: 'Mètode d’accés de prova.',
    requiresInstitutionalEmail: null,
    requiresTeacherVerification: null,
    levels: ['primaria'],
    proposerName: '',
    proposerEmail: '',
    observations: '',
    status: 'pendent',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Proposal
}

describe('utils', () => {
  it('normalitza accents i majúscules per comparar noms', () => {
    expect(normalizeNameForComparison('  Canva  Educació ')).toBe('canva educacio')
    expect(slugify('Intel·ligència Artificial')).toBe('intel-ligencia-artificial')
  })

  it('normalitza URL i n’extreu el domini', () => {
    expect(normalizeUrl('https://www.Exemple.cat/educacio/')).toBe(
      'https://www.exemple.cat/educacio',
    )
    expect(normalizeUrl('exemple.cat')).toBe('https://exemple.cat')
    expect(getDomain('https://www.exemple.cat/ruta')).toBe('exemple.cat')
    expect(getDomain('')).toBe('')
  })
})

describe('duplicats', () => {
  it('genera claus de nom i domini', () => {
    expect(duplicateKeys('Eina Exemple', 'https://www.exemple.cat/a')).toEqual([
      'name:eina-exemple',
      'domain:exemple.cat',
    ])
  })

  it('detecta eines duplicades pel nom, ignorant accents', () => {
    const result = findToolDuplicate([makeTool()], 'EINA EXEMPLE', 'https://altres.cat')
    expect(result.duplicate).toBe(true)
    expect(result.kind).toBe('name')
    expect(result.matchId).toBe('tool-1')
  })

  it('detecta eines duplicades pel domini', () => {
    const result = findToolDuplicate([makeTool()], 'Una altra eina', 'https://www.exemple.cat')
    expect(result.duplicate).toBe(true)
    expect(result.kind).toBe('domain')
  })

  it('ignora les eines fusionades', () => {
    const result = findToolDuplicate(
      [makeTool({ mergedIntoId: 'tool-2' })],
      'Eina Exemple',
      'https://exemple.cat',
    )
    expect(result.duplicate).toBe(false)
  })

  it('detecta propostes actives però no les rebutjades', () => {
    expect(findProposalDuplicate([makeProposal()], 'Eina Exemple', '').duplicate).toBe(true)
    expect(
      findProposalDuplicate(
        [makeProposal({ status: 'rebutjada' })],
        'Eina Exemple',
        '',
      ).duplicate,
    ).toBe(false)
  })
})

describe('catàleg', () => {
  const now = new Date('2026-05-01T00:00:00.000Z')

  it('només considera públiques les eines publicades o per actualitzar', () => {
    expect(isPublicTool(makeTool({ status: 'publicada' }))).toBe(true)
    expect(isPublicTool(makeTool({ status: 'cal_actualitzar' }))).toBe(true)
    expect(isPublicTool(makeTool({ status: 'pendent' }))).toBe(false)
    expect(isPublicTool(makeTool({ status: 'no_vigent' }))).toBe(false)
    expect(isPublicTool(makeTool({ status: 'publicada', mergedIntoId: 'x' }))).toBe(false)
  })

  it('calcula l’estat de verificació', () => {
    expect(verificationState(makeTool({ lastVerifiedAt: null, nextReviewAt: null }), now)).toBe(
      'never',
    )
    expect(
      verificationState(
        makeTool({ nextReviewAt: '2026-04-01T00:00:00.000Z' }),
        now,
      ),
    ).toBe('overdue')
    expect(
      verificationState(
        makeTool({ nextReviewAt: '2026-05-15T00:00:00.000Z' }),
        now,
      ),
    ).toBe('due-soon')
    expect(
      verificationState(
        makeTool({ nextReviewAt: '2026-06-01T00:00:00.000Z' }),
        now,
      ),
    ).toBe('ok')
  })

  it('no permet publicar sense verificació vigent', () => {
    expect(canPublish(makeTool(), now)).toBe(true)
    expect(
      canPublish(makeTool({ nextReviewAt: '2026-04-01T00:00:00.000Z' }), now),
    ).toBe(false)
    expect(canPublish(makeTool({ lastVerifiedAt: null }), now)).toBe(false)
  })

  it('filtra per text, categoria, avantatge, nivell i estat', () => {
    const tools = [
      makeTool({ id: 'a', name: 'Canva', categoryId: 'disseny', levels: ['eso'] }),
      makeTool({
        id: 'b',
        name: 'Kahoot!',
        categoryId: 'gamificacio',
        benefitType: 'premium-docent',
        levels: ['primaria'],
        nextReviewAt: '2026-04-01T00:00:00.000Z',
      }),
      makeTool({ id: 'c', name: 'Oculta', status: 'pendent' }),
    ]
    const categories = [
      makeCategory({ id: 'disseny', name: 'Disseny' }),
      makeCategory({ id: 'gamificacio', name: 'Gamificació' }),
    ]

    expect(
      filterTools(tools, { ...parseCatalogFilters(new URLSearchParams()), q: 'canva' }, categories, now).map(
        (tool) => tool.id,
      ),
    ).toEqual(['a'])
    expect(
      filterTools(
        tools,
        { ...parseCatalogFilters(new URLSearchParams()), categories: ['gamificacio'] },
        categories,
        now,
      ).map((tool) => tool.id),
    ).toEqual(['b'])
    expect(
      filterTools(
        tools,
        { ...parseCatalogFilters(new URLSearchParams()), benefits: ['premium-docent'] },
        categories,
        now,
      ).map((tool) => tool.id),
    ).toEqual(['b'])
    expect(
      filterTools(
        tools,
        { ...parseCatalogFilters(new URLSearchParams()), levels: ['eso'] },
        categories,
        now,
      ).map((tool) => tool.id),
    ).toEqual(['a'])
    expect(
      filterTools(
        tools,
        { ...parseCatalogFilters(new URLSearchParams()), review: 'pendents' },
        categories,
        now,
      ).map((tool) => tool.id),
    ).toEqual(['b'])
  })

  it('ordena per nom, novetat i popularitat', () => {
    const tools = [
      makeTool({ id: 'a', name: 'Beta', popularity: 5, publishedAt: '2026-01-01T00:00:00.000Z' }),
      makeTool({ id: 'b', name: 'Alfa', popularity: 50, publishedAt: '2026-02-01T00:00:00.000Z' }),
      makeTool({ id: 'c', name: 'Gamma', popularity: 20, publishedAt: '2026-03-01T00:00:00.000Z' }),
    ]
    expect(sortTools(tools, 'az').map((tool) => tool.id)).toEqual(['b', 'a', 'c'])
    expect(sortTools(tools, 'popular').map((tool) => tool.id)).toEqual(['b', 'c', 'a'])
    expect(sortTools(tools, 'nous').map((tool) => tool.id)).toEqual(['c', 'b', 'a'])
  })

  it('llegeix i escriu els filtres de la URL', () => {
    const params = parseCatalogFilters(
      new URLSearchParams(
        'q=canva&categoria=disseny,altres&avantatge=premium-docent&nivell=eso&estat=pendents&ordre=nous',
      ),
    )
    expect(params).toEqual({
      q: 'canva',
      categories: ['disseny', 'altres'],
      benefits: ['premium-docent'],
      levels: ['eso'],
      review: 'pendents',
      sort: 'nous',
    })
    expect(
      parseCatalogFilters(new URLSearchParams('categoria=&avantatge=inventat&estat=res')),
    ).toEqual({
      q: '',
      categories: [],
      benefits: [],
      levels: [],
      review: 'totes',
      sort: 'az',
    })
  })

  it('compta eines, verificacions i categories amb contingut', () => {
    const tools = [
      makeTool({ id: 'a', categoryId: 'disseny' }),
      makeTool({ id: 'b', categoryId: 'altres', status: 'pendent' }),
      makeTool({ id: 'c', categoryId: 'altres', status: 'cal_actualitzar' }),
    ]
    const categories = [
      makeCategory({ id: 'disseny' }),
      makeCategory({ id: 'altres' }),
      makeCategory({ id: 'buida' }),
      makeCategory({ id: 'inactiva', active: false }),
    ]
    const stats = computeStats(tools, categories, now)
    expect(stats.total).toBe(2)
    expect(stats.verified).toBe(2)
    expect(stats.pending).toBe(2)
    expect(stats.categories).toBe(3)
    expect(stats.usedCategories).toBe(2)
  })
})

describe('permisos', () => {
  it('assigna permisos coherents per rol', () => {
    expect(can('superadmin', 'users.manage')).toBe(true)
    expect(can('admin', 'users.manage')).toBe(false)
    expect(can('admin', 'tools.publish')).toBe(true)
    expect(can('editor', 'tools.edit')).toBe(true)
    expect(can('editor', 'tools.publish')).toBe(false)
    expect(can('consultor', 'tools.view')).toBe(true)
    expect(can('consultor', 'proposals.review')).toBe(false)
    expect(can(null, 'tools.view')).toBe(false)
    expect(permissionsFor('admin')).not.toContain('settings.manage')
  })
})

describe('validació de propostes', () => {
  function formData(values: Record<string, string>) {
    const data = new FormData()
    for (const [key, value] of Object.entries(values)) data.set(key, value)
    return data
  }

  it('accepta una proposta completa i normalitza els camps', () => {
    const result = parseProposalForm(
      formData({
        name: 'Eina Nova',
        officialUrl: 'eina-nova.cat/educacio/',
        description: 'Una descripció prou llarga per superar el mínim exigit.',
        categoryId: 'altres',
        benefitType: 'pla-gratuit',
        accessMethod: 'Registre amb el correu del centre.',
        requiresInstitutionalEmail: 'si',
        requiresTeacherVerification: 'no-ho-se',
        levels: 'primaria',
        proposerName: 'Docent',
        proposerEmail: '',
        observations: '',
      }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.officialUrl).toBe('https://eina-nova.cat/educacio')
    expect(result.data.domain).toBe('eina-nova.cat')
    expect(result.data.requiresInstitutionalEmail).toBe(true)
    expect(result.data.requiresTeacherVerification).toBe(null)
  })

  it('retorna errors de camp en dades incorrectes', () => {
    const result = parseProposalForm(
      formData({
        name: 'A',
        officialUrl: 'no és una url',
        description: 'curta',
        categoryId: '',
        benefitType: 'inventat',
        accessMethod: 'curt',
        levels: '',
        proposerEmail: 'no-és-correu',
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(Object.keys(result.errors).sort()).toEqual(
      ['accessMethod', 'benefitType', 'categoryId', 'description', 'levels', 'name', 'officialUrl', 'proposerEmail'].sort(),
    )
  })
})
