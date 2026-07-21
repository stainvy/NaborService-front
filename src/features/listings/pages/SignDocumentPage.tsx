import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { SignaturePad } from '@/components/SignaturePad';
import { ConfirmTotpModal } from '@/components/ConfirmTotpModal';
import { useSignDocument } from '../hooks/useDocuments';

export function SignDocumentPage() {
  const { t } = useTranslation('listings');
  const { listingId: id = '' } = useParams();
  const navigate = useNavigate();
  const sign = useSignDocument(id);

  const [signature, setSignature] = useState('');
  const [totpOpen, setTotpOpen] = useState(false);

  const onConfirm = (code: string) => {
    sign.mutate(
      { canvas_b64: signature, totp_code: code },
      { onSuccess: () => navigate(`/listings/${id}`) },
    );
  };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-surface p-6">
      <Link to={`/listings/${id}`} className="text-sm text-orange underline">
        ← {t('detail.back')}
      </Link>
      <h1 className="my-6 text-xl font-bold text-fg">{t('sign.title')}</h1>
      <p className="mb-4 text-sm text-gray">{t('sign.hint')}</p>

      <SignaturePad onChange={setSignature} />

      <Button className="mt-6" disabled={!signature} onClick={() => setTotpOpen(true)}>
        {t('sign.submit')}
      </Button>

      <ConfirmTotpModal
        open={totpOpen}
        title={t('sign.totp_title')}
        onClose={() => setTotpOpen(false)}
        onConfirm={onConfirm}
        isPending={sign.isPending}
        isError={sign.isError}
      />
    </div>
  );
}
