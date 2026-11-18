import { type ReactNode, useId } from 'react';
export function Field({ label, children }: { label: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children(id)}
    </div>
  );
}
export function PreschoolText({
  label,
  value,
  onChange,
  type = 'text',
  maxLength = 200,
  required = true,
  min,
  max,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  maxLength?: number;
  required?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      {(id) => (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          required={required}
          min={min}
          max={max}
          placeholder={placeholder}
        />
      )}
    </Field>
  );
}
export function PreschoolArea({
  label,
  value,
  onChange,
  maxLength = 5000,
  required = false,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  required?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      {(id) => (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          required={required}
          rows={rows}
          placeholder={placeholder}
        />
      )}
    </Field>
  );
}
