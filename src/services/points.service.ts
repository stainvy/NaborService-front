import { api } from '@/lib/api';

// Solde, historique, recharge (topup Stripe) et retrait (cashout Stripe
// Connect) du portefeuille de points.
export interface PointsBalance {
  pointsBalance: number;
}

export type PointsLedgerEntryType =
  | 'topup'
  | 'listing_hold'
  | 'listing_payout'
  | 'listing_refund'
  | 'listing_commission'
  | 'event_hold'
  | 'event_payout'
  | 'event_refund'
  | 'event_commission'
  | 'event_reward'
  | 'adjustment'
  | 'admin_adjustment'
  | 'cashout'
  | 'cashout_reversed';

export interface PointsLedgerEntry {
  id: string;
  userId: string | null;
  type: PointsLedgerEntryType;
  amountPoints: number;
  balanceAfterPoints: number | null;
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

export interface PointsLedgerPage {
  data: PointsLedgerEntry[];
  meta: { total: number; offset: number; limit: number };
}

export interface TopupSession {
  url: string;
  topupId: string;
}

export interface ConnectStatus {
  hasAccount: boolean;
  payoutsEnabled: boolean;
}

export interface OnboardingLink {
  url: string;
}

export type PointsCashoutStatus = 'pending' | 'completed' | 'failed';

export interface PointsCashout {
  id: string;
  userId: string;
  amountPoints: number;
  amountCents: number;
  centsPerPoint: number;
  status: PointsCashoutStatus;
  stripeTransferId: string | null;
  failureReason: string | null;
  createdAt: string;
  completedAt: string | null;
  failedAt: string | null;
}

export const pointsService = {
  getBalance(): Promise<PointsBalance> {
    return api.get<PointsBalance>('/points/balance').then((r) => r.data);
  },

  /** Historique paginé du solde (recharges, paiements, remboursements...). */
  getLedger(offset = 0, limit = 20): Promise<PointsLedgerPage> {
    return api
      .get<PointsLedgerPage>('/points/ledger', { params: { offset, limit } })
      .then((r) => r.data);
  },

  /** Démarre une recharge : crée une session Stripe Checkout pour `amountCents`. */
  createTopup(amountCents: number): Promise<TopupSession> {
    return api.post<TopupSession>('/points/topup', { amountCents }).then((r) => r.data);
  },

  /** Éligibilité au retrait (onboarding Stripe Connect terminé ou non). */
  getConnectStatus(): Promise<ConnectStatus> {
    return api.get<ConnectStatus>('/points/connect/status').then((r) => r.data);
  },

  /** Crée le compte connecté si besoin, renvoie le lien d'onboarding Stripe. */
  createOnboardingLink(): Promise<OnboardingLink> {
    return api.post<OnboardingLink>('/points/connect/onboard').then((r) => r.data);
  },

  /** Convertit `amountPoints` en virement bancaire réel (Stripe Connect). */
  createCashout(amountPoints: number): Promise<PointsCashout> {
    return api.post<PointsCashout>('/points/cashout', { amountPoints }).then((r) => r.data);
  },
};
