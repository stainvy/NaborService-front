import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { HeartHandshake, ShieldCheck, Home } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { SectionHeading } from '@/components/ui/SectionHeading';

interface Value {
  key: string;
  icon: ComponentType<{ className?: string }>;
}

const VALUES: Value[] = [
  { key: 'proximity', icon: Home },
  { key: 'trust', icon: ShieldCheck },
  { key: 'solidarity', icon: HeartHandshake },
];

// Bloc communautaire : valeurs de confiance (génériques, sans faux témoignages).
// Bande claire (surface) après la bande sombre, cartes de hauteur égale.
export function CommunityValues() {
  const { t } = useTranslation('landing');

  return (
    <section id="values" className="scroll-mt-20 bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading align="center" title={t('values.title')} subtitle={t('values.subtitle')} />
        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {VALUES.map(({ key, icon: Icon }) => (
            <Card key={key} className="flex h-full flex-col items-center p-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/10 text-navy">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-fg">{t(`values.${key}.title`)}</h3>
              <p className="mt-2 text-sm text-muted">{t(`values.${key}.desc`)}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
