import { z } from 'zod'
import { BENEFIT_KEYS, LEVEL_VALUES, ROLES } from './constants'
import type {
  BenefitType,
  EducationLevel,
  Role,
  ToolStatus,
} from './types'
import { getDomain, isValidHttpUrl, normalizeNameForComparison, normalizeUrl } from './utils'

const yesNoUnknown = z.enum(['si', 'no', 'no-ho-se'])

const levelSchema = z.enum(
  LEVEL_VALUES as [EducationLevel, ...EducationLevel[]],
)

const benefitSchema = z.enum(BENEFIT_KEYS as [BenefitType, ...BenefitType[]])

const toolStatusSchema = z.enum([
  'pendent',
  'verificada',
  'publicada',
  'cal_actualitzar',
  'no_vigent',
])

const roleSchema = z.enum(
  Object.keys(ROLES) as [Role, ...Role[]],
)

const emailSchema = z
  .string()
  .trim()
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Escriu un correu electrònic vàlid.')

const optionalEmailSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    'Escriu un correu electrònic vàlid o deixa el camp buit.',
  )

const urlSchema = z
  .string()
  .trim()
  .min(1, 'Cal indicar l’URL oficial de l’eina.')
  .refine(
    (value) => isValidHttpUrl(normalizeUrl(value)),
    'Cal indicar una adreça web vàlida, per exemple https://exemple.cat.',
  )

function toBoolean(value: 'si' | 'no' | 'no-ho-se'): boolean | null {
  if (value === 'si') return true
  if (value === 'no') return false
  return null
}

export const proposalFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'El nom ha de tenir com a mínim 2 caràcters.')
      .max(120, 'El nom no pot superar els 120 caràcters.'),
    officialUrl: urlSchema,
    description: z
      .string()
      .trim()
      .min(20, 'Descriu l’eina i la seva utilitat educativa en almenys 20 caràcters.')
      .max(3000, 'La descripció no pot superar els 3.000 caràcters.'),
    categoryId: z.string().trim().min(1, 'Tria una categoria.'),
    benefitType: benefitSchema,
    accessMethod: z
      .string()
      .trim()
      .min(10, 'Explica com s’hi pot accedir en almenys 10 caràcters.')
      .max(1500, 'Aquest camp no pot superar els 1.500 caràcters.'),
    requiresInstitutionalEmail: yesNoUnknown,
    requiresTeacherVerification: yesNoUnknown,
    levels: z
      .array(levelSchema)
      .min(1, 'Selecciona almenys un nivell educatiu.'),
    proposerName: z
      .string()
      .trim()
      .max(120, 'El nom no pot superar els 120 caràcters.')
      .optional()
      .default(''),
    proposerEmail: optionalEmailSchema.optional().default(''),
    observations: z
      .string()
      .trim()
      .max(2000, 'Les observacions no poden superar els 2.000 caràcters.')
      .optional()
      .default(''),
  })
  .transform((value) => ({
    name: value.name,
    normalizedName: normalizeNameForComparison(value.name),
    officialUrl: normalizeUrl(value.officialUrl),
    domain: getDomain(value.officialUrl),
    description: value.description,
    categoryId: value.categoryId,
    benefitType: value.benefitType,
    accessMethod: value.accessMethod,
    requiresInstitutionalEmail: toBoolean(value.requiresInstitutionalEmail),
    requiresTeacherVerification: toBoolean(value.requiresTeacherVerification),
    levels: value.levels,
    proposerName: value.proposerName ?? '',
    proposerEmail: value.proposerEmail ?? '',
    observations: value.observations ?? '',
  }))

export type ProposalInput = z.infer<typeof proposalFormSchema>

export const toolFormSchema = z
  .object({
    name: z.string().trim().min(2, 'El nom ha de tenir com a mínim 2 caràcters.').max(120),
    officialUrl: urlSchema,
    shortDescription: z
      .string()
      .trim()
      .min(15, 'La descripció breu ha de tenir com a mínim 15 caràcters.')
      .max(240, 'La descripció breu no pot superar els 240 caràcters.'),
    fullDescription: z
      .string()
      .trim()
      .min(30, 'La descripció completa ha de tenir com a mínim 30 caràcters.')
      .max(4000, 'La descripció completa no pot superar els 4.000 caràcters.'),
    educationalUses: z
      .string()
      .trim()
      .min(20, 'Indica algunes utilitats educatives.')
      .max(3000),
    categoryId: z.string().trim().min(1, 'Tria una categoria.'),
    benefitType: benefitSchema,
    accessConditions: z
      .string()
      .trim()
      .min(20, 'Descriu les condicions d’accés.')
      .max(3000),
    accessMethod: z
      .string()
      .trim()
      .min(10, 'Explica com s’hi pot accedir.')
      .max(1500),
    signupInstructions: z
      .string()
      .trim()
      .min(10, 'Indica els passos per registrar-s’hi.')
      .max(3000),
    officialSource: urlSchema,
    verificationNotes: z.string().trim().max(2000).optional().default(''),
    requiresInstitutionalEmail: yesNoUnknown,
    requiresTeacherVerification: yesNoUnknown,
    levels: z.array(levelSchema).min(1, 'Selecciona almenys un nivell educatiu.'),
    status: toolStatusSchema,
    featured: z.boolean().optional().default(false),
    popularity: z.coerce.number().min(0).max(100).optional().default(0),
    color: z
      .string()
      .trim()
      .regex(/^#[0-9a-fA-F]{6}$/, 'El color ha de tenir el format #RRGGBB.'),
  })
  .transform((value) => ({
    name: value.name,
    slug: normalizeNameForComparison(value.name).replace(/\s+/g, '-'),
    normalizedName: normalizeNameForComparison(value.name),
    officialUrl: normalizeUrl(value.officialUrl),
    domain: getDomain(value.officialUrl),
    shortDescription: value.shortDescription,
    fullDescription: value.fullDescription,
    educationalUses: value.educationalUses,
    categoryId: value.categoryId,
    benefitType: value.benefitType,
    accessConditions: value.accessConditions,
    accessMethod: value.accessMethod,
    signupInstructions: value.signupInstructions,
    officialSource: normalizeUrl(value.officialSource),
    verificationNotes: value.verificationNotes ?? '',
    requiresInstitutionalEmail: toBoolean(value.requiresInstitutionalEmail),
    requiresTeacherVerification: toBoolean(value.requiresTeacherVerification),
    levels: value.levels,
    status: value.status,
    featured: value.featured ?? false,
    popularity: value.popularity ?? 0,
    color: value.color.toUpperCase(),
  }))

export type ToolInput = z.infer<typeof toolFormSchema>

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nom de la categoria ha de tenir com a mínim 2 caràcters.')
    .max(60, 'El nom no pot superar els 60 caràcters.'),
  description: z
    .string()
    .trim()
    .max(240, 'La descripció no pot superar els 240 caràcters.')
    .optional()
    .default(''),
  icon: z.string().trim().min(1, 'Tria una icona.').optional().default('shapes'),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'El color ha de tenir el format #RRGGBB.'),
  active: z.boolean().optional().default(true),
})

export type CategoryInput = z.infer<typeof categoryFormSchema>

export const reportFormSchema = z
  .object({
    toolId: z.string().trim().min(1),
    toolName: z.string().trim().min(1),
    message: z
      .string()
      .trim()
      .min(10, 'Explica el canvi en almenys 10 caràcters.')
      .max(1200, 'El missatge no pot superar els 1.200 caràcters.'),
    reporterEmail: optionalEmailSchema.optional().default(''),
  })
  .transform((value) => ({
    toolId: value.toolId,
    toolName: value.toolName,
    message: value.message,
    reporterEmail: value.reporterEmail ?? '',
  }))

export type ReportInput = z.infer<typeof reportFormSchema>

export const adminUserFormSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'L’usuari ha de tenir com a mínim 3 caràcters.')
      .regex(/^[a-zA-Z0-9._-]+$/, 'L’usuari només pot contenir lletres, números, punts, guions i guions baixos.'),
    displayName: z.string().trim().min(2, 'Indica un nom visible.').max(80),
    email: emailSchema,
    role: roleSchema,
    active: z.boolean().optional().default(true),
    password: z
      .string()
      .trim()
      .max(120)
      .optional()
      .default(''),
  })
  .refine((value) => value.password === '' || value.password.length >= 8, {
    message: 'La contrasenya ha de tenir com a mínim 8 caràcters.',
    path: ['password'],
  })

export type AdminUserInput = z.infer<typeof adminUserFormSchema>

export const inviteFormSchema = z.object({
  email: emailSchema,
  displayName: z.string().trim().min(2, 'Indica un nom visible.').max(80),
  role: roleSchema,
})

export type InviteInput = z.infer<typeof inviteFormSchema>

export type FieldErrors = Record<string, string>

export function fieldErrors(error: z.ZodError): FieldErrors {
  const output: FieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !output[key]) {
      output[key] = issue.message
    }
  }
  return output
}

export function parseProposalForm(formData: FormData):
  | { ok: true; data: ProposalInput }
  | { ok: false; errors: FieldErrors } {
  const raw = {
    name: String(formData.get('name') ?? ''),
    officialUrl: String(formData.get('officialUrl') ?? ''),
    description: String(formData.get('description') ?? ''),
    categoryId: String(formData.get('categoryId') ?? ''),
    benefitType: String(formData.get('benefitType') ?? ''),
    accessMethod: String(formData.get('accessMethod') ?? ''),
    requiresInstitutionalEmail: String(formData.get('requiresInstitutionalEmail') ?? 'no-ho-se'),
    requiresTeacherVerification: String(formData.get('requiresTeacherVerification') ?? 'no-ho-se'),
    levels: formData.getAll('levels').map(String),
    proposerName: String(formData.get('proposerName') ?? ''),
    proposerEmail: String(formData.get('proposerEmail') ?? ''),
    observations: String(formData.get('observations') ?? ''),
  }
  const result = proposalFormSchema.safeParse(raw)
  if (!result.success) return { ok: false, errors: fieldErrors(result.error) }
  return { ok: true, data: result.data }
}

export function parseToolForm(formData: FormData):
  | { ok: true; data: ToolInput }
  | { ok: false; errors: FieldErrors } {
  const raw = {
    name: String(formData.get('name') ?? ''),
    officialUrl: String(formData.get('officialUrl') ?? ''),
    shortDescription: String(formData.get('shortDescription') ?? ''),
    fullDescription: String(formData.get('fullDescription') ?? ''),
    educationalUses: String(formData.get('educationalUses') ?? ''),
    categoryId: String(formData.get('categoryId') ?? ''),
    benefitType: String(formData.get('benefitType') ?? ''),
    accessConditions: String(formData.get('accessConditions') ?? ''),
    accessMethod: String(formData.get('accessMethod') ?? ''),
    signupInstructions: String(formData.get('signupInstructions') ?? ''),
    officialSource: String(formData.get('officialSource') ?? ''),
    verificationNotes: String(formData.get('verificationNotes') ?? ''),
    requiresInstitutionalEmail: String(formData.get('requiresInstitutionalEmail') ?? 'no-ho-se'),
    requiresTeacherVerification: String(formData.get('requiresTeacherVerification') ?? 'no-ho-se'),
    levels: formData.getAll('levels').map(String),
    status: String(formData.get('status') ?? 'pendent') as ToolStatus,
    featured: formData.get('featured') === 'on',
    popularity: String(formData.get('popularity') ?? '0'),
    color: String(formData.get('color') ?? '#0f766e'),
  }
  const result = toolFormSchema.safeParse(raw)
  if (!result.success) return { ok: false, errors: fieldErrors(result.error) }
  return { ok: true, data: result.data }
}

export function parseCategoryForm(formData: FormData) {
  const raw = {
    name: String(formData.get('name') ?? ''),
    description: String(formData.get('description') ?? ''),
    icon: String(formData.get('icon') ?? 'shapes'),
    color: String(formData.get('color') ?? '#64748b'),
    active: formData.get('active') === 'on' || formData.get('active') === 'true',
  }
  const result = categoryFormSchema.safeParse(raw)
  if (!result.success) return { ok: false as const, errors: fieldErrors(result.error) }
  return { ok: true as const, data: result.data }
}
