import { api } from '@/lib/api';

interface CheckoutSessionResponse {
  url: string;
}

export const stripeService = {
  /** Crée une session Stripe Checkout pour la transaction liée à cette annonce. */
  createCheckoutSession(listingId: string): Promise<CheckoutSessionResponse> {
    return api.post<CheckoutSessionResponse>(`/stripe/checkout/${listingId}`).then((r) => r.data);
  },
};
