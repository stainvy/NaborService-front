import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/Button';

// Bande d'appel à l'action final avant le footer.
export function FinalCta() {
  const { t } = useTranslation('landing');

  return (
    <section className="bg-brand-surface">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy to-brand-navyDark px-8 py-14 text-center text-white shadow-card">
          <h2 className="text-3xl font-bold">{t('final_cta.title')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">{t('final_cta.subtitle')}</p>
          <Link to="/register" className="mt-8 inline-block">
            <Button className="inline-flex items-center gap-2 px-8 py-3 text-base">
              {t('final_cta.button')}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
