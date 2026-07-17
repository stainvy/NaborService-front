import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { usePointsBalance, usePointsLedger, useCreateTopup } from '../hooks/usePoints';

const MIN_TOPUP_EUROS = 1;

/** Solde de points + recharge Stripe : la page sur laquelle Stripe redirige après le checkout (?topup=success|cancel). */
export function PointsPage() {
  const { t } = useTranslation('points');
  const [searchParams] = useSearchParams();
  const topup = searchParams.get('topup');

  const balance = usePointsBalance();
  const ledger = usePointsLedger(0, 20);
  const createTopup = useCreateTopup();
  const [amountEuros, setAmountEuros] = useState(MIN_TOPUP_EUROS * 10);

  const amountCents = Math.round(amountEuros * 100);

  const handleTopup = async () => {
    try {
      const { url } = await createTopup.mutateAsync(amountCents);
      window.location.href = url;
    } catch {
      // état d'erreur géré via createTopup.isError
    }
  };

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="text-xl font-bold text-navy">{t('title')}</h1>

      {topup === 'success' && (
        <p className="mt-4 rounded-md bg-green-100 p-3 text-sm text-success">
          {t('topup.success')}
        </p>
      )}
      {topup === 'cancel' && (
        <p className="mt-4 rounded-md bg-red-100 p-3 text-sm text-error">{t('topup.cancel')}</p>
      )}

      <p className="mt-4 text-2xl font-bold text-navy">
        {t('balance', { points: balance.data?.pointsBalance ?? '…' })}
      </p>

      <section className="mt-6 rounded-md border border-gray/30 p-4">
        <h2 className="text-sm font-semibold text-navy">{t('topup.title')}</h2>
        <label className="mt-2 flex flex-col gap-1">
          <span className="text-sm text-gray">{t('topup.amount_label')}</span>
          <input
            type="number"
            min={MIN_TOPUP_EUROS}
            step={1}
            value={amountEuros}
            onChange={(e) => setAmountEuros(Number(e.target.value))}
            className="rounded-md border border-gray px-3 py-2 focus:border-navy focus:outline-none"
          />
        </label>
        <p className="mt-1 text-xs text-gray">{t('topup.estimate', { points: amountCents })}</p>
        <Button
          className="mt-3"
          onClick={() => void handleTopup()}
          disabled={createTopup.isPending || amountEuros < MIN_TOPUP_EUROS}
        >
          {createTopup.isPending ? t('topup.loading') : t('topup.submit')}
        </Button>
        {createTopup.isError && <p className="mt-1 text-sm text-error">{t('topup.error')}</p>}
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-navy">{t('history.title')}</h2>
        {ledger.data?.data.length === 0 && (
          <p className="mt-1 text-sm text-gray">{t('history.empty')}</p>
        )}
        <ul className="mt-2 divide-y divide-gray/20">
          {ledger.data?.data.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="text-navy">{t(`history.types.${entry.type}`)}</p>
                <p className="text-xs text-gray">{new Date(entry.createdAt).toLocaleString()}</p>
              </div>
              <span className={entry.amountPoints >= 0 ? 'text-success' : 'text-error'}>
                {entry.amountPoints >= 0 ? '+' : ''}
                {entry.amountPoints}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
