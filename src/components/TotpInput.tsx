import { useId } from 'react';

interface TotpInputProps {
  value: string;
  onChange: (code: string) => void;
  length?: number;
  disabled?: boolean;
  label?: string;
}

export function TotpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  label,
}: TotpInputProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
      )}
      <input
        id={id}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d*"
        maxLength={length}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
        className="w-60 rounded-md border border-gray px-3 py-2 text-center text-2xl tracking-[0.5em] focus:border-navy focus:outline-none"
        placeholder={'•'.repeat(length)}
      />
    </div>
  );
}
