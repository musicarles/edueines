import { useMemo, useState, type FormEvent } from 'react'
import {
  ArrowDown,
  ArrowUp,
  FolderTree,
  Pencil,
  Plus,
  Power,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../lib/auth/AuthProvider'
import { useData } from '../../lib/data-context'
import { can } from '../../lib/permissions'
import { CATEGORY_ICONS, CategoryIcon } from '../../components/icons'
import { parseCategoryForm, type FieldErrors } from '../../lib/schemas'
import { addHistory, diffValues } from '../../lib/history'
import { getStore } from '../../lib/store'
import type { Category } from '../../lib/types'
import {
  cn,
  normalizeNameForComparison,
  slugify,
} from '../../lib/utils'
import { AdminAccessDenied, AdminPageHeader, StatCard } from '../../components/admin/AdminUI'
import { Button } from '../../components/ui/Button'
import { Field, Select, TextInput, Textarea } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback'

const ICON_OPTIONS = Object.keys(CATEGORY_ICONS)

const FIELD_LABELS: Record<string, string> = {
  name: 'Nom',
  description: 'Descripció',
  icon: 'Icona',
  color: 'Color',
  active: 'Activa',
}

interface Draft {
  name: string
  description: string
  icon: string
  color: string
  active: boolean
}

const EMPTY_DRAFT: Draft = {
  name: '',
  description: '',
  icon: 'shapes',
  color: '#64748b',
  active: true,
}

export default function AdminCategoriesPage() {
  const { user } = useAuth()
  const { categories, tools, loading, error, refresh } = useData()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const actor = user ? { uid: user.uid, name: user.displayName } : null
  const allowed = can(user?.role, 'categories.manage')

  const ordered = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'ca')),
    [categories],
  )

  const usage = useMemo(() => {
    const map = new Map<string, number>()
    for (const tool of tools) {
      map.set(tool.categoryId, (map.get(tool.categoryId) ?? 0) + 1)
    }
    return map
  }, [tools])

  if (!allowed) {
    return (
      <AdminAccessDenied
        title="Categories"
        description="Només el superadministrador i els administradors poden crear, editar o desactivar categories."
      />
    )
  }

  function openCreate() {
    setEditing(null)
    setDraft(EMPTY_DRAFT)
    setErrors({})
    setFormOpen(true)
  }

  function openEdit(category: Category) {
    setEditing(category)
    setDraft({
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      active: category.active,
    })
    setErrors({})
    setFormOpen(true)
  }

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!actor) return

    const formData = new FormData()
    formData.set('name', draft.name)
    formData.set('description', draft.description)
    formData.set('icon', draft.icon)
    formData.set('color', draft.color)
    if (draft.active) formData.set('active', 'on')

    const parsed = parseCategoryForm(formData)
    if (!parsed.ok) {
      setErrors(parsed.errors)
      toast.error('Revisa els camps marcats.')
      return
    }

    const data = parsed.data
    const normalizedName = normalizeNameForComparison(data.name)
    const duplicate = categories.find(
      (category) =>
        category.id !== editing?.id &&
        (normalizeNameForComparison(category.name) === normalizedName ||
          (editing ? false : category.id === slugify(data.name))),
    )
    if (duplicate) {
      toast.error(`Ja existeix una categoria amb aquest nom: «${duplicate.name}».`)
      return
    }

    setSaving(true)
    try {
      const store = await getStore()
      if (editing) {
        const next: Category = {
          ...editing,
          name: data.name,
          description: data.description ?? '',
          icon: data.icon ?? 'shapes',
          color: data.color.toUpperCase(),
          active: data.active ?? true,
        }
        const changes = diffValues(
          editing as unknown as Record<string, unknown>,
          next as unknown as Record<string, unknown>,
          FIELD_LABELS,
        )
        await store.put('categories', editing.id, next)
        await addHistory({
          entityType: 'categoria',
          entityId: editing.id,
          entityName: next.name,
          action: 'editada',
          summary:
            changes.length > 0
              ? `Categoria editada. Canvis: ${changes.map((change) => change.field).join(', ')}.`
              : 'Categoria desada sense canvis de contingut.',
          actorUid: actor.uid,
          actorName: actor.name,
          changes,
        })
        toast.success('Categoria actualitzada.')
      } else {
        const id = slugify(data.name)
        if (!id) {
          toast.error('El nom de la categoria no permet generar un identificador vàlid.')
          return
        }
        const order =
          categories.reduce((maximum, category) => Math.max(maximum, category.order), 0) + 1
        const next: Category = {
          id,
          slug: id,
          name: data.name,
          description: data.description ?? '',
          icon: data.icon ?? 'shapes',
          color: data.color.toUpperCase(),
          order,
          active: data.active ?? true,
        }
        await store.put('categories', id, next)
        await addHistory({
          entityType: 'categoria',
          entityId: id,
          entityName: next.name,
          action: 'creada',
          summary: `Categoria creada a l’administració (${next.active ? 'activa' : 'inactiva'}).`,
          actorUid: actor.uid,
          actorName: actor.name,
          changes: [],
        })
        toast.success('Categoria creada.')
      }
      await refresh()
      setFormOpen(false)
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : 'No s’ha pogut desar la categoria.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(category: Category) {
    if (!actor) return
    setBusyId(category.id)
    try {
      const store = await getStore()
      const next = { ...category, active: !category.active }
      await store.put('categories', category.id, next)
      await addHistory({
        entityType: 'categoria',
        entityId: category.id,
        entityName: category.name,
        action: category.active ? 'desactivada' : 'activada',
        summary: category.active
          ? 'La categoria s’ha desactivat i ja no s’ofereix al formulari de propostes.'
          : 'La categoria s’ha reactivat i torna a estar disponible.',
        actorUid: actor.uid,
        actorName: actor.name,
        changes: [],
      })
      await refresh()
      toast.success(category.active ? 'Categoria desactivada.' : 'Categoria activada.')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut actualitzar.')
    } finally {
      setBusyId(null)
    }
  }

  async function move(category: Category, direction: -1 | 1) {
    if (!actor) return
    const index = ordered.findIndex((item) => item.id === category.id)
    const other = ordered[index + direction]
    if (!other) return
    setBusyId(category.id)
    try {
      const store = await getStore()
      await store.put('categories', category.id, { ...category, order: other.order })
      await store.put('categories', other.id, { ...other, order: category.order })
      await addHistory({
        entityType: 'categoria',
        entityId: category.id,
        entityName: category.name,
        action: 'reordenada',
        summary: `S’ha canviat l’ordre de les categories: «${category.name}» i «${other.name}».`,
        actorUid: actor.uid,
        actorName: actor.name,
        changes: [],
      })
      await refresh()
      toast.success('Ordre actualitzat.')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut reordenar.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete() {
    if (!actor || !deleteTarget) return
    const count = usage.get(deleteTarget.id) ?? 0
    if (count > 0) {
      toast.error('No es pot eliminar una categoria que té eines assignades.')
      return
    }
    setSaving(true)
    try {
      const store = await getStore()
      await store.remove('categories', deleteTarget.id)
      await addHistory({
        entityType: 'categoria',
        entityId: deleteTarget.id,
        entityName: deleteTarget.name,
        action: 'eliminada',
        summary: 'Categoria eliminada definitivament.',
        actorUid: actor.uid,
        actorName: actor.name,
        changes: [],
      })
      await refresh()
      setDeleteTarget(null)
      toast.success('Categoria eliminada.')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut eliminar.')
    } finally {
      setSaving(false)
    }
  }

  const activeCount = ordered.filter((category) => category.active).length

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Les categories organitzen el catàleg i el formulari públic. Si una categoria té eines assignades no es pot eliminar: desactiva-la per amagar-la sense perdre dades."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Nova categoria
          </Button>
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

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard
          label="Categories"
          value={ordered.length}
          hint="Creades a l’administració"
          icon={<FolderTree className="size-4" aria-hidden="true" />}
        />
        <StatCard
          label="Actives"
          value={activeCount}
          hint="Visibles al formulari de propostes"
          tone="emerald"
          icon={<Power className="size-4" aria-hidden="true" />}
        />
        <StatCard
          label="Amb eines"
          value={new Set(tools.map((tool) => tool.categoryId)).size}
          hint="Categories que ja tenen fitxes"
          tone="sky"
          icon={<FolderTree className="size-4" aria-hidden="true" />}
        />
      </div>

      {loading ? (
        <LoadingBlock label="Carregant les categories…" />
      ) : ordered.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="size-5" />}
          title="Encara no hi ha categories"
          description="Crea la primera categoria per començar a organitzar el catàleg. També pots restaurar el catàleg inicial des de la configuració."
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" aria-hidden="true" />
              Nova categoria
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ordered.map((category, index) => {
            const count = usage.get(category.id) ?? 0
            return (
              <li
                key={category.id}
                className={cn(
                  'flex flex-col rounded-2xl border bg-white p-4 shadow-sm',
                  category.active ? 'border-slate-200' : 'border-slate-200 bg-slate-50/80',
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${category.color}1a`,
                      color: category.color,
                    }}
                  >
                    <CategoryIcon name={category.icon} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-sm font-bold leading-snug text-ink">
                      {category.name}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {count} {count === 1 ? 'eina' : 'eines'} · ordre {category.order}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset',
                      category.active
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                        : 'bg-slate-100 text-slate-500 ring-slate-200',
                    )}
                  >
                    {category.active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <p className="mt-3 flex-1 text-xs leading-relaxed text-slate-600">
                  {category.description || 'Sense descripció.'}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
                  <Button size="sm" variant="outline" onClick={() => openEdit(category)}>
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Edita
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === category.id}
                    onClick={() => toggleActive(category)}
                  >
                    <Power className="size-3.5" aria-hidden="true" />
                    {category.active ? 'Desactiva' : 'Activa'}
                  </Button>
                  <span className="ml-auto flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(category, -1)}
                      disabled={index === 0 || busyId === category.id}
                      aria-label={`Mou «${category.name}» cap amunt`}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-ink disabled:opacity-30"
                    >
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(category, 1)}
                      disabled={index === ordered.length - 1 || busyId === category.id}
                      aria-label={`Mou «${category.name}» cap avall`}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-ink disabled:opacity-30"
                    >
                      <ArrowDown className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(category)}
                      disabled={count > 0}
                      title={
                        count > 0
                          ? 'No es pot eliminar: té eines assignades'
                          : 'Elimina la categoria'
                      }
                      aria-label={`Elimina «${category.name}»`}
                      className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Les categories inactives no apareixen al formulari públic ni als filtres del catàleg, però
        les eines que hi estan assignades es conserven.
      </p>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edita la categoria' : 'Nova categoria'}
        description={
          editing
            ? 'El canvi de nom no modifica l’identificador intern, de manera que les eines assignades es mantenen.'
            : 'L’identificador intern es genera a partir del nom.'
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel·la
            </Button>
            <Button type="submit" form="category-form" disabled={saving}>
              {saving ? 'Desant…' : editing ? 'Desa els canvis' : 'Crea la categoria'}
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field id="category-name" label="Nom" required error={errors.name}>
            <TextInput
              id="category-name"
              value={draft.name}
              onChange={(event) => update('name', event.target.value)}
              invalid={Boolean(errors.name)}
              maxLength={60}
              required
            />
          </Field>

          <Field
            id="category-description"
            label="Descripció"
            optional
            error={errors.description}
            hint="Apareix a les targetes de categoria i ajuda a classificar eines."
          >
            <Textarea
              id="category-description"
              rows={3}
              value={draft.description}
              onChange={(event) => update('description', event.target.value)}
              maxLength={240}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="category-icon" label="Icona" required error={errors.icon}>
              <Select
                id="category-icon"
                value={draft.icon}
                onChange={(event) => update('icon', event.target.value)}
              >
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </Select>
            </Field>

            <Field id="category-color" label="Color" required error={errors.color}>
              <div className="flex items-center gap-2">
                <input
                  id="category-color"
                  type="color"
                  value={draft.color}
                  onChange={(event) => update('color', event.target.value.toUpperCase())}
                  className="size-10 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-0.5"
                  aria-label="Selector de color"
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
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-cream/60 p-3">
            <span
              className="flex size-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${draft.color}1a`, color: draft.color }}
            >
              <CategoryIcon name={draft.icon} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Vista prèvia</p>
              <p className="text-xs text-slate-500">
                {draft.name.trim() || 'Nom de la categoria'}
              </p>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(event) => update('active', event.target.checked)}
              className="mt-0.5 size-4 rounded border-slate-300 accent-brand-700"
            />
            <span>
              <span className="block font-semibold text-ink">Categoria activa</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Si la desactives, no s’oferirà al formulari públic ni als filtres.
              </span>
            </span>
          </label>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Elimina la categoria"
        description="Aquesta acció no es pot desfer. Si la categoria té eines assignades, primer cal reassignar-les."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={saving}>
              Cancel·la
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={saving}>
              {saving ? 'Eliminant…' : 'Elimina definitivament'}
            </Button>
          </>
        }
      >
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          S’eliminarà la categoria «{deleteTarget?.name}». Aquesta acció queda registrada a
          l’historial.
        </p>
      </Modal>
    </div>
  )
}
