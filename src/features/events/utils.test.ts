import { describe, it, expect } from 'vitest';
import { isPastEvent } from './utils';

describe('isPastEvent', () => {
  it('vrai si endsAt est passé', () => {
    expect(isPastEvent({ startsAt: '2999-01-01T00:00:00Z', endsAt: '2020-01-01T00:00:00Z' })).toBe(
      true,
    );
  });

  it('vrai si startsAt passé et pas de endsAt', () => {
    expect(isPastEvent({ startsAt: '2020-01-01T00:00:00Z' })).toBe(true);
  });

  it('faux si à venir', () => {
    expect(isPastEvent({ startsAt: '2999-01-01T00:00:00Z' })).toBe(false);
  });

  it('faux sans date', () => {
    expect(isPastEvent({})).toBe(false);
  });
});
