import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary';
type Tone = 'brand' | 'admin';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  tone?: Tone;
}

const VARIANT_CLASSES: Record<Tone, Record<Variant, string>> = {
  brand: {
    primary: 'bg-orange text-white hover:opacity-90',
    secondary: 'bg-navy text-white hover:opacity-90',
  },
  admin: {
    primary: 'bg-admin-accent text-white hover:bg-admin-accentHover',
    secondary: 'bg-white text-admin-text border border-admin-border hover:bg-admin-bg',
  },
};

export function Button({ variant = 'primary', tone = 'brand', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[tone][variant]} ${className}`}
      {...props}
    />
  );
}
