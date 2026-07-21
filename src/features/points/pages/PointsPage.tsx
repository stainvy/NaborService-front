import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import {
  usePointsBalance,
  usePointsLedger,
  useCreateTopup,
  useConnectStatus,
  useCreateOnboardingLink,
  useCreateCashout,
} from '../hooks/usePoints';

const MIN_TOPUP_EUROS = 1;
const MIN_CASHOUT_POINTS = 1;

type Mode = 'topup' | 'cashout';

/** Solde de points + recharge/retrait Stripe : la page sur laquelle Stripe
 * redirige après le checkout (?topup=success|cancel) et après l'onboarding
 * Connect (?connect=return|refresh). */
export function PointsPage() {
  const { t } = useTranslation('points');
  const [searchParams] = useSearchParams();
  const topup = searchParams.get('topup');
  const connect = searchParams.get('connect');

  const [mode, setMode] = useState<Mode>('topup');

  const balance = usePointsBalance();
  const ledger = usePointsLedger(0, 20);

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="text-xl font-bold text-fg">{t('title')}</h1>

      {topup === 'success' && (
        <p className="mt-4 rounded-md bg-green-100 p-3 text-sm text-success">
          {t('topup.success')}
        </p>
      )}
      {topup === 'cancel' && (
        <p className="mt-4 rounded-md bg-red-100 p-3 text-sm text-error">{t('topup.cancel')}</p>
      )}
      {connect === 'return' && (
        <p className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
          {t('cashout.connect_return')}
        </p>
      )}
      {connect === 'refresh' && (
        <p className="mt-4 rounded-md bg-red-100 p-3 text-sm text-error">
          {t('cashout.connect_refresh')}
        </p>
      )}

      <p className="mt-4 text-2xl font-bold text-fg">
        {t('balance', { points: balance.data?.pointsBalance ?? '…' })}
      </p>

      {/* Sélecteur recharge/retrait — styles volontairement différents
          (orange = recharge/argent entrant, bleu = retrait/argent sortant)
          pour qu'on ne confonde jamais les deux opérations. */}
      <div className="mt-6 flex overflow-hidden rounded-md border border-gray/30">
        <button
          type="button"
          onClick={() => setMode('topup')}
          className={`flex-1 px-4 py-2 text-sm font-semibold transition-colors ${
            mode === 'topup' ? 'bg-orange text-white' : 'bg-surface text-gray hover:bg-gray/10'
          }`}
        >
          {t('mode.topup')}
        </button>
        <button
          type="button"
          onClick={() => setMode('cashout')}
          className={`flex-1 px-4 py-2 text-sm font-semibold transition-colors ${
            mode === 'cashout' ? 'bg-blue-600 text-white' : 'bg-surface text-gray hover:bg-gray/10'
          }`}
        >
          {t('mode.cashout')}
        </button>
      </div>

      {mode === 'topup' ? <TopupPanel /> : <CashoutPanel currentBalance={balance.data?.pointsBalance} />}

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-fg">{t('history.title')}</h2>
        {ledger.data?.data.length === 0 && (
          <p className="mt-1 text-sm text-gray">{t('history.empty')}</p>
        )}
        <ul className="mt-2 divide-y divide-gray/20">
          {ledger.data?.data.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="text-fg">{t(`history.types.${entry.type}`)}</p>
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

// Recharge (orange, argent entrant) : montant en € -> session Stripe Checkout.
function TopupPanel() {
  const { t } = useTranslation('points');
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
    <section className="mt-4 rounded-md border border-orange/30 bg-orange/5 p-4">
      <h2 className="text-sm font-semibold text-fg">{t('topup.title')}</h2>
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
  );
}

// Retrait (bleu, argent sortant) : onboarding Stripe Connect requis une
// première fois, puis conversion de points en virement bancaire réel.
function CashoutPanel({ currentBalance }: { currentBalance: number | undefined }) {
  const { t } = useTranslation('points');
  const connectStatus = useConnectStatus();
  const createOnboardingLink = useCreateOnboardingLink();
  const createCashout = useCreateCashout();
  const [amountPoints, setAmountPoints] = useState(MIN_CASHOUT_POINTS * 100);

  const handleOnboard = async () => {
    try {
      const { url } = await createOnboardingLink.mutateAsync();
      window.location.href = url;
    } catch {
      // état d'erreur géré via createOnboardingLink.isError
    }
  };

  const insufficientBalance =
    currentBalance !== undefined && amountPoints > currentBalance;

  return (
    <section className="mt-4 rounded-md border border-blue-600/30 bg-blue-50 p-4">
      <h2 className="text-sm font-semibold text-fg">{t('cashout.title')}</h2>

      {connectStatus.isLoading && <p className="mt-2 text-sm text-gray">{t('cashout.loading_status')}</p>}

      {!connectStatus.isLoading && !connectStatus.data?.payoutsEnabled && (
        <>
          <p className="mt-2 text-sm text-gray">{t('cashout.setup_required')}</p>
          <button
            type="button"
            onClick={() => void handleOnboard()}
            disabled={createOnboardingLink.isPending}
            className="mt-3 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createOnboardingLink.isPending ? t('cashout.loading') : t('cashout.setup_button')}
          </button>
          {createOnboardingLink.isError && (
            <p className="mt-1 text-sm text-error">{t('cashout.setup_error')}</p>
          )}
        </>
      )}

      {!connectStatus.isLoading && connectStatus.data?.payoutsEnabled && (
        <>
          <label className="mt-2 flex flex-col gap-1">
            <span className="text-sm text-gray">{t('cashout.amount_label')}</span>
            <input
              type="number"
              min={MIN_CASHOUT_POINTS}
              step={1}
              value={amountPoints}
              onChange={(e) => setAmountPoints(Number(e.target.value))}
              className="rounded-md border border-gray px-3 py-2 focus:border-navy focus:outline-none"
            />
          </label>
          <p className="mt-1 text-xs text-gray">
            {t('cashout.estimate', { amount: (amountPoints / 100).toFixed(2) })}
          </p>
          <button
            type="button"
            onClick={() => createCashout.mutate(amountPoints)}
            disabled={createCashout.isPending || amountPoints < MIN_CASHOUT_POINTS || insufficientBalance}
            className="mt-3 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createCashout.isPending ? t('cashout.loading') : t('cashout.submit')}
          </button>
          {insufficientBalance && (
            <p className="mt-1 text-sm text-error">{t('cashout.insufficient')}</p>
          )}
          {createCashout.isError && <p className="mt-1 text-sm text-error">{t('cashout.error')}</p>}
          {createCashout.isSuccess && (
            <p className="mt-1 text-sm text-success">{t('cashout.success')}</p>
          )}
        </>
      )}
    </section>
  );
}
