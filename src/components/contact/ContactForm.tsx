'use client'

import { useActionState, useEffect, useRef } from 'react'

import { type ContactState, sendMessage } from '@/app/(frontend)/actions'
import Magnet from '@/components/reactbits/Magnet'

const initial: ContactState = { status: 'idle' }

export function ContactForm() {
  const [state, action, pending] = useActionState(sendMessage, initial)
  // Time of first interaction, for the server-side minimum-fill-time check.
  const startedRef = useRef<HTMLInputElement>(null)
  const markStart = () => {
    if (startedRef.current && startedRef.current.value === '0') startedRef.current.value = String(Date.now())
  }
  const formRef = useRef<HTMLFormElement>(null)
  const statusRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset()
      if (startedRef.current) startedRef.current.value = '0'
    }
    if (state.status !== 'idle') statusRef.current?.focus()
  }, [state])

  const err = state.fieldErrors ?? {}
  const v = state.values ?? {}

  return (
    <form ref={formRef} action={action} noValidate onFocusCapture={markStart} onPointerDownCapture={markStart} className="grid gap-8" aria-describedby="contact-status">
      <input ref={startedRef} type="hidden" name="started" defaultValue="0" />
      {/* Honeypot: hidden from people and assistive tech, attractive to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Web sitesi
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Field label="Ad" name="name" defaultValue={v.name} error={err.name} autoComplete="name" required />
        <Field label="E-posta" name="email" type="email" defaultValue={v.email} error={err.email} autoComplete="email" required />
      </div>
      <Field label="Konu" name="subject" defaultValue={v.subject} error={err.subject} hint="isteğe bağlı" />
      <Field label="Mesaj" name="message" defaultValue={v.message} error={err.message} textarea required />

      <div className="flex flex-col-reverse gap-5 sm:flex-row sm:items-center sm:justify-between">
        <p
          id="contact-status"
          ref={statusRef}
          tabIndex={-1}
          role={state.status === 'error' ? 'alert' : 'status'}
          className={`min-h-[1.5rem] text-[0.92rem] outline-none ${state.status === 'error' ? 'text-accent-text' : 'text-fg-soft'}`}
        >
          {state.status === 'success' && <span className="mr-2 font-mono text-accent-text">✓</span>}
          {state.message}
        </p>
        <Magnet padding={40} magnetStrength={3} maxOffset={10} disabled={pending}>
          <button type="submit" disabled={pending} className="btn btn-primary disabled:cursor-wait disabled:opacity-60">
            {pending ? 'Gönderiliyor…' : 'Gönder'}
            <span aria-hidden="true" className="font-mono">
              ↵
            </span>
          </button>
        </Magnet>
      </div>
    </form>
  )
}

type FieldProps = {
  label: string
  name: string
  type?: string
  error?: string
  hint?: string
  textarea?: boolean
  required?: boolean
  autoComplete?: string
  defaultValue?: string
}

function Field({ label, name, type = 'text', error, hint, textarea, required, autoComplete, defaultValue }: FieldProps) {
  const id = `f-${name}`
  const describedBy = error ? `${id}-err` : undefined
  const common = {
    id,
    name,
    required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    defaultValue,
    className: 'field',
  } as const
  return (
    <div>
      <label htmlFor={id} className="meta flex justify-between">
        <span className="text-fg-soft">
          {label}
          {required && <span className="text-accent-text"> *</span>}
        </span>
        {hint && <span>{hint}</span>}
      </label>
      {textarea ? <textarea {...common} rows={5} className="field resize-y" maxLength={4000} /> : <input {...common} type={type} autoComplete={autoComplete} maxLength={160} />}
      {error && (
        <p id={describedBy} className="mt-2 text-[0.85rem] text-accent-text">
          {error}
        </p>
      )}
    </div>
  )
}
