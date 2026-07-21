interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

// Interrupteur on/off accessible (checkbox stylée).
export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2">
      <span className="text-sm text-fg">{label}</span>
      <span className="relative inline-flex">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="h-6 w-11 rounded-full bg-gray transition-colors peer-checked:bg-success peer-disabled:opacity-50" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-surface transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
