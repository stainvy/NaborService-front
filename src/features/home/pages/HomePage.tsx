import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Store,
  ClipboardList,
  MessageSquare,
  Compass,
  Search,
  User,
  CalendarDays,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/Button';

interface QuickCard {
  to?: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  soon?: boolean;
}

// Accueil habitant : l'AppHeader est fourni par HabitantLayout.
export function HomePage() {
  const { t } = useTranslation('common');
  const { user } = useAuth();

  const cards: QuickCard[] = [
    {
      to: '/listings',
      icon: Store,
      title: t('nav.listings'),
      description: t('home.cards.listings'),
    },
    {
      to: '/my-listings',
      icon: ClipboardList,
      title: t('home.cards.my_listings_title'),
      description: t('home.cards.my_listings'),
    },
    { to: '/chat', icon: MessageSquare, title: t('nav.chat'), description: t('home.cards.chat') },
    {
      to: '/discover',
      icon: Compass,
      title: t('nav.discover'),
      description: t('home.cards.discover'),
    },
    { to: '/search', icon: Search, title: t('nav.search'), description: t('home.cards.search') },
    { to: '/profile', icon: User, title: t('nav.profile'), description: t('home.cards.profile') },
    {
      to: '/events',
      icon: CalendarDays,
      title: t('home.cards.events_title'),
      description: t('home.cards.events'),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Bandeau de bienvenue */}
      <section className="rounded-2xl bg-navy p-8 text-white">
        <h1 className="text-2xl font-bold">
          {t('home.greeting', { name: user?.firstName ?? '' })}
        </h1>
        <p className="mt-1 text-white/80">{t('home.subtitle')}</p>
        <Link to="/listings/new" className="mt-5 inline-block">
          <Button className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('home.publish_cta')}
          </Button>
        </Link>
      </section>

      {/* Accès rapides */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-navy">{t('home.quick_access')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <QuickAccessCard key={card.title} card={card} soonLabel={t('home.soon')} />
          ))}
        </div>
      </section>
    </div>
  );
}

function QuickAccessCard({ card, soonLabel }: { card: QuickCard; soonLabel: string }) {
  const Icon = card.icon;
  const content = (
    <>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy">
          <Icon className="h-5 w-5" />
        </span>
        <span className="font-semibold text-navy">{card.title}</span>
        {card.soon && (
          <span className="ml-auto rounded-full bg-orange/15 px-2 py-0.5 text-xs font-medium text-orange">
            {soonLabel}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-gray">{card.description}</p>
    </>
  );

  if (card.soon || !card.to) {
    return (
      <div className="cursor-not-allowed rounded-xl border border-gray/30 p-4 opacity-60">
        {content}
      </div>
    );
  }

  return (
    <Link
      to={card.to}
      className="rounded-xl border border-gray/30 p-4 transition-colors hover:border-navy hover:bg-navy/5"
    >
      {content}
    </Link>
  );
}
