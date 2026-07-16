import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import { Toggle } from '@/components/Toggle';
import { useCreatePoll } from '../hooks/usePolls';
import { pollsService } from '@/services/polls.service';
import type { PollSelectionType } from '@/types/polls';

const SELECTION_TYPES: PollSelectionType[] = ['single', 'multiple'];
const DEFAULT_WEIGHT = '1';

interface CreatePollModalProps {
  open: boolean;
  onClose: () => void;
  neighbourhoodId?: string | null;
  /** Sondage créé depuis une conversation de groupe plutôt que pour un quartier. */
  groupId?: string | null;
}

export function CreatePollModal({ open, onClose, neighbourhoodId, groupId }: CreatePollModalProps) {
  const { t } = useTranslation('polls');
  const queryClient = useQueryClient();
  const createPoll = useCreatePoll();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectionType, setSelectionType] = useState<PollSelectionType>('single');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isWeighted, setIsWeighted] = useState(false);
  const [endsAt, setEndsAt] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [weights, setWeights] = useState([DEFAULT_WEIGHT, DEFAULT_WEIGHT]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validOptions = options
    .map((label, i) => ({ label: label.trim(), weight: Number(weights[i]) || 1 }))
    .filter((o) => o.label);

  function reset() {
    setTitle('');
    setDescription('');
    setSelectionType('single');
    setIsAnonymous(false);
    setIsWeighted(false);
    setEndsAt('');
    setOptions(['', '']);
    setWeights([DEFAULT_WEIGHT, DEFAULT_WEIGHT]);
    setError(null);
  }

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function updateWeight(index: number, value: string) {
    setWeights((prev) => prev.map((w, i) => (i === index ? value : w)));
  }

  function addOptionRow() {
    setOptions((prev) => [...prev, '']);
    setWeights((prev) => [...prev, DEFAULT_WEIGHT]);
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
    setWeights((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || validOptions.length < 2) return;
    setSubmitting(true);
    setError(null);
    try {
      const poll = await createPoll.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        poll_type: selectionType,
        neighbourhood_id: groupId ? undefined : (neighbourhoodId ?? undefined),
        group_id: groupId ?? undefined,
        ends_at: endsAt ? new Date(endsAt).toISOString() : undefined,
        is_anonymous: isAnonymous,
        is_weighted: isWeighted,
      });
      await Promise.all(
        validOptions.map((o) =>
          pollsService.addOption(poll.id, o.label, isWeighted ? o.weight : undefined),
        ),
      );
      // On reste sur place (plus de page de détail à part) : le sondage doit
      // apparaître complet (avec ses options) dès la fermeture de la modale,
      // pas seulement au prochain montage — d'où une invalidation explicite
      // après l'ajout des options, en plus de celle déjà déclenchée par
      // useCreatePoll juste après la création (qui, elle, arrive trop tôt).
      await queryClient.invalidateQueries({ queryKey: ['polls', 'list'] });
      reset();
      onClose();
    } catch {
      setError(t('create_failed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={t('create_poll')}>
      <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
        <TextField label={t('field_title')} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
        <TextField label={t('description')} value={description} onChange={(e) => setDescription(e.target.value)} />

        <div>
          <p className="mb-1 text-sm font-medium text-navy">{t('poll_type')}</p>
          <div className="flex gap-3">
            {SELECTION_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-1 text-sm text-navy">
                <input type="radio" name="poll_type" checked={selectionType === type} onChange={() => setSelectionType(type)} />
                {t(`poll_type_${type}`)}
              </label>
            ))}
          </div>
        </div>

        <Toggle checked={isWeighted} onChange={setIsWeighted} label={t('is_weighted')} />

        <div>
          <p className="mb-1 text-sm font-medium text-navy">{t('options')}</p>
          <div className="flex flex-col gap-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={t('option_placeholder', { index: index + 1 })}
                  maxLength={100}
                  className="flex-1 rounded-md border border-gray px-3 py-2 text-sm outline-none focus:border-navy"
                />
                {isWeighted && (
                  <input
                    value={weights[index]}
                    onChange={(e) => updateWeight(index, e.target.value)}
                    type="number"
                    min="0.5"
                    step="0.5"
                    aria-label={t('option_weight_label')}
                    className="w-16 rounded-md border border-gray px-2 py-2 text-sm outline-none focus:border-navy"
                  />
                )}
                {options.length > 2 && (
                  <button type="button" onClick={() => removeOption(index)} aria-label={t('remove_option')}>
                    <X className="h-4 w-4 text-gray" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addOptionRow} className="mt-2 text-xs font-medium text-orange">
            + {t('add_option')}
          </button>
        </div>

        <TextField
          label={t('ends_at')}
          type="datetime-local"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
        />

        <Toggle checked={isAnonymous} onChange={setIsAnonymous} label={t('is_anonymous')} />

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => { reset(); onClose(); }}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={!title.trim() || validOptions.length < 2 || submitting}>
            {submitting ? '…' : t('create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
