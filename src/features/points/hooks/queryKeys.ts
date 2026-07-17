export const pointsKeys = {
  balance: ['points', 'balance'] as const,
  ledger: (offset: number, limit: number) => ['points', 'ledger', offset, limit] as const,
};
