import { forwardRef, useId, type InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

// Champ texte avec label + message d'erreur, branchable sur react-hook-form
// (forwardRef pour le register()).
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, className = '', ...props },
  ref,
) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-navy">
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={`rounded-md border px-3 py-2 focus:outline-none ${
          error ? 'border-error' : 'border-gray focus:border-navy'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
});
