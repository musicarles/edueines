import { REVIEW_MONTHS } from './constants'
import type { EducationLevel, Tool } from './types'
import { addMonths, getDomain, normalizeNameForComparison } from './utils'

interface SeedTool {
  id: string
  name: string
  url: string
  shortDescription: string
  fullDescription: string
  educationalUses: string
  categoryId: string
  benefitType: Tool['benefitType']
  accessConditions: string
  accessMethod: string
  signupInstructions: string
  requiresInstitutionalEmail: boolean | null
  requiresTeacherVerification: boolean | null
  levels: EducationLevel[]
  source: string
  notes: string
  status: Tool['status']
  featured: boolean
  popularity: number
  color: string
  verifiedAt: string | null
  createdAt: string
}

const PRIMARY_TO_HIGHER: EducationLevel[] = [
  'primaria',
  'eso',
  'batxillerat',
  'fp',
  'superior',
]

function buildTool(seed: SeedTool): Tool {
  return {
    id: seed.id,
    name: seed.name,
    slug: seed.id,
    normalizedName: normalizeNameForComparison(seed.name),
    officialUrl: seed.url,
    domain: getDomain(seed.url),
    shortDescription: seed.shortDescription,
    fullDescription: seed.fullDescription,
    educationalUses: seed.educationalUses,
    categoryId: seed.categoryId,
    benefitType: seed.benefitType,
    accessConditions: seed.accessConditions,
    accessMethod: seed.accessMethod,
    signupInstructions: seed.signupInstructions,
    requiresInstitutionalEmail: seed.requiresInstitutionalEmail,
    requiresTeacherVerification: seed.requiresTeacherVerification,
    levels: seed.levels,
    officialSource: seed.source,
    verificationNotes: seed.notes,
    status: seed.status,
    featured: seed.featured,
    popularity: seed.popularity,
    color: seed.color,
    lastVerifiedAt: seed.verifiedAt,
    nextReviewAt: seed.verifiedAt ? addMonths(seed.verifiedAt, REVIEW_MONTHS) : null,
    createdAt: seed.createdAt,
    updatedAt: seed.verifiedAt ?? seed.createdAt,
    publishedAt:
      seed.status === 'publicada' || seed.status === 'cal_actualitzar'
        ? seed.createdAt
        : null,
    proposalId: null,
    archivedReason: '',
    mergedIntoId: null,
  }
}

const SEEDS: SeedTool[] = [
  {
    id: 'canva-education',
    name: 'Canva Education',
    url: 'https://www.canva.com/education/',
    shortDescription:
      'Disseny gràfic i comunicació visual amb plantilles llestes per a l’aula.',
    fullDescription:
      'Canva és una plataforma de disseny en línia per crear presentacions, infografies, cartells, rúbriques, vídeos i altres materials didàctics a partir de plantilles. Canva for Education afegeix plantilles i funcions pensades per al professorat i la gestió de classes.',
    educationalUses:
      'Dissenyar materials per a la classe i per a les famílies; crear presentacions i infografies; proposar activitats de creació a l’alumnat; elaborar rúbriques i guies visuals.',
    categoryId: 'disseny-grafic',
    benefitType: 'llicencia-educativa',
    accessConditions:
      'Canva for Education és gratuït per a docents que puguin acreditar la seva condició en un centre educatiu. L’elegibilitat, els documents acceptats i les funcions incloses poden variar segons el país; cal confirmar-ho en el moment del registre.',
    accessMethod:
      'Registre en línia com a docent, amb correu educatiu o verificació del centre.',
    signupInstructions:
      'Ves a canva.com/education i tria «Registra’t». Indica que ets docent, verifica el correu del centre o penja la documentació que et demanin. Quan el compte educatiu estigui validat, ja podràs crear materials amb les funcions del pla educatiu.',
    requiresInstitutionalEmail: false,
    requiresTeacherVerification: true,
    levels: ['infantil', 'primaria', 'eso', 'batxillerat', 'fp', 'superior', 'adults'],
    source: 'https://www.canva.com/education/',
    notes:
      'Revisió inicial de la pàgina oficial d’educació. Cal confirmar l’elegibilitat concreta al país i l’estat de les funcions del pla educatiu.',
    status: 'publicada',
    featured: true,
    popularity: 98,
    color: '#00C4CC',
    verifiedAt: '2026-11-03T09:00:00.000Z',
    createdAt: '2026-08-01T08:00:00.000Z',
  },
  {
    id: 'gemini-for-education',
    name: 'Gemini for Education',
    url: 'https://edu.google.com/intl/ALL_us/ai/gemini-for-education/',
    shortDescription:
      'Assistent d’IA de Google amb funcions pensades per a centres educatius.',
    fullDescription:
      'Gemini for Education és l’oferta de Google per utilitzar Gemini en entorns educatius, amb proteccions de privacitat i integració amb Google Workspace for Education. La disponibilitat de funcions i el cost depenen de l’edició contractada pel centre.',
    educationalUses:
      'Preparar activitats i materials; generar idees i primers esborranys; resumir textos; donar suport a la planificació docent i a l’aprenentatge guiat.',
    categoryId: 'intelligencia-artificial',
    benefitType: 'altres',
    accessConditions:
      'La disponibilitat de Gemini for Education depèn de l’edició de Google Workspace for Education del centre, del país i del tipus de compte. No es pot assegurar un accés gratuït general: cal confirmar-ho amb l’administrador del centre.',
    accessMethod:
      'Accés amb un compte de Google Workspace for Education del centre, segons l’edició contractada.',
    signupInstructions:
      'Comprova amb l’administrador de Google Workspace del centre quina edició teniu i si Gemini hi està inclòs. Si hi és, inicia la sessió amb el compte del centre i obre Gemini des del tauler de Google Workspace.',
    requiresInstitutionalEmail: true,
    requiresTeacherVerification: null,
    levels: PRIMARY_TO_HIGHER,
    source: 'https://edu.google.com/intl/ALL_us/ai/gemini-for-education/',
    notes:
      'Pendent de verificació: la informació pública no permet confirmar una oferta gratuïta uniforme per a qualsevol docent.',
    status: 'pendent',
    featured: false,
    popularity: 90,
    color: '#4F46E5',
    verifiedAt: null,
    createdAt: '2026-10-20T08:00:00.000Z',
  },
  {
    id: 'notebooklm',
    name: 'NotebookLM',
    url: 'https://notebooklm.google/',
    shortDescription:
      'Quadern d’investigació amb IA que treballa a partir dels documents que hi carregues.',
    fullDescription:
      'NotebookLM és un quadern d’investigació assistit per IA que treballa exclusivament amb les fonts que hi afegeixes: documents, enllaços, textos o àudio. Genera resums, preguntes, cronologies i guions de podcast a partir d’aquest material.',
    educationalUses:
      'Resumir i contrastar fonts; preparar explicacions i qüestionaris; crear guions de podcast; donar suport a projectes de recerca i a la comprensió lectora.',
    categoryId: 'intelligencia-artificial',
    benefitType: 'pla-gratuit',
    accessConditions:
      'Es pot utilitzar gratuïtament amb un compte de Google. Els límits de nombre de quaderns, fonts i funcions poden variar segons el pla i canvien amb freqüència. Algunes funcions avançades requereixen una subscripció de Google AI.',
    accessMethod: 'Compte de Google gratuït; funcions ampliades amb subscripció.',
    signupInstructions:
      'Entra a notebooklm.google amb el teu compte de Google, accepta les condicions i crea un quadern. Afegeix-hi les fonts i fes les preguntes que necessitis.',
    requiresInstitutionalEmail: false,
    requiresTeacherVerification: false,
    levels: ['eso', 'batxillerat', 'fp', 'superior', 'adults'],
    source: 'https://notebooklm.google/',
    notes:
      'Revisió inicial de la pàgina oficial. Els límits concrets del pla gratuït cal revisar-los periòdicament.',
    status: 'publicada',
    featured: false,
    popularity: 89,
    color: '#1A73E8',
    verifiedAt: '2026-11-03T09:10:00.000Z',
    createdAt: '2026-08-10T08:00:00.000Z',
  },
  {
    id: 'adobe-express-education',
    name: 'Adobe Express for Education',
    url: 'https://www.adobe.com/education/express/',
    shortDescription:
      'Creació de continguts visuals i multimèdia amb plantilles per a l’aula.',
    fullDescription:
      'Adobe Express és una eina de disseny i edició de continguts que combina plantilles, imatges, vídeo i funcions d’IA. L’oferta per a educació és gratuïta per a centres de primària i secundària i inclou recursos per a projectes d’aula.',
    educationalUses:
      'Crear cartells, infografies, vídeos curts i presentacions; desenvolupar projectes creatius de l’alumnat; elaborar materials de comunicació del centre.',
    categoryId: 'disseny-grafic',
    benefitType: 'llicencia-educativa',
    accessConditions:
      'Adobe Express per a educació és gratuït per a docents i alumnat de centres de primària i secundària (K-12). Cal registrar-se com a educador i pot ser necessari verificar el centre o el correu.',
    accessMethod: 'Registre com a educador amb verificació del centre.',
    signupInstructions:
      'Obre adobe.com/education/express i tria «Registra’t com a educador». Completa les dades del centre i verifica el correu. Un cop validat, entra a Adobe Express amb el compte educatiu.',
    requiresInstitutionalEmail: false,
    requiresTeacherVerification: true,
    levels: ['primaria', 'eso', 'batxillerat', 'fp'],
    source: 'https://www.adobe.com/education/express/',
    notes:
      'Revisió inicial de la pàgina oficial per a K-12. Cal confirmar les condicions per a altres nivells i països.',
    status: 'publicada',
    featured: false,
    popularity: 72,
    color: '#FA0F00',
    verifiedAt: '2026-11-03T09:20:00.000Z',
    createdAt: '2026-08-18T08:00:00.000Z',
  },
  {
    id: 'microsoft-365-education',
    name: 'Microsoft 365 Education',
    url: 'https://www.microsoft.com/en-us/education/products/microsoft-365',
    shortDescription:
      'Paquet d’eines de productivitat i col·laboració per a centres educatius.',
    fullDescription:
      'Microsoft 365 Education inclou Outlook, Word, Excel, PowerPoint, Teams i OneNote en versions web i d’escriptori, amb opcions de gestió per al centre. El pla A1 és gratuït per a estudiants i docents amb correu escolar vàlid.',
    educationalUses:
      'Treball col·laboratiu, classes en línia, documents compartits, gestió de tasques i comunicació interna del centre.',
    categoryId: 'productivitat',
    benefitType: 'llicencia-educativa',
    accessConditions:
      'El pla Microsoft 365 Education A1 és gratuït per a estudiants i docents de centres educatius que compleixin els requisits de Microsoft. Cal un correu escolar gestionat pel centre. Les funcions avançades, alguns serveis d’IA i determinades aplicacions requereixen llicències addicionals.',
    accessMethod: 'Compte escolar del centre amb Microsoft 365 Education.',
    signupInstructions:
      'El centre ha de tenir un tennant educatiu de Microsoft. Un cop creat, l’alumnat i el professorat hi accedeixen amb el correu escolar des de microsoft365.com.',
    requiresInstitutionalEmail: true,
    requiresTeacherVerification: true,
    levels: PRIMARY_TO_HIGHER,
    source: 'https://www.microsoft.com/en-us/education/products/microsoft-365',
    notes:
      'Revisió inicial de les pàgines oficials d’educació. Cal confirmar amb el centre quina edició té contractada.',
    status: 'publicada',
    featured: false,
    popularity: 78,
    color: '#0078D4',
    verifiedAt: '2026-11-03T09:30:00.000Z',
    createdAt: '2026-08-25T08:00:00.000Z',
  },
  {
    id: 'miro-education',
    name: 'Miro Education',
    url: 'https://miro.com/education/',
    shortDescription:
      'Pissarra col·laborativa infinita per al treball visual i els projectes en equip.',
    fullDescription:
      'Miro és una pissarra digital col·laborativa que permet organitzar idees, mapes mentals, pluja d’idees i projectes amb plantilles. El pla educatiu gratuït ofereix equips de fins a 100 persones i és gratuït de manera permanent per a docents.',
    educationalUses:
      'Pluja d’idees, mapes conceptuals, planificació de projectes, tutories i treball cooperatiu en línia.',
    categoryId: 'pissarres-digitals',
    benefitType: 'llicencia-educativa',
    accessConditions:
      'El pla Educator és gratuït per a docents que en facin la sol·licitud i compleixin els requisits. Inclou fins a 100 membres per equip, taulers il·limitats i crèdits mensuals limitats d’IA. El pla Student també és gratuït, amb menys membres.',
    accessMethod: 'Sol·licitud en línia com a docent; aprovació per part de Miro.',
    signupInstructions:
      'Ves a miro.com/education, tria «Apply as educator» i completa el formulari amb el correu i les dades del centre. Quan rebis l’aprovació, crea l’equip i convida-hi l’alumnat.',
    requiresInstitutionalEmail: false,
    requiresTeacherVerification: true,
    levels: ['eso', 'batxillerat', 'fp', 'superior', 'adults'],
    source: 'https://miro.com/education/',
    notes:
      'Revisió inicial de la pàgina oficial d’educació: el pla Educator és gratuït de manera permanent i inclou 100 membres.',
    status: 'publicada',
    featured: true,
    popularity: 82,
    color: '#FFD02F',
    verifiedAt: '2026-11-03T09:40:00.000Z',
    createdAt: '2026-09-02T08:00:00.000Z',
  },
  {
    id: 'book-creator',
    name: 'Book Creator',
    url: 'https://bookcreator.com/',
    shortDescription:
      'Creació de llibres digitals i còmics amb text, imatge, àudio i vídeo.',
    fullDescription:
      'Book Creator permet crear llibres digitals interactius i exportar-los. S’utilitza per a projectes d’escriptura, portafolis i materials accessibles. El pla gratuït té límits de biblioteques i de nombre de llibres.',
    educationalUses:
      'Projectes d’escriptura, llibres col·laboratius, portafolis, adaptacions accessibles i còmics.',
    categoryId: 'creacio-continguts',
    benefitType: 'pla-gratuit',
    accessConditions:
      'El pla gratuït té límits de biblioteques i de nombre de llibres per biblioteca, i no inclou totes les funcions de col·laboració. Els centres que necessiten ús complet han de contractar una llicència escolar. Cal revisar els límits vigents, que han canviat els darrers mesos.',
    accessMethod: 'Compte gratuït; llicència escolar per a funcions completes.',
    signupInstructions:
      'Crea un compte a bookcreator.com i tria el pla gratuït. Des del tauler pots crear una biblioteca i convidar alumnat amb un codi o enllaç, segons les funcions disponibles.',
    requiresInstitutionalEmail: false,
    requiresTeacherVerification: false,
    levels: ['infantil', 'primaria', 'eso'],
    source: 'https://bookcreator.com/pricing/',
    notes:
      'La darrera revisió completa és del gener de 2026. La pàgina de preus ha canviat i cal tornar a comprovar límits i condicions.',
    status: 'cal_actualitzar',
    featured: false,
    popularity: 58,
    color: '#00A3A1',
    verifiedAt: '2026-01-15T09:00:00.000Z',
    createdAt: '2026-09-05T08:00:00.000Z',
  },
  {
    id: 'genially',
    name: 'Genially',
    url: 'https://genially.com/education/',
    shortDescription:
      'Creació de continguts interactius com infografies, jocs i presentacions.',
    fullDescription:
      'Genially permet crear materials interactius amb imatges, àudio, vídeo i elements clicables. És especialment útil per a gamificació, aprenentatge visual i activitats autoguiades.',
    educationalUses:
      'Infografies interactives, escape rooms educatius, presentacions, jocs de repàs i activitats autocorrectives.',
    categoryId: 'presentacions',
    benefitType: 'pla-gratuit',
    accessConditions:
      'El pla gratuït permet crear continguts amb un límit de plantilles, emmagatzematge i funcions. Les llicències educatives i les funcions avançades són de pagament. Cal revisar els límits del pla gratuït abans de proposar-lo a l’alumnat.',
    accessMethod: 'Compte gratuït; plans educatius de pagament per a més funcions.',
    signupInstructions:
      'Ves a genially.com/education i tria «Crea el teu compte gratuït» amb el perfil de docent. Un cop dins, pots començar a crear amb les plantilles gratuïtes.',
    requiresInstitutionalEmail: false,
    requiresTeacherVerification: false,
    levels: ['primaria', 'eso', 'batxillerat', 'fp'],
    source: 'https://genially.com/education/',
    notes:
      'Revisió inicial de la pàgina oficial d’educació. El pla gratuït és limitat; no equival a una llicència educativa completa.',
    status: 'publicada',
    featured: false,
    popularity: 80,
    color: '#6C3DF4',
    verifiedAt: '2026-11-03T09:50:00.000Z',
    createdAt: '2026-09-10T08:00:00.000Z',
  },
  {
    id: 'kahoot',
    name: 'Kahoot!',
    url: 'https://kahoot.com/schools/',
    shortDescription:
      'Qüestionaris i jocs en directe per dinamitzar la classe.',
    fullDescription:
      'Kahoot! permet crear qüestionaris i jocs en directe o assignar-los com a activitats. És útil per a la pràctica, el repàs i l’avaluació formativa. El pla gratuït té límits de preguntes i de participants.',
    educationalUses:
      'Repàs de continguts, avaluació formativa, enquestes, gamificació i activació de coneixements previs.',
    categoryId: 'avaluacio',
    benefitType: 'pla-gratuit',
    accessConditions:
      'El pla gratuït permet crear i jugar kahoots amb límits de funcions i de participants. Les funcions avançades, els informes i alguns tipus de preguntes requereixen un pla de pagament. Cal comprovar si el centre té una llicència escolar.',
    accessMethod: 'Compte gratuït; plans de pagament per a funcions avançades.',
    signupInstructions:
      'Crea un compte a kahoot.com i tria el pla gratuït. Des del tauler pots crear un kahoot o utilitzar-ne un de la biblioteca pública.',
    requiresInstitutionalEmail: false,
    requiresTeacherVerification: false,
    levels: ['primaria', 'eso', 'batxillerat', 'fp'],
    source: 'https://kahoot.com/schools/',
    notes:
      'Revisió inicial de les pàgines oficials. Els límits del pla gratuït i les condicions escolars poden variar segons el país.',
    status: 'publicada',
    featured: false,
    popularity: 84,
    color: '#46178F',
    verifiedAt: '2026-11-03T10:00:00.000Z',
    createdAt: '2026-09-18T08:00:00.000Z',
  },
  {
    id: 'wakelet',
    name: 'Wakelet',
    url: 'https://wakelet.com/education',
    shortDescription:
      'Col·leccions de recursos, enllaços i materials per compartir amb l’alumnat.',
    fullDescription:
      'Wakelet permet reunir enllaços, imatges, vídeos, notes i documents en col·leccions públiques o privades. És útil per organitzar recursos, portafolis i itineraris d’aprenentatge.',
    educationalUses:
      'Organitzar recursos per temes, crear itineraris, compartir materials amb l’alumnat i portafolis digitals.',
    categoryId: 'gestio-aula',
    benefitType: 'pla-gratuit',
    accessConditions:
      'El pla gratuït permet crear col·leccions i compartir-les, amb límits de funcions col·laboratives i d’emmagatzematge. Les funcions per a centres i equips requereixen un pla de pagament.',
    accessMethod: 'Compte gratuït amb correu; plans de centre opcionals.',
    signupInstructions:
      'Registra’t a wakelet.com amb un compte de Google, Microsoft o correu electrònic. Crea una col·lecció i afegeix-hi enllaços, textos, imatges o vídeos.',
    requiresInstitutionalEmail: false,
    requiresTeacherVerification: false,
    levels: ['primaria', 'eso', 'batxillerat', 'fp', 'superior'],
    source: 'https://wakelet.com/site/pricing',
    notes:
      'Revisió inicial de la pàgina oficial d’educació i de preus. Cal confirmar els límits vigents del pla gratuït.',
    status: 'publicada',
    featured: false,
    popularity: 66,
    color: '#0F6CBD',
    verifiedAt: '2026-11-03T10:10:00.000Z',
    createdAt: '2026-10-12T08:00:00.000Z',
  },
  {
    id: 'notion-education',
    name: 'Notion Education',
    url: 'https://www.notion.com/education',
    shortDescription:
      'Espai de treball per organitzar apunts, projectes, bases de dades i col·laboració.',
    fullDescription:
      'Notion combina notes, documents i bases de dades en un sol espai. L’oferta educativa permet obtenir funcions del pla Personal Pro de manera gratuïta per a estudiants i docents amb correu institucional.',
    educationalUses:
      'Planificació de classes, portafolis, gestió de projectes, bases de dades de recursos i treball col·laboratiu.',
    categoryId: 'productivitat',
    benefitType: 'llicencia-educativa',
    accessConditions:
      'L’oferta educativa gratuïta equival al pla Personal Pro per a un usuari i s’obté amb un correu institucional verificat. Cal renovar la verificació periòdicament i no inclou les funcions d’equip de pagament.',
    accessMethod: 'Compte amb correu institucional verificat.',
    signupInstructions:
      'Crea un compte a notion.com i ves a la pàgina d’educació. Verifica el correu del centre; quan s’aprovi, el pla educatiu s’aplica al teu espai de treball.',
    requiresInstitutionalEmail: true,
    requiresTeacherVerification: true,
    levels: ['eso', 'batxillerat', 'fp', 'superior', 'adults'],
    source: 'https://www.notion.com/help/notion-for-education',
    notes:
      'Revisió inicial de la pàgina d’ajuda oficial. Cal confirmar la disponibilitat del correu institucional al centre.',
    status: 'publicada',
    featured: false,
    popularity: 74,
    color: '#111827',
    verifiedAt: '2026-11-03T10:20:00.000Z',
    createdAt: '2026-10-04T08:00:00.000Z',
  },
  {
    id: 'magicschool-ai',
    name: 'MagicSchool AI',
    url: 'https://www.magicschool.ai/',
    shortDescription:
      'Assistent d’IA amb eines específiques per a la planificació docent.',
    fullDescription:
      'MagicSchool AI reuneix generadors de materials, planificacions, rúbriques, preguntes i activitats amb IA, pensats per estalviar temps al professorat. El pla gratuït inclou un nombre limitat de generacions.',
    educationalUses:
      'Generar planificacions i rúbriques, adaptar textos per nivells, crear preguntes i activitats, preparar comunicacions.',
    categoryId: 'intelligencia-artificial',
    benefitType: 'pla-gratuit',
    accessConditions:
      'El pla gratuït inclou un nombre limitat de generacions i eines. El pla de pagament amplia els límits i afegeix funcions. Cal revisar les condicions educatives vigents i les limitacions d’edat de l’alumnat.',
    accessMethod: 'Compte gratuït; subscripció per a límits ampliats.',
    signupInstructions:
      'Registra’t a magicschool.ai amb un compte de Google o correu. Tria el pla gratuït i comença a utilitzar les eines des del tauler.',
    requiresInstitutionalEmail: false,
    requiresTeacherVerification: false,
    levels: ['primaria', 'eso', 'batxillerat', 'fp'],
    source: 'https://www.magicschool.ai/pricing',
    notes:
      'Revisió inicial de la pàgina oficial de preus. Cal confirmar els límits del pla gratuït i les condicions d’ús amb menors.',
    status: 'publicada',
    featured: true,
    popularity: 92,
    color: '#6D28D9',
    verifiedAt: '2026-11-03T10:30:00.000Z',
    createdAt: '2026-10-28T08:00:00.000Z',
  },
]

export const SEED_TOOLS: Tool[] = SEEDS.map(buildTool)

export const SEED_VERIFICATION_ACTOR = {
  uid: 'equip-edueines',
  name: 'Equip Edueines',
}
