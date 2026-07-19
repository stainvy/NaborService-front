import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { EventCard } from './EventCard';
import type { NaborEvent } from '../types';

function makeEvent(overrides: Partial<NaborEvent> = {}): NaborEvent {
  return {
    id: 'ev1',
    title: 'Yoga au jardin',
    status: 'open',
    costCents: 0,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('EventCard', () => {
  it('événement passé : badge « Terminé » et pas de boutons de swipe', () => {
    renderWithProviders(<EventCard event={makeEvent({ startsAt: '2020-01-01T10:00:00Z' })} />);

    expect(screen.getByText('status.past')).toBeInTheDocument();
    expect(screen.queryByText('feed.like')).not.toBeInTheDocument();
    expect(screen.queryByText('feed.dislike')).not.toBeInTheDocument();
  });

  it('événement à venir : statut réel + boutons de swipe présents', () => {
    renderWithProviders(<EventCard event={makeEvent({ startsAt: '2999-01-01T10:00:00Z' })} />);

    expect(screen.queryByText('status.past')).not.toBeInTheDocument();
    expect(screen.getByText('feed.like')).toBeInTheDocument();
    expect(screen.getByText('feed.dislike')).toBeInTheDocument();
  });

  it('affiche la couverture quand coverMediaId existe', () => {
    const { container } = renderWithProviders(
      <EventCard event={makeEvent({ coverMediaId: 'cover' })} />,
    );
    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('pas de couverture quand coverMediaId est absent', () => {
    const { container } = renderWithProviders(<EventCard event={makeEvent()} />);
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });
});
