import { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Classe de largeur max de la carte (défaut `max-w-sm`) — ex. `max-w-4xl` pour un aperçu média. */
  maxWidthClass?: string;
}

// Modale simple (overlay + carte centrée). Ferme sur Échap et clic sur le fond.
export function Modal({ open, onClose, title, children, maxWidthClass = 'max-w-sm' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`w-full ${maxWidthClass} rounded-lg bg-white p-6 shadow-lg`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <h2 className="mb-4 text-lg font-bold text-navy">{title}</h2>
        {children}
      </div>
    </div>
  );
}
