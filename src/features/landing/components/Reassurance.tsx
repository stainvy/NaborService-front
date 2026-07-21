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

// Bandeau de réassurance : garanties clés, colonnes centrées et de hauteur égale.
export function Reassurance() {
  const { t } = useTranslation('landing');

  return (
    <section className="bg-surface">
      <div className="mx-auto grid max-w-6xl items-stretch gap-8 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ key, icon: Icon }) => (
          <div key={key} className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/10 text-navy">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold text-fg">{t(`reassurance.${key}.title`)}</p>
              <p className="mt-1 text-sm text-muted">{t(`reassurance.${key}.desc`)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
