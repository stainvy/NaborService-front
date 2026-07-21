import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { Handshake, CalendarDays, MessageSquare, FileSignature, BarChart3, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { SectionHeading } from '@/components/ui/SectionHeading';

interface Feature {
  key: string;
  icon: ComponentType<{ className?: string }>;
}

const FEATURES: Feature[] = [
  { key: 'services', icon: Handshake },
  { key: 'events', icon: CalendarDays },
  { key: 'messaging', icon: MessageSquare },
  { key: 'documents', icon: FileSignature },
  { key: 'polls', icon: BarChart3 },
  { key: 'neighbourhood', icon: MapPin },
];

// Présentation des modules du projet, en cartes rythmées par leurs icônes.
export function Features() {
  const { t } = useTranslation('landing');

  return (
    <section id="features" className="scroll-mt-20 bg-brand-bg">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <SectionHeading title={t('features.title')} subtitle={t('features.subtitle')} />
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ key, icon: Icon }) => (
            <Card key={key} variant="interactive" className="p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange/15 text-orange">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-fg">
                {t(`features.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm text-brand-muted">{t(`features.${key}.desc`)}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
