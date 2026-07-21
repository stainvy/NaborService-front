import { useTranslation } from 'react-i18next';
import { UserPlus, MapPin, MessagesSquare } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';

const STEPS = [
  { key: 'one', icon: UserPlus },
  { key: 'two', icon: MapPin },
  { key: 'three', icon: MessagesSquare },
];

// « Comment ça marche » : trois étapes numérotées, sur une bande sombre (navy)
// pour casser le rythme visuel au milieu de la page.
export function HowItWorks() {
  const { t } = useTranslation('landing');

  return (
    <section
      id="how"
      className="scroll-mt-20 bg-gradient-to-br from-navy via-navy to-brand-navyDark text-white"
    >
      <div className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading
          align="center"
          invert
          title={t('steps.title')}
          subtitle={t('steps.subtitle')}
        />
        <div className="grid items-stretch gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex flex-col items-center text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-orange ring-1 ring-white/15">
                  <Icon className="h-7 w-7" />
                </span>
                <span className="mt-4 text-sm font-bold uppercase tracking-wide text-orange">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  {t(`steps.${step.key}.title`)}
                </h3>
                <p className="mt-2 max-w-xs text-sm text-white/70">
                  {t(`steps.${step.key}.desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
