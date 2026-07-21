import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/Button';
import { HeroIllustration } from './HeroIllustration';

export function Hero() {
  const { t } = useTranslation('landing');

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-bg via-surface to-bg">
      {/* halo orange discret (CSS pur) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-orange/10 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
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
        </div>
        <div className="flex justify-center lg:justify-end">
          <HeroIllustration alt={t('hero.illustration_alt')} />
        </div>
      </div>
    </section>
  );
}
