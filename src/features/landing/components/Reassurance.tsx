import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, CreditCard, Lock, Users } from 'lucide-react';

interface Item {
  key: string;
  icon: ComponentType<{ className?: string }>;
}

const ITEMS: Item[] = [
  { key: 'mfa', icon: ShieldCheck },
  { key: 'payments', icon: CreditCard },
  { key: 'rgpd', icon: Lock },
  { key: 'local', icon: Users },
];

// Bandeau de réassurance : quelques garanties clés avec icônes.
export function Reassurance() {
  const { t } = useTranslation('landing');

  return (
    <section className="border-y border-brand-border bg-brand-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ key, icon: Icon }) => (
          <div key={key} className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/10 text-navy">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-navy">{t(`reassurance.${key}.title`)}</p>
              <p className="mt-1 text-sm text-brand-muted">{t(`reassurance.${key}.desc`)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
