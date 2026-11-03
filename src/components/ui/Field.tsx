import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { cn } from '../../lib/utils'

const controlBase =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm transition placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 disabled:cursor-not-allowed disabled:bg-slate-50'

export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
  optional,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  optional?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="flex items-baseline gap-1 text-sm font-semibold text-ink">
        {label}
        {required ? (
          <span className="text-rose-600" aria-hidden="true">
            *
          </span>
        ) : null}
        {optional ? (
          <span className="text-xs font-normal text-slate-500">(opcional)</span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p className="text-xs leading-relaxed text-slate-500">{hint}</p>
      ) : null}
      {error ? (
        <p className="text-xs font-medium text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function TextInput({
  className,
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={cn(controlBase, invalid && 'border-rose-400 focus:border-rose-500', className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
}

export function Select({
  className,
  invalid,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      className={cn(
        controlBase,
        'appearance-none bg-[length:1rem] bg-[right_0.9rem_center] bg-no-repeat pr-10',
        invalid && 'border-rose-400',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  )
}

export function Textarea({
  className,
  invalid,
  rows = 4,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      rows={rows}
      className={cn(controlBase, 'resize-y', invalid && 'border-rose-400', className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
}

export function Checkbox({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        'size-4 rounded border-slate-300 text-brand-700 accent-brand-700 focus:ring-2 focus:ring-brand-600/30',
        className,
      )}
      {...props}
    />
  )
}

export function CheckboxCard({
  id,
  name,
  value,
  label,
  description,
  defaultChecked,
  checked,
  onChange,
}: {
  id: string
  name: string
  value: string
  label: string
  description?: string
  defaultChecked?: boolean
  checked?: boolean
  onChange?: (checked: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm transition hover:border-brand-300 hover:bg-brand-50/40 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50/70"
    >
      <Checkbox
        id={id}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={onChange ? (event) => onChange(event.target.checked) : undefined}
        className="mt-0.5"
      />
      <span>
        <span className="block font-medium text-ink">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  )
}

export function FormSection({
  title,
  description,
  children,
  step,
}: {
  title: string
  description?: string
  children: ReactNode
  step?: string
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        {step ? (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-800">
            {step}
          </span>
        ) : null}
        <div>
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  )
}
