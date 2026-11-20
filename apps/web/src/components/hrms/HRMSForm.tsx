'use client';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui';
export interface HrField {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  when?: { field: string; equals: string | boolean };
  options?: { value: string; label: string }[];
}
export interface HrForm {
  title: string;
  path: string;
  method?: 'post' | 'patch';
  fields: HrField[];
  initial?: Record<string, any>;
  prepare?: (values: Record<string, any>) => any;
  description?: string;
  preview?: (values: Record<string, any>) => string;
}
export function HRMSForm({
  config,
  busy,
  error,
  onSave,
  onClose,
}: {
  config: HrForm;
  busy: boolean;
  error: string;
  onSave: (values: Record<string, any>) => Promise<boolean>;
  onClose: () => void;
}) {
  const id = useId(),
    dialog = useRef<HTMLDialogElement>(null),
    sending = useRef(false);
  const [values, setValues] = useState<Record<string, any>>(() =>
    Object.fromEntries(
      config.fields.map((f) => [
        f.key,
        config.initial?.[f.key] ?? (f.type === 'checkbox' ? false : ''),
      ])
    )
  );
  useEffect(() => {
    const el = dialog.current;
    const active = document.activeElement as HTMLElement;
    el?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
      active?.focus();
    };
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || sending.current) return;
    sending.current = true;
    try {
      if (await onSave(values)) onClose();
    } finally {
      sending.current = false;
    }
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby={id}
      className="modal w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl p-0"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <form onSubmit={submit}>
        <div className="modal-header">
          <h2 id={id}>{config.title}</h2>
          <button
            type="button"
            className="icon-button"
            disabled={busy}
            onClick={onClose}
            aria-label="Close HR form"
          >
            ×
          </button>
        </div>
        <div className="p-5 space-y-4">
          {config.description && <p className="muted">{config.description}</p>}
          {config.preview && (
            <p role="status" className="state-box">
              {config.preview(values)}
            </p>
          )}
          {error && (
            <div role="alert" className="state-box">
              {error}
            </div>
          )}
          <div className="form-grid">
            {config.fields
              .filter((f) => !f.when || values[f.when.field] === f.when.equals)
              .map((f) => {
                const key = id + f.key;
                return (
                  <div className="field" key={f.key}>
                    <label htmlFor={key}>
                      {f.label}
                      {f.required ? ' *' : ''}
                    </label>
                    {f.options ? (
                      <select
                        id={key}
                        required={f.required}
                        value={values[f.key]}
                        disabled={busy}
                        onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      >
                        <option value="">Choose {f.label.toLowerCase()}</option>
                        {f.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : f.type === 'textarea' ? (
                      <textarea
                        id={key}
                        required={f.required}
                        maxLength={4000}
                        value={values[f.key]}
                        disabled={busy}
                        onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      />
                    ) : (
                      <input
                        id={key}
                        type={f.type || 'text'}
                        required={f.required}
                        min={f.min}
                        max={f.max}
                        step={f.type === 'number' ? (f.step ?? 1) : undefined}
                        maxLength={f.maxLength ?? (f.type === 'text' || !f.type ? 255 : undefined)}
                        autoComplete={f.type === 'password' ? 'new-password' : undefined}
                        checked={f.type === 'checkbox' ? values[f.key] : undefined}
                        value={f.type === 'checkbox' ? undefined : values[f.key]}
                        disabled={busy}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            [f.key]:
                              f.type === 'checkbox'
                                ? e.target.checked
                                : f.type === 'number'
                                  ? e.target.value === ''
                                    ? ''
                                    : Number(e.target.value)
                                  : e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                );
              })}
          </div>
        </div>
        <div className="modal-actions">
          <Button variant="outline" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={busy}>
            Save changes
          </Button>
        </div>
      </form>
    </dialog>
  );
}
