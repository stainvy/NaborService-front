import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  tone?: 'brand' | 'admin';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  destructive = false,
  loading = false,
  tone = 'brand',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="mb-5 text-sm text-gray">{message}</p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" tone={tone} onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant="primary"
          tone={tone}
          onClick={onConfirm}
          disabled={loading}
          className={destructive ? '!bg-error hover:!opacity-90' : ''}
        >
          {loading ? '…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
