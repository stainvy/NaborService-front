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

// Présentation des modules du projet, en cartes de hauteur égale rythmées par
// leurs icônes. Bande de fond claire.
export function Features() {
  const { t } = useTranslation('landing');

  return (
    <section id="features" className="scroll-mt-20 bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading
          align="center"
          title={t('features.title')}
          subtitle={t('features.subtitle')}
        />
        <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ key, icon: Icon }) => (
            <Card key={key} variant="interactive" className="flex h-full flex-col p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange/15 text-orange">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-fg">{t(`features.${key}.title`)}</h3>
              <p className="mt-2 text-sm text-muted">{t(`features.${key}.desc`)}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
