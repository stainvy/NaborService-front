import { api } from '@/lib/api';

// Solde de points de l'utilisateur. La recharge (topup via Stripe) reste gérée
// par le module Paiement ; ici on ne lit que le solde nécessaire au paiement
// d'une annonce en points.
export interface PointsBalance {
  pointsBalance: number;
}

export const pointsService = {
  getBalance(): Promise<PointsBalance> {
    return api.get<PointsBalance>('/points/balance').then((r) => r.data);
  },
};
