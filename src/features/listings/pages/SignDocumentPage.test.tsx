import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockAuthenticated } from '@/test/fixtures';
import { env } from '@/lib/env';
import { SignDocumentPage } from './SignDocumentPage';

// Le canvas n'est pas implémenté dans jsdom → on remplace le SignaturePad par
// un stub qui pose une signature factice via un bouton.
vi.mock('@/components/SignaturePad', () => ({
  SignaturePad: ({ onChange }: { onChange: (v: string) => void }) => (
    <button type="button" onClick={() => onChange('data:image/png;base64,FAKE')}>
      set-signature
    </button>
  ),
}));

describe('SignDocumentPage — signature + TOTP', () => {
  it('POST /sign avec canvas_b64 et totp_code', async () => {
    mockAuthenticated();
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post(`${env.apiUrl}/listings/L/sign`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ok: true });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/listings/:listingId/sign" element={<SignDocumentPage />} />
        <Route path="/listings/:listingId" element={<div>DETAIL</div>} />
      </Routes>,
      { route: '/listings/L/sign' },
    );

    await user.click(await screen.findByText('set-signature'));
    await user.click(screen.getByRole('button', { name: 'sign.submit' }));

    // Modale TOTP.
    await user.type(await screen.findByLabelText('totp.code_label'), '123456');
    await user.click(screen.getByRole('button', { name: 'totp.submit' }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body).toEqual({ canvas_b64: 'data:image/png;base64,FAKE', totp_code: '123456' });
  });
});
