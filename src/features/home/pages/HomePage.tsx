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
  MapPin,
  Coins,
  Bell,
  PackageOpen,
  CalendarClock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/Button';
import { Card } from '@/components/ui/Card';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { StatTile } from '@/components/ui/StatTile';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAllNeighbourhoods } from '@/hooks/useNeighbourhoodPicker';
import { usePointsBalance } from '@/features/points/hooks/usePoints';
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications';
import { useListings } from '@/features/listings/hooks/useListings';
import { useEvents } from '@/features/events/hooks/useEvents';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { EventCard } from '@/features/events/components/EventCard';

const PREVIEW_LIMIT = 3;

interface QuickCard {
  to: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

// Accueil habitant : tableau de bord de quartier (l'AppHeader vient de
// HabitantLayout). Consomme uniquement des hooks existants.
export function HomePage() {
  const { t } = useTranslation('common');
  const { user } = useAuth();

  const { data: neighbourhoods } = useAllNeighbourhoods();
  const myNeighbourhood = neighbourhoods?.find((n) => n.pgId === user?.neighbourhoodId);
  const nbName = myNeighbourhood
    ? [myNeighbourhood.name, myNeighbourhood.city].filter(Boolean).join(', ')
    : null;
  const nbFilter = user?.neighbourhoodId ?? undefined;

  const points = usePointsBalance();
  const unread = useUnreadCount();
  const listings = useListings({ neighbourhood: nbFilter, status: 'open', limit: PREVIEW_LIMIT });
  const events = useEvents({ neighbourhood: nbFilter, upcoming: true, limit: PREVIEW_LIMIT });

  const cards: QuickCard[] = [
    { to: '/listings', icon: Store, title: t('nav.listings'), description: t('home.cards.listings') },
    {
      to: '/my-listings',
      icon: ClipboardList,
      title: t('home.cards.my_listings_title'),
      description: t('home.cards.my_listings'),
    },
    { to: '/chat', icon: MessageSquare, title: t('nav.chat'), description: t('home.cards.chat') },
    { to: '/discover', icon: Compass, title: t('nav.discover'), description: t('home.cards.discover') },
    { to: '/search', icon: Search, title: t('nav.search'), description: t('home.cards.search') },
    { to: '/profile', icon: User, title: t('nav.profile'), description: t('home.cards.profile') },
  ];

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="mx-auto max-w-6xl space-y-10 p-6">
        {/* Hero contextuel */}
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy to-brand-navyDark p-8 text-white shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold">
                {t('home.greeting', { name: user?.firstName ?? '' })}
              </h1>
              <p className="mt-1 text-white/80">{t('home.subtitle')}</p>
              {nbName && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm">
                  <MapPin className="h-4 w-4" />
                  {t('home.hero.neighbourhood', { name: nbName })}
                </p>
              )}
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3">
              <Coins className="h-5 w-5 text-orange" />
              <div>
                <p className="text-lg font-bold leading-tight">{points.data?.pointsBalance ?? 0}</p>
                <p className="text-xs text-white/70">{t('home.hero.points')}</p>
              </div>
            </div>
          </div>
          <Link to="/listings/new" className="mt-6 inline-block">
            <Button className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('home.publish_cta')}
            </Button>
          </Link>
        </section>

        {/* Incitation à définir son quartier (non bloquant) */}
        {user && !user.neighbourhoodId && (
          <Link
            to="/profile/edit"
            className="flex items-center gap-3 rounded-2xl border border-orange/40 bg-orange/10 p-4 shadow-soft transition-colors hover:bg-orange/15"
          >
            <MapPin className="h-5 w-5 shrink-0 text-orange" />
            <div>
              <p className="font-semibold text-fg">{t('home.neighbourhood_banner.title')}</p>
              <p className="text-sm text-brand-muted">{t('home.neighbourhood_banner.subtitle')}</p>
            </div>
          </Link>
        )}

        {/* Votre activité — stats légères */}
        <section>
          <SectionHeading title={t('home.your_activity')} />
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile
              icon={PackageOpen}
              label={t('home.stats.active_listings')}
              value={listings.data?.meta?.total ?? 0}
              loading={listings.isLoading}
            />
            <StatTile
              icon={CalendarClock}
              label={t('home.stats.upcoming_events')}
              value={events.data?.meta?.total ?? 0}
              loading={events.isLoading}
            />
            <StatTile
              icon={Bell}
              label={t('home.stats.unread')}
              value={unread.data?.unreadCount ?? 0}
              loading={unread.isLoading}
            />
          </div>
        </section>

        {/* Près de chez vous — annonces récentes */}
        <section>
          <SectionHeading
            title={t('home.near_you.title')}
            subtitle={t('home.near_you.subtitle')}
            seeAllTo="/listings"
            seeAllLabel={t('home.see_all')}
          />
          {listings.isError ? (
            <p className="text-sm text-error">{t('home.error.listings')}</p>
          ) : listings.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: PREVIEW_LIMIT }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : listings.data && listings.data.data.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.data.data.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Store}
              title={t('home.empty.listings.title')}
              description={t('home.empty.listings.description')}
              action={
                <Link to="/listings/new">
                  <Button>{t('home.publish_cta')}</Button>
                </Link>
              }
            />
          )}
        </section>

        {/* Événements à venir */}
        <section>
          <SectionHeading
            title={t('home.upcoming_events.title')}
            subtitle={t('home.upcoming_events.subtitle')}
            seeAllTo="/events"
            seeAllLabel={t('home.see_all')}
          />
          {events.isError ? (
            <p className="text-sm text-error">{t('home.error.events')}</p>
          ) : events.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: PREVIEW_LIMIT }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : events.data && events.data.data.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.data.data.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title={t('home.empty.events.title')}
              description={t('home.empty.events.description')}
              action={
                <Link to="/events">
                  <Button variant="secondary">{t('home.see_all')}</Button>
                </Link>
              }
            />
          )}
        </section>

        {/* Accès rapides */}
        <section>
          <SectionHeading title={t('home.quick_access')} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <QuickAccessCard key={card.to} card={card} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function QuickAccessCard({ card }: { card: QuickCard }) {
  const Icon = card.icon;
  return (
    <Link to={card.to} className="block">
      <Card variant="interactive" className="h-full p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy/10 text-fg">
            <Icon className="h-5 w-5" />
          </span>
          <span className="font-semibold text-fg">{card.title}</span>
        </div>
        <p className="mt-2 text-sm text-brand-muted">{card.description}</p>
      </Card>
    </Link>
  );
}
