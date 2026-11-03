import { useMemo, useState, type FormEvent } from 'react'
import {
  Check,
  KeyRound,
  Mail,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../lib/auth/AuthProvider'
import { useCollections } from '../../lib/use-collection'
import { IS_FIREBASE } from '../../lib/env'
import { ROLES } from '../../lib/constants'
import { ROLE_ORDER, can } from '../../lib/permissions'
import {
  adminUserFormSchema,
  fieldErrors,
  inviteFormSchema,
  type FieldErrors,
} from '../../lib/schemas'
import { addHistory, diffValues } from '../../lib/history'
import { getStore } from '../../lib/store'
import type { AdminUser, Invite, Role, UserProfile } from '../../lib/types'
import { cn, formatDate, formatDateTime, nowIso } from '../../lib/utils'
import {
  AdminAccessDenied,
  AdminPageHeader,
  StatCard,
} from '../../components/admin/AdminUI'
import { Button } from '../../components/ui/Button'
import { Field, Select, Textarea, TextInput } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback'

interface UserDraft {
  username: string
  displayName: string
  email: string
  role: Role
  active: boolean
  password: string
}

interface InviteDraft {
  email: string
  displayName: string
  role: Role
}

const EMPTY_DRAFT: UserDraft = {
  username: '',
  displayName: '',
  email: '',
  role: 'editor',
  active: true,
  password: '',
}

const EMPTY_INVITE: InviteDraft = {
  email: '',
  displayName: '',
  role: 'editor',
}

const FIELD_LABELS: Record<string, string> = {
  username: 'Usuari',
  displayName: 'Nom visible',
  email: 'Correu electrònic',
  role: 'Rol',
  active: 'Actiu',
}

export default function AdminUsersPage() {
  const { user, refresh: refreshAuth } = useAuth()
  const [data, loading, error, refresh] = useCollections(['admins', 'users', 'invites'])
  const admins = (data.admins ?? []) as AdminUser[]
  const profiles = (data.users ?? []) as UserProfile[]
  const invites = (data.invites ?? []) as Invite[]

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [draft, setDraft] = useState<UserDraft>(EMPTY_DRAFT)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteDraft, setInviteDraft] = useState<InviteDraft>(EMPTY_INVITE)
  const [inviteErrors, setInviteErrors] = useState<FieldErrors>({})

  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [busyUid, setBusyUid] = useState<string | null>(null)

  const actor = user ? { uid: user.uid, name: user.displayName } : null
  const allowed = can(user?.role, 'users.manage')

  const ordered = useMemo(
    () =>
      [...admins].sort(
        (a, b) =>
          ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) ||
          a.displayName.localeCompare(b.displayName, 'ca'),
      ),
    [admins],
  )

  const activeCount = admins.filter((admin) => admin.active).length
  const activeSuperadmins = admins.filter(
    (admin) => admin.role === 'superadmin' && admin.active,
  )

  if (!allowed) {
    return (
      <AdminAccessDenied
        title="Usuaris i permisos"
        description="Només el superadministrador pot gestionar comptes, rols i invitacions."
      />
    )
  }

  function openCreate() {
    setEditing(null)
    setDraft(EMPTY_DRAFT)
    setErrors({})
    setFormOpen(true)
  }

  function openEdit(admin: AdminUser) {
    setEditing(admin)
    setDraft({
      username: admin.username,
      displayName: admin.displayName,
      email: admin.email,
      role: admin.role,
      active: admin.active,
      password: '',
    })
    setErrors({})
    setFormOpen(true)
  }

  function update<K extends keyof UserDraft>(key: K, value: UserDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function updateInvite<K extends keyof InviteDraft>(key: K, value: InviteDraft[K]) {
    setInviteDraft((current) => ({ ...current, [key]: value }))
    setInviteErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!actor) return

    const parsed = adminUserFormSchema.safeParse({
      username: draft.username,
      displayName: draft.displayName,
      email: draft.email,
      role: draft.role,
      active: draft.active,
      password: draft.password,
    })
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      toast.error('Revisa els camps marcats.')
      return
    }
    const values = parsed.data

    if (!editing && !IS_FIREBASE && values.password.length < 8) {
      setErrors((current) => ({
        ...current,
        password: 'Cal una contrasenya d’almenys 8 caràcters.',
      }))
      return
    }

    if (editing) {
      if (editing.uid === user?.uid && !values.active) {
        toast.error('No pots desactivar el teu propi compte.')
        return
      }
      const removingSuperadmin =
        editing.role === 'superadmin' &&
        (values.role !== 'superadmin' || !values.active)
      if (removingSuperadmin && activeSuperadmins.length <= 1) {
        toast.error(
          'No es pot treure el darrer superadministrador actiu. Assigna el rol a una altra persona abans de fer el canvi.',
        )
        return
      }
      if (!IS_FIREBASE) {
        const username = values.username.toLowerCase()
        const email = values.email.toLowerCase()
        if (
          admins.some(
            (admin) => admin.uid !== editing.uid && admin.username.toLowerCase() === username,
          )
        ) {
          setErrors((current) => ({ ...current, username: 'Ja existeix aquest usuari.' }))
          return
        }
        if (
          admins.some(
            (admin) => admin.uid !== editing.uid && admin.email.toLowerCase() === email,
          )
        ) {
          setErrors((current) => ({
            ...current,
            email: 'Ja existeix un compte amb aquest correu.',
          }))
          return
        }
      }
    }

    setSaving(true)
    try {
      if (editing) {
        const next: AdminUser = {
          ...editing,
          username: IS_FIREBASE ? editing.username : values.username.toLowerCase(),
          displayName: values.displayName,
          email: IS_FIREBASE ? editing.email : values.email.toLowerCase(),
          role: values.role,
          active: values.active,
        }
        const changes = diffValues(
          editing as unknown as Record<string, unknown>,
          next as unknown as Record<string, unknown>,
          FIELD_LABELS,
        )
        const store = await getStore()
        await store.put('admins', editing.uid, next)
        const existingProfile = profiles.find((profile) => profile.uid === editing.uid)
        const profile: UserProfile = {
          uid: editing.uid,
          email: next.email,
          displayName: next.displayName,
          role: next.role,
          createdAt: existingProfile?.createdAt ?? editing.createdAt,
          lastLoginAt: existingProfile?.lastLoginAt ?? editing.lastLoginAt,
        }
        await store.put('users', editing.uid, profile)
        if (values.password.length > 0) {
          if (IS_FIREBASE) {
            throw new Error(
              'En mode Firebase, les contrasenyes es gestionen des de la consola de Firebase Authentication.',
            )
          }
          const localAuth = await import('../../lib/auth/local')
          await localAuth.setLocalPassword(editing.uid, values.password)
        }
        await addHistory({
          entityType: 'usuari',
          entityId: editing.uid,
          entityName: next.displayName,
          action: values.password.length > 0 ? 'editat i contrasenya restablerta' : 'editat',
          summary:
            changes.length > 0
              ? `Compte actualitzat. Canvis: ${changes.map((change) => change.field).join(', ')}.`
              : 'Compte desat sense canvis de contingut.',
          actorUid: actor.uid,
          actorName: actor.name,
          changes,
        })
        toast.success('Compte actualitzat.')
      } else {
        const localAuth = await import('../../lib/auth/local')
        const created = await localAuth.createLocalAdmin({
          username: values.username.toLowerCase(),
          displayName: values.displayName,
          email: values.email.toLowerCase(),
          role: values.role,
          active: values.active,
          password: values.password,
        })
        await addHistory({
          entityType: 'usuari',
          entityId: created.uid,
          entityName: created.displayName,
          action: 'creat',
          summary: `Compte creat amb el rol de ${ROLES[created.role].label}.`,
          actorUid: actor.uid,
          actorName: actor.name,
          changes: [],
        })
        toast.success('Usuari creat. Ja pot iniciar sessió amb la contrasenya indicada.')
      }
      await refresh()
      await refreshAuth()
      setFormOpen(false)
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut desar el compte.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(admin: AdminUser) {
    if (!actor) return
    if (admin.uid === user?.uid && admin.active) {
      toast.error('No pots desactivar el teu propi compte.')
      return
    }
    if (admin.role === 'superadmin' && admin.active && activeSuperadmins.length <= 1) {
      toast.error('No es pot desactivar el darrer superadministrador actiu.')
      return
    }
    setBusyUid(admin.uid)
    try {
      const store = await getStore()
      const next: AdminUser = { ...admin, active: !admin.active }
      await store.put('admins', admin.uid, next)
      const profile = profiles.find((item) => item.uid === admin.uid)
      if (profile) {
        await store.put('users', admin.uid, { ...profile, role: next.role })
      }
      await addHistory({
        entityType: 'usuari',
        entityId: admin.uid,
        entityName: admin.displayName,
        action: next.active ? 'activat' : 'desactivat',
        summary: next.active
          ? 'El compte s’ha reactivat i pot tornar a iniciar sessió.'
          : 'El compte s’ha desactivat i ja no pot iniciar sessió.',
        actorUid: actor.uid,
        actorName: actor.name,
        changes: [
          {
            field: 'Actiu',
            from: admin.active ? 'Sí' : 'No',
            to: next.active ? 'Sí' : 'No',
          },
        ],
      })
      await refresh()
      toast.success(next.active ? 'Compte activat.' : 'Compte desactivat.')
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : 'No s’ha pogut actualitzar el compte.',
      )
    } finally {
      setBusyUid(null)
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!actor || !resetTarget) return
    if (password.length < 8) {
      setPasswordError('La contrasenya ha de tenir com a mínim 8 caràcters.')
      return
    }
    setSaving(true)
    try {
      const localAuth = await import('../../lib/auth/local')
      await localAuth.setLocalPassword(resetTarget.uid, password)
      await addHistory({
        entityType: 'usuari',
        entityId: resetTarget.uid,
        entityName: resetTarget.displayName,
        action: 'contrasenya restablerta',
        summary: 'Un administrador ha establert una contrasenya nova per a aquest compte.',
        actorUid: actor.uid,
        actorName: actor.name,
        changes: [],
      })
      toast.success('Contrasenya actualitzada.')
      setResetTarget(null)
      setPassword('')
      setPasswordError('')
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : 'No s’ha pogut canviar la contrasenya.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!actor) return
    const parsed = inviteFormSchema.safeParse(inviteDraft)
    if (!parsed.success) {
      setInviteErrors(fieldErrors(parsed.error))
      toast.error('Revisa els camps marcats.')
      return
    }
    const email = parsed.data.email.toLowerCase()
    if (admins.some((admin) => admin.email.toLowerCase() === email)) {
      setInviteErrors((current) => ({
        ...current,
        email: 'Aquest correu ja pertany a un compte actiu.',
      }))
      return
    }
    setSaving(true)
    try {
      const firebaseAuth = await import('../../lib/auth/firebase')
      await firebaseAuth.createInvite({
        email,
        displayName: parsed.data.displayName,
        role: parsed.data.role,
        invitedBy: actor.name,
      })
      await addHistory({
        entityType: 'usuari',
        entityId: email,
        entityName: parsed.data.displayName,
        action: 'invitació enviada',
        summary: `Invitació creada amb el rol de ${ROLES[parsed.data.role].label}.`,
        actorUid: actor.uid,
        actorName: actor.name,
        changes: [],
      })
      toast.success('Invitació creada. Es farà efectiva al primer inici de sessió.')
      setInviteOpen(false)
      setInviteDraft(EMPTY_INVITE)
      await refresh()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut crear la invitació.')
    } finally {
      setSaving(false)
    }
  }

  async function cancelInvite(invite: Invite) {
    if (!actor) return
    setBusyUid(invite.id)
    try {
      const firebaseAuth = await import('../../lib/auth/firebase')
      await firebaseAuth.deleteInvite(invite.email)
      await addHistory({
        entityType: 'usuari',
        entityId: invite.email,
        entityName: invite.displayName,
        action: 'invitació cancel·lada',
        summary: 'La invitació s’ha eliminat abans de fer-se servir.',
        actorUid: actor.uid,
        actorName: actor.name,
        changes: [],
      })
      toast.success('Invitació cancel·lada.')
      await refresh()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut cancel·lar.')
    } finally {
      setBusyUid(null)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Usuaris i permisos"
        description="Gestiona qui pot entrar a l’administració, amb quin rol i si el compte està actiu. Els canvis de permisos queden registrats a l’historial."
        actions={
          IS_FIREBASE ? (
            <Button onClick={() => setInviteOpen(true)}>
              <Mail className="size-4" aria-hidden="true" />
              Convida un usuari
            </Button>
          ) : (
            <Button onClick={openCreate}>
              <Plus className="size-4" aria-hidden="true" />
              Nou usuari
            </Button>
          )
        }
      />

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
        >
          {error}
        </p>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Comptes"
          value={admins.length}
          hint="Amb accés a l’administració"
          icon={<Users className="size-4" aria-hidden="true" />}
        />
        <StatCard
          label="Actius"
          value={activeCount}
          hint="Poden iniciar sessió"
          tone="emerald"
          icon={<UserCheck className="size-4" aria-hidden="true" />}
        />
        <StatCard
          label="Superadministradors"
          value={activeSuperadmins.length}
          hint="Accés complet"
          tone="sky"
          icon={<ShieldCheck className="size-4" aria-hidden="true" />}
        />
        <StatCard
          label="Invitacions"
          value={invites.length}
          hint={IS_FIREBASE ? 'Pendents d’activar' : 'Disponibles en mode Firebase'}
          tone="amber"
          icon={<Mail className="size-4" aria-hidden="true" />}
        />
      </div>

      <p className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs leading-relaxed text-sky-900">
        {IS_FIREBASE
          ? 'En mode Firebase els comptes es creen a Firebase Authentication. Aquí pots assignar el rol i el nom visible, activar o desactivar l’accés, i preparar invitacions per correu. Les contrasenyes es restableixen des de la consola de Firebase.'
          : 'Mode local: els comptes es desen en aquest navegador amb la contrasenya xifrada (PBKDF2). Per fer servir l’aplicació amb un equip real, activa el mode Firebase.'}
      </p>

      {loading ? (
        <LoadingBlock label="Carregant els usuaris…" />
      ) : ordered.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title="Encara no hi ha usuaris"
          description="Crea el primer compte amb accés a l’administració."
          action={
            IS_FIREBASE ? (
              <Button onClick={() => setInviteOpen(true)}>Convida un usuari</Button>
            ) : (
              <Button onClick={openCreate}>Nou usuari</Button>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.6fr_1fr_0.8fr_1fr_auto] gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 lg:grid">
            <span>Persona</span>
            <span>Rol</span>
            <span>Estat</span>
            <span>Darrera sessió</span>
            <span className="text-right">Accions</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {ordered.map((admin) => {
              const isSelf = admin.uid === user?.uid
              return (
                <li
                  key={admin.uid}
                  className="grid gap-3 px-5 py-4 transition hover:bg-slate-50/70 lg:grid-cols-[1.6fr_1fr_0.8fr_1fr_auto] lg:items-center"
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-1.5 font-semibold text-ink">
                      {admin.displayName}
                      {isSelf ? (
                        <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-800 ring-1 ring-inset ring-brand-200">
                          Tu
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {admin.username} · {admin.email}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Creat el {formatDate(admin.createdAt)}
                    </p>
                  </div>

                  <div>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset',
                        ROLES[admin.role].badge,
                      )}
                    >
                      <ShieldCheck className="size-3" aria-hidden="true" />
                      {ROLES[admin.role].label}
                    </span>
                    <p className="mt-1 hidden text-[11px] leading-snug text-slate-500 xl:block">
                      {ROLES[admin.role].description}
                    </p>
                  </div>

                  <div>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset',
                        admin.active
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : 'bg-slate-100 text-slate-500 ring-slate-200',
                      )}
                    >
                      {admin.active ? (
                        <Check className="size-3" aria-hidden="true" />
                      ) : (
                        <X className="size-3" aria-hidden="true" />
                      )}
                      {admin.active ? 'Actiu' : 'Inactiu'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    {admin.lastLoginAt ? formatDateTime(admin.lastLoginAt) : 'Mai'}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                    <Button size="sm" variant="outline" onClick={() => openEdit(admin)}>
                      <Pencil className="size-3.5" aria-hidden="true" />
                      Edita
                    </Button>
                    {!IS_FIREBASE ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setResetTarget(admin)
                          setPassword('')
                          setPasswordError('')
                        }}
                      >
                        <KeyRound className="size-3.5" aria-hidden="true" />
                        Contrasenya
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant={admin.active ? 'ghost' : 'soft'}
                      disabled={busyUid === admin.uid || (isSelf && admin.active)}
                      onClick={() => toggleActive(admin)}
                      title={
                        isSelf && admin.active
                          ? 'No pots desactivar el teu propi compte'
                          : undefined
                      }
                    >
                      {admin.active ? (
                        <UserX className="size-3.5" aria-hidden="true" />
                      ) : (
                        <UserCheck className="size-3.5" aria-hidden="true" />
                      )}
                      {admin.active ? 'Desactiva' : 'Activa'}
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Invitacions</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              {IS_FIREBASE
                ? 'Les invitacions donen accés a l’administració al primer inici de sessió amb el correu indicat.'
                : 'Les invitacions només estan actives en mode Firebase. En mode local, crea directament el compte.'}
            </p>
          </div>
          {IS_FIREBASE ? (
            <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Nova invitació
            </Button>
          ) : null}
        </div>

        {invites.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-500">
            No hi ha cap invitació pendent.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{invite.displayName}</p>
                    <p className="truncate text-xs text-slate-600">{invite.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cancelInvite(invite)}
                    disabled={busyUid === invite.id}
                    aria-label={`Cancel·la la invitació de ${invite.displayName}`}
                    className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 font-bold uppercase tracking-wide ring-1 ring-inset',
                      ROLES[invite.role].badge,
                    )}
                  >
                    {ROLES[invite.role].label}
                  </span>
                  <span>{formatDate(invite.createdAt)}</span>
                  <span>· {invite.invitedBy}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edita el compte' : 'Nou usuari'}
        description={
          editing
            ? 'Els canvis de rol es fan efectius al següent inici de sessió. No es pot desactivar el darrer superadministrador.'
            : IS_FIREBASE
              ? 'El compte es crea a Firebase Authentication. Aquí només se’n defineix el perfil.'
              : 'El compte es desa en aquest navegador amb la contrasenya xifrada.'
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel·la
            </Button>
            <Button type="submit" form="user-form" disabled={saving}>
              {saving ? 'Desant…' : editing ? 'Desa els canvis' : 'Crea el compte'}
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="user-username"
              label="Usuari"
              required
              error={errors.username}
              hint={IS_FIREBASE ? 'Es defineix a Firebase Authentication.' : 'Per iniciar sessió.'}
            >
              <TextInput
                id="user-username"
                value={draft.username}
                onChange={(event) => update('username', event.target.value)}
                invalid={Boolean(errors.username)}
                disabled={IS_FIREBASE && Boolean(editing)}
                autoComplete="off"
                maxLength={40}
                required
              />
            </Field>

            <Field id="user-display" label="Nom visible" required error={errors.displayName}>
              <TextInput
                id="user-display"
                value={draft.displayName}
                onChange={(event) => update('displayName', event.target.value)}
                invalid={Boolean(errors.displayName)}
                maxLength={80}
                required
              />
            </Field>
          </div>

          <Field
            id="user-email"
            label="Correu electrònic"
            required
            error={errors.email}
            hint={IS_FIREBASE ? 'Ha de coincidir amb el compte de Firebase.' : undefined}
          >
            <TextInput
              id="user-email"
              type="email"
              value={draft.email}
              onChange={(event) => update('email', event.target.value)}
              invalid={Boolean(errors.email)}
              disabled={IS_FIREBASE && Boolean(editing)}
              autoComplete="off"
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="user-role" label="Rol" required error={errors.role}>
              <Select
                id="user-role"
                value={draft.role}
                onChange={(event) => update('role', event.target.value as Role)}
              >
                {Object.entries(ROLES).map(([value, info]) => (
                  <option key={value} value={value}>
                    {info.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              id="user-password"
              label={editing ? 'Contrasenya nova' : 'Contrasenya'}
              optional={Boolean(editing)}
              error={errors.password}
              hint={
                editing
                  ? 'Deixa-ho en blanc per mantenir la contrasenya actual.'
                  : 'Mínim 8 caràcters.'
              }
            >
              <TextInput
                id="user-password"
                type="password"
                value={draft.password}
                onChange={(event) => update('password', event.target.value)}
                invalid={Boolean(errors.password)}
                disabled={IS_FIREBASE && Boolean(editing)}
                autoComplete="new-password"
                maxLength={120}
                required={!editing}
              />
            </Field>
          </div>

          <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
            <span className="font-semibold text-ink">{ROLES[draft.role].label}:</span>{' '}
            {ROLES[draft.role].description}
          </p>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(event) => update('active', event.target.checked)}
              disabled={editing?.uid === user?.uid}
              className="mt-0.5 size-4 rounded border-slate-300 accent-brand-700"
            />
            <span>
              <span className="block font-semibold text-ink">Compte actiu</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Si el desactives, la persona no podrà iniciar sessió, però les seves dades es
                conserven.
              </span>
            </span>
          </label>

          {IS_FIREBASE && editing ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
              En mode Firebase, el correu, l’usuari i la contrasenya es gestionen des de la
              consola de Firebase Authentication.
            </p>
          ) : null}
        </form>
      </Modal>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Convidar un usuari"
        description="La invitació assigna un rol a un correu. Quan la persona iniciï sessió per primera vegada, es crearà el seu perfil."
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)} disabled={saving}>
              Cancel·la
            </Button>
            <Button type="submit" form="invite-form" disabled={saving}>
              {saving ? 'Creant…' : 'Crea la invitació'}
            </Button>
          </>
        }
      >
        <form id="invite-form" onSubmit={handleInvite} className="space-y-4" noValidate>
          <Field id="invite-email" label="Correu electrònic" required error={inviteErrors.email}>
            <TextInput
              id="invite-email"
              type="email"
              value={inviteDraft.email}
              onChange={(event) => updateInvite('email', event.target.value)}
              invalid={Boolean(inviteErrors.email)}
              autoComplete="off"
              required
            />
          </Field>

          <Field
            id="invite-display"
            label="Nom visible"
            required
            error={inviteErrors.displayName}
          >
            <TextInput
              id="invite-display"
              value={inviteDraft.displayName}
              onChange={(event) => updateInvite('displayName', event.target.value)}
              invalid={Boolean(inviteErrors.displayName)}
              maxLength={80}
              required
            />
          </Field>

          <Field id="invite-role" label="Rol" required error={inviteErrors.role}>
            <Select
              id="invite-role"
              value={inviteDraft.role}
              onChange={(event) => updateInvite('role', event.target.value as Role)}
            >
              {Object.entries(ROLES).map(([value, info]) => (
                <option key={value} value={value}>
                  {info.label}
                </option>
              ))}
            </Select>
          </Field>

          <p className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs leading-relaxed text-sky-900">
            Important: el compte de correu ha d’existir a Firebase Authentication. Si no existeix,
            crea’l des de la consola de Firebase abans que la persona iniciï sessió.
          </p>
        </form>
      </Modal>

      <Modal
        open={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title="Restablir la contrasenya"
        description={`Estableix una contrasenya nova per a «${resetTarget?.displayName ?? ''}».`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetTarget(null)} disabled={saving}>
              Cancel·la
            </Button>
            <Button type="submit" form="password-form" disabled={saving}>
              {saving ? 'Desant…' : 'Actualitza la contrasenya'}
            </Button>
          </>
        }
      >
        <form id="password-form" onSubmit={handleResetPassword} className="space-y-4" noValidate>
          <Field
            id="new-password"
            label="Contrasenya nova"
            required
            error={passwordError}
            hint="Mínim 8 caràcters. L’usuari haurà de fer servir aquesta contrasenya al següent accés."
          >
            <TextInput
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setPasswordError('')
              }}
              invalid={Boolean(passwordError)}
              autoComplete="new-password"
              maxLength={120}
              required
            />
          </Field>
        </form>
      </Modal>

      <p className="mt-6 text-xs leading-relaxed text-slate-500">
        L’últim superadministrador actiu no es pot desactivar ni degradar. Cada canvi de rol,
        activació o invitació queda registrat a l’historial amb la persona que l’ha fet.
      </p>
    </div>
  )
}
