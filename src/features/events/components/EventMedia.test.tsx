import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { env } from '@/lib/env';
import { EventMedia } from './EventMedia';

describe('EventMedia', () => {
  it('rend les images renvoyées par la liste des médias', async () => {
    server.use(
      http.get(`${env.apiUrl}/events/ev1/media`, () =>
        HttpResponse.json([
          { id: 'cover', order: 0, caption: null },
          { id: 'att1', order: 1, caption: null },
        ]),
      ),
    );

    const { container } = renderWithProviders(<EventMedia id="ev1" />);

    await waitFor(() => expect(container.querySelectorAll('img')).toHaveLength(2));
  });
});
