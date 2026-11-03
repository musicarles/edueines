import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Field, Textarea, TextInput } from './ui/Field'
import { fieldErrors, reportFormSchema, type FieldErrors } from '../lib/schemas'
import { ensurePublicWriteAccess } from '../lib/public-access'
import { getStore } from '../lib/store'
import type { ChangeReport, Tool } from '../lib/types'
import { makeId, nowIso } from '../lib/utils'

export function ReportChangeModal({
  tool,
  open,
  onClose,
}: {
  tool: Tool
  open: boolean
  onClose: () => void
}) {
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const parsed = reportFormSchema.safeParse({
      toolId: tool.id,
      toolName: tool.name,
      message: String(formData.get('message') ?? ''),
      reporterEmail: String(formData.get('reporterEmail') ?? ''),
    })
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      await ensurePublicWriteAccess()
      const store = await getStore()
      const id = makeId('report')
      const report: ChangeReport = {
        id,
        ...parsed.data,
        status: 'nou',
        createdAt: nowIso(),
        resolvedAt: null,
        resolvedBy: '',
      }
      await store.put('reports', id, report)
      toast.success('Gràcies! Hem rebut l’avís i el revisarem.')
      form.reset()
      onClose()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No s’ha pogut enviar l’avís. Torna-ho a provar.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Aquesta informació ha canviat"
      description={`Explica què ha canviat a la fitxa de ${tool.name}. L’equip administrador ho revisarà abans de modificar el catàleg.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel·la
          </Button>
          <Button type="submit" form="report-form" disabled={submitting}>
            {submitting ? 'Enviant…' : 'Envia l’avís'}
          </Button>
        </>
      }
    >
      <form id="report-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            No modifiquem cap dada automàticament. Si coneixes la font oficial del canvi,
            indica-la al missatge.
          </p>
        </div>
        <Field
          id="report-message"
          label="Què ha canviat?"
          required
          error={errors.message}
          hint="Per exemple: el pla gratuït ja no inclou el correu institucional o ha canviat el preu."
        >
          <Textarea
            id="report-message"
            name="message"
            rows={5}
            placeholder="Descriu el canvi amb el màxim de detall possible…"
            invalid={Boolean(errors.message)}
            required
          />
        </Field>
        <Field
          id="report-email"
          label="Correu electrònic"
          optional
          error={errors.reporterEmail}
          hint="Només el farem servir si necessitem confirmar algun detall."
        >
          <TextInput
            id="report-email"
            name="reporterEmail"
            type="email"
            placeholder="nom@centre.cat"
            invalid={Boolean(errors.reporterEmail)}
          />
        </Field>
      </form>
    </Modal>
  )
}
