import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { env } from '@/lib/env';
import { NeighbourhoodPicker } from './NeighbourhoodPicker';

const NEIGHBOURHOODS = [
  { pgId: 'nb-a', name: 'Quartier A', city: 'Paris', zipCode: '75001' },
  { pgId: 'nb-b', name: 'Quartier B', city: 'Paris', zipCode: '75002' },
];

function stubGeolocation(impl: Partial<Geolocation>) {
  Object.defineProperty(global.navigator, 'geolocation', {
    value: { getCurrentPosition: vi.fn(), watchPosition: vi.fn(), clearWatch: vi.fn(), ...impl },
    configurable: true,
  });
}

afterEach(() => {
  Object.defineProperty(global.navigator, 'geolocation', { value: undefined, configurable: true });
});

describe('NeighbourhoodPicker', () => {
  it('propose le quartier proche comme recommandation et permet d’en choisir un autre', async () => {
    stubGeolocation({
      getCurrentPosition: (success) =>
        success({ coords: { latitude: 48.85, longitude: 2.35 } } as GeolocationPosition),
    });
    server.use(
      http.get(`${env.apiUrl}/neighbourhoods/nearby`, () => HttpResponse.json([NEIGHBOURHOODS[0]])),
      http.get(`${env.apiUrl}/neighbourhoods`, () => HttpResponse.json(NEIGHBOURHOODS)),
    );

    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<NeighbourhoodPicker value={undefined} onChange={onChange} />);

    // Voie 1 : autolocalisation → recommandation « Utiliser »
    await user.click(screen.getByRole('button', { name: 'neighbourhood.use_location' }));
    const useBtn = await screen.findByRole('button', { name: 'neighbourhood.use' });
    await user.click(useBtn);
    expect(onChange).toHaveBeenCalledWith('nb-a');

    // Voie 3 : l’habitant reste libre de choisir un autre quartier dans la liste
    const select = await screen.findByRole('combobox');
    await user.selectOptions(select, 'nb-b');
    expect(onChange).toHaveBeenCalledWith('nb-b');
  });

  it('géolocalisation réussie mais aucun quartier proche : message dédié (pas de silence)', async () => {
    stubGeolocation({
      getCurrentPosition: (success) =>
        success({ coords: { latitude: 48.85, longitude: 2.35 } } as GeolocationPosition),
    });
    server.use(
      http.get(`${env.apiUrl}/neighbourhoods/nearby`, () => HttpResponse.json([])),
      http.get(`${env.apiUrl}/neighbourhoods`, () => HttpResponse.json(NEIGHBOURHOODS)),
    );

    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<NeighbourhoodPicker value={undefined} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'neighbourhood.use_location' }));
    expect(await screen.findByText('neighbourhood.geo_no_match')).toBeInTheDocument();
  });

  it('résolution d’adresse (BAN) : l’API ne renvoie qu’un id, la recommandation doit quand même s’afficher', async () => {
    server.use(
      http.get(`${env.apiUrl}/neighbourhoods`, () => HttpResponse.json(NEIGHBOURHOODS)),
      http.get(`${env.apiUrl}/geo/autocomplete`, () =>
        HttpResponse.json([{ label: '1 Rue des Noyers 91220 Brétigny-sur-Orge', latitude: 48.6, longitude: 2.3 }]),
      ),
      http.get(`${env.apiUrl}/geo/resolve-neighbourhood`, () =>
        HttpResponse.json({ neighbourhoodId: 'nb-a', method: 'nearest-centroid' }),
      ),
    );

    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<NeighbourhoodPicker value={undefined} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText('neighbourhood.address_placeholder'), '1 Rue des Noyers');
    const suggestion = await screen.findByText('1 Rue des Noyers 91220 Brétigny-sur-Orge');
    await user.click(suggestion);

    const useBtn = await screen.findByRole('button', { name: 'neighbourhood.use' });
    expect(useBtn).toBeInTheDocument();
    await user.click(useBtn);
    expect(onChange).toHaveBeenCalledWith('nb-a');
  });

  it('géolocalisation refusée : message d’erreur et repli sur la liste manuelle', async () => {
    stubGeolocation({
      getCurrentPosition: (_success, error) =>
        error?.({
          code: 1,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
          message: 'denied',
        } as GeolocationPositionError),
    });
    server.use(
      http.get(`${env.apiUrl}/neighbourhoods`, () => HttpResponse.json(NEIGHBOURHOODS)),
    );

    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<NeighbourhoodPicker value={undefined} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'neighbourhood.use_location' }));
    expect(await screen.findByText('neighbourhood.geo_denied')).toBeInTheDocument();

    // Repli : la liste manuelle reste utilisable
    const select = await screen.findByRole('combobox');
    await user.selectOptions(select, 'nb-a');
    expect(onChange).toHaveBeenCalledWith('nb-a');
  });
});
