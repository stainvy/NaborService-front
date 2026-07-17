import { api } from '@/lib/api';

// Solde, historique et recharge (topup Stripe) du portefeuille de points.
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
  | 'adjustment';

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
};
