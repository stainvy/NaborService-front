import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ShieldCheck, Users, LayoutGrid } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const BRAND_POINTS = [
  { key: 'point_mfa', icon: ShieldCheck },
  { key: 'point_local', icon: Users },
  { key: 'point_services', icon: LayoutGrid },
];

// Mise en page deux colonnes façon SaaS pour les écrans d'auth : colonne
// « brand » (dégradé navy, masquée sur mobile) + colonne formulaire. L'habillage
// seulement — la logique d'auth vit dans Login/Register.
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');

  return (
    <div className="flex min-h-screen bg-brand-surface">
      {/* Colonne brand */}
      <aside className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-navy via-navy to-brand-navyDark p-10 text-white md:flex">
        <Link to="/" className="text-lg font-bold">
          {tc('app.name')}
        </Link>
        <div>
          <p className="text-3xl font-bold leading-snug">{t('brand.baseline')}</p>
          <ul className="mt-8 flex flex-col gap-4">
            {BRAND_POINTS.map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-center gap-3 text-white/90">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="h-5 w-5 text-orange" />
                </span>
                {t(`brand.${key}`)}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-white/60">{tc('app.tagline')}</p>
      </aside>

      {/* Colonne formulaire */}
      <div className="flex w-full flex-col md:w-1/2">
        <div className="flex items-center justify-between p-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-brand-muted hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4" />
            {tc('public.back_to_site')}
          </Link>
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <h1 className="mb-6 text-2xl font-bold text-fg">{title}</h1>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
