import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, HeartHandshake, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '@/components/Button';
import { HeroIllustration } from './HeroIllustration';

const TRUST: { key: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: 'free', icon: HeartHandshake },
  { key: 'mfa', icon: ShieldCheck },
  { key: 'rgpd', icon: Lock },
];

export function Hero() {
  const { t } = useTranslation('landing');

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-bg via-navy/5 to-surface">
      {/* Décor de fond : strictement derrière le contenu, non interactif. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* dot grid façon plan de quartier, fondu sur les bords */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgb(var(--fg) / 0.07) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black 30%, transparent 78%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 70% 60% at 50% 45%, black 30%, transparent 78%)',
          }}
        />
        {/* blobs floutés dans les zones vides */}
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-navy/10 blur-3xl" />
        <div className="absolute -right-16 -top-20 h-96 w-96 rounded-full bg-orange/10 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-orange/5 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <span className="inline-flex items-center rounded-full bg-orange/15 px-3 py-1 text-sm font-medium text-orange">
            {t('hero.badge')}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-fg sm:text-5xl">
            {t('hero.title')}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">{t('hero.subtitle')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register">
              <Button className="inline-flex items-center gap-2 px-6 py-3 text-base">
                {t('hero.cta_primary')}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" className="px-6 py-3 text-base">
                {t('hero.cta_secondary')}
              </Button>
            </Link>
          </div>

          {/* Rangée de réassurance : comble l'espace sous les CTA */}
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {TRUST.map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-center gap-1.5 text-sm text-muted">
                <Icon className="h-4 w-4 text-orange" />
                {t(`hero.trust.${key}`)}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center lg:justify-end">
          <HeroIllustration alt={t('hero.illustration_alt')} />
        </div>
      </div>
    </section>
  );
}
