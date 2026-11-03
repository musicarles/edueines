import type {
  BenefitType,
  Category,
  EducationLevel,
  ProposalStatus,
  Role,
  ToolStatus,
} from './types'

export const APP_NAME = 'Edueines'
export const REVIEW_MONTHS = 6
export const REVIEW_WARNING_DAYS = 30

export const CATEGORIES: Category[] = [
  {
    id: 'intelligencia-artificial',
    name: "Intel·ligència artificial",
    slug: 'intelligencia-artificial',
    description: 'Assistents, generadors i eines amb IA aplicades a l’educació.',
    icon: 'sparkles',
    color: '#6366f1',
    order: 1,
    active: true,
  },
  {
    id: 'disseny-grafic',
    name: 'Disseny i creació gràfica',
    slug: 'disseny-grafic',
    description: 'Disseny, imatge, infografia i comunicació visual.',
    icon: 'palette',
    color: '#ec4899',
    order: 2,
    active: true,
  },
  {
    id: 'presentacions',
    name: 'Presentacions',
    slug: 'presentacions',
    description: 'Presentacions, infografies i continguts visuals interactius.',
    icon: 'presentation',
    color: '#f97316',
    order: 3,
    active: true,
  },
  {
    id: 'gamificacio',
    name: 'Gamificació',
    slug: 'gamificacio',
    description: 'Jocs, reptes i dinàmiques per motivar l’aprenentatge.',
    icon: 'gamepad',
    color: '#8b5cf6',
    order: 4,
    active: true,
  },
  {
    id: 'avaluacio',
    name: 'Avaluació i qüestionaris',
    slug: 'avaluacio',
    description: 'Qüestionaris, rúbriques, formularis i avaluació formativa.',
    icon: 'clipboard-check',
    color: '#0ea5e9',
    order: 5,
    active: true,
  },
  {
    id: 'creacio-continguts',
    name: 'Creació de continguts',
    slug: 'creacio-continguts',
    description: 'Llibres digitals, webs, materials i projectes creatius.',
    icon: 'pen-tool',
    color: '#14b8a6',
    order: 6,
    active: true,
  },
  {
    id: 'productivitat',
    name: 'Productivitat i organització',
    slug: 'productivitat',
    description: 'Notes, tasques, documents i organització del treball.',
    icon: 'check-square',
    color: '#10b981',
    order: 7,
    active: true,
  },
  {
    id: 'gestio-aula',
    name: "Gestió d'aula",
    slug: 'gestio-aula',
    description: 'Organització de grups, recursos i comunicació amb l’alumnat.',
    icon: 'users',
    color: '#3b82f6',
    order: 8,
    active: true,
  },
  {
    id: 'video-audio',
    name: 'Vídeo i àudio',
    slug: 'video-audio',
    description: 'Edició, gravació i publicació de continguts audiovisuals.',
    icon: 'clapperboard',
    color: '#ef4444',
    order: 9,
    active: true,
  },
  {
    id: 'pissarres-digitals',
    name: 'Pissarres digitals',
    slug: 'pissarres-digitals',
    description: 'Pissarres col·laboratives i espais de treball visual.',
    icon: 'layout-dashboard',
    color: '#06b6d4',
    order: 10,
    active: true,
  },
  {
    id: 'lectura-escriptura',
    name: 'Lectura i escriptura',
    slug: 'lectura-escriptura',
    description: 'Lectura, escriptura, comprensió i expressió escrita.',
    icon: 'book-open',
    color: '#84cc16',
    order: 11,
    active: true,
  },
  {
    id: 'altres',
    name: 'Altres',
    slug: 'altres',
    description: 'Eines útils que no encaixen en cap altra categoria.',
    icon: 'shapes',
    color: '#64748b',
    order: 12,
    active: true,
  },
]

export const BENEFIT_KEYS: BenefitType[] = [
  'premium-docent',
  'llicencia-educativa',
  'pla-gratuit',
  'descompte',
  'altres',
]

export const BENEFITS: Record<
  BenefitType,
  {
    label: string
    short: string
    description: string
    icon: string
    badge: string
  }
> = {
  'premium-docent': {
    label: 'Versió premium gratuïta per a docents',
    short: 'Premium gratuïta',
    description:
      'El pla de pagament s’ofereix sense cost per a docents que compleixin els requisits.',
    icon: 'crown',
    badge: 'bg-violet-50 text-violet-800 ring-violet-200',
  },
  'llicencia-educativa': {
    label: 'Llicència educativa gratuïta',
    short: 'Llicència educativa',
    description:
      'L’eina ofereix un pla educatiu gratuït, sovint amb verificació del centre o del correu.',
    icon: 'badge-check',
    badge: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  },
  'pla-gratuit': {
    label: 'Pla gratuït amb funcionalitats limitades',
    short: 'Pla gratuït',
    description:
      'Hi ha accés gratuït, però amb límits de funcions, generacions o nombre d’usuaris.',
    icon: 'gift',
    badge: 'bg-sky-50 text-sky-800 ring-sky-200',
  },
  descompte: {
    label: 'Descompte especial per a docents',
    short: 'Descompte',
    description:
      'S’aplica un descompte sobre el preu habitual per a professorat o centres educatius.',
    icon: 'percent',
    badge: 'bg-amber-50 text-amber-800 ring-amber-200',
  },
  altres: {
    label: 'Altres avantatges educatius',
    short: 'Altres avantatges',
    description:
      'Formació, recursos, plantilles o condicions especials per a l’àmbit educatiu.',
    icon: 'sparkle',
    badge: 'bg-teal-50 text-teal-800 ring-teal-200',
  },
}

export const LEVELS: Array<{ value: EducationLevel; label: string; short: string }> = [
  { value: 'infantil', label: 'Educació infantil', short: 'Infantil' },
  { value: 'primaria', label: 'Educació primària', short: 'Primària' },
  { value: 'eso', label: 'Educació secundària obligatòria', short: 'ESO' },
  { value: 'batxillerat', label: 'Batxillerat', short: 'Batxillerat' },
  { value: 'fp', label: 'Formació professional', short: 'FP' },
  { value: 'superior', label: 'Educació superior', short: 'Superior' },
  { value: 'adults', label: "Educació d'adults", short: 'Adults' },
  { value: 'altres', label: 'Altres contextos educatius', short: 'Altres' },
]

export const LEVEL_VALUES = LEVELS.map((level) => level.value)

export const TOOL_STATUSES: Record<
  ToolStatus,
  { label: string; description: string; badge: string; dot: string }
> = {
  pendent: {
    label: 'Pendent de revisió',
    description:
      'La fitxa encara no ha estat revisada per l’equip administrador i no es mostra al catàleg públic.',
    badge: 'bg-amber-50 text-amber-800 ring-amber-200',
    dot: 'bg-amber-500',
  },
  verificada: {
    label: 'Verificada',
    description:
      'La informació s’ha comprovat, però la fitxa encara no s’ha publicat al catàleg.',
    badge: 'bg-sky-50 text-sky-800 ring-sky-200',
    dot: 'bg-sky-500',
  },
  publicada: {
    label: 'Publicada',
    description:
      'La fitxa és visible al catàleg i la verificació és vigent.',
    badge: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  cal_actualitzar: {
    label: 'Cal actualitzar',
    description:
      'La fitxa continua visible, però la verificació ha superat el període recomanat de sis mesos.',
    badge: 'bg-orange-50 text-orange-800 ring-orange-200',
    dot: 'bg-orange-500',
  },
  no_vigent: {
    label: 'No vigent',
    description:
      'L’eina ja no ofereix l’avantatge anunciat o ha deixat d’estar disponible. No es mostra al catàleg.',
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  },
}

export const PROPOSAL_STATUSES: Record<
  ProposalStatus,
  { label: string; badge: string; dot: string }
> = {
  pendent: {
    label: 'Pendent de revisió',
    badge: 'bg-amber-50 text-amber-800 ring-amber-200',
    dot: 'bg-amber-500',
  },
  en_revisio: {
    label: 'En revisió',
    badge: 'bg-sky-50 text-sky-800 ring-sky-200',
    dot: 'bg-sky-500',
  },
  aprovada: {
    label: 'Aprovada',
    badge: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  rebutjada: {
    label: 'Rebutjada',
    badge: 'bg-rose-50 text-rose-800 ring-rose-200',
    dot: 'bg-rose-500',
  },
  fusionada: {
    label: 'Fusionada',
    badge: 'bg-slate-100 text-slate-700 ring-slate-200',
    dot: 'bg-slate-400',
  },
}

export const ROLES: Record<Role, { label: string; description: string; badge: string }> = {
  superadmin: {
    label: 'Superadministrador',
    description:
      'Accés complet: eines, propostes, categories, usuaris, permisos i configuració.',
    badge: 'bg-teal-50 text-teal-800 ring-teal-200',
  },
  admin: {
    label: 'Administrador',
    description:
      'Gestiona eines, propostes, verificacions, categories i avisos. No pot canviar rols.',
    badge: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  },
  editor: {
    label: 'Editor',
    description:
      'Pot revisar propostes i editar fitxes, però no verificar, publicar ni arxivar eines.',
    badge: 'bg-sky-50 text-sky-800 ring-sky-200',
  },
  consultor: {
    label: 'Consultor',
    description: 'Accés de només lectura al tauler, les fitxes i l’historial.',
    badge: 'bg-slate-100 text-slate-700 ring-slate-200',
  },
}

export const PUBLIC_TOOL_STATUSES: ToolStatus[] = ['publicada', 'cal_actualitzar']
