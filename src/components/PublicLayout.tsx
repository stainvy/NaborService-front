import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/Button';

// En-tête marketing (distinct de l'AppHeader connecté) + footer, pour la
// vitrine publique. Header sticky qui gagne un fond translucide au scroll.
export function PublicLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('landing');
  const { t: tc } = useTranslation('common');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const anchors = [
    { href: '#features', label: t('nav.features') },
    { href: '#how', label: t('nav.how') },
    { href: '#values', label: t('nav.values') },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-brand-surface">
      <header
        className={`sticky top-0 z-40 transition-colors ${
          scrolled
            ? 'border-b border-brand-border bg-brand-surface/85 backdrop-blur'
            : 'border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <Link to="/" className="text-lg font-bold text-fg">
            {tc('app.name')}
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-fg md:flex">
            {anchors.map((a) => (
              <a key={a.href} href={a.href} className="transition-colors hover:text-orange">
                {a.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
            <Link to="/login" className="hidden sm:block">
              <Button variant="secondary">{tc('public.login')}</Button>
            </Link>
            <Link to="/register">
              <Button>{tc('public.register')}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-brand-border bg-brand-bg">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-bold text-fg">{tc('app.name')}</p>
            <p className="mt-2 text-sm text-brand-muted">{t('footer.tagline')}</p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-fg">{t('footer.product')}</p>
            <ul className="flex flex-col gap-2 text-sm text-brand-muted">
              {anchors.map((a) => (
                <li key={a.href}>
                  <a href={a.href} className="hover:text-orange">
                    {a.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-fg">{t('footer.legal')}</p>
            <ul className="flex flex-col gap-2 text-sm text-brand-muted">
              <li>{t('footer.legal_notice')}</li>
              <li>{t('footer.privacy')}</li>
              <li>{t('footer.contact')}</li>
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/register">
              <Button className="w-full">{tc('public.register')}</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" className="w-full">
                {tc('public.login')}
              </Button>
            </Link>
          </div>
        </div>
        <div className="border-t border-brand-border">
          <p className="mx-auto max-w-6xl px-6 py-4 text-xs text-brand-muted">
            © {tc('app.name')} — {t('footer.rights')}
          </p>
        </div>
      </footer>
    </div>
  );
}
