import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { NeighbourhoodPicker } from '@/components/NeighbourhoodPicker';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  useUploadAvatar,
  useDeleteAvatar,
  useUploadBanner,
  useDeleteBanner,
} from '../hooks/useMedia';
import { useUpdateProfile } from '../hooks/useProfile';
import { VISIBILITIES, MESSAGE_POLICIES, type Visibility, type MessagePolicy } from '../types';

const AVATAR_MAX = 2 * 1024 * 1024;
const BANNER_MAX = 4 * 1024 * 1024;

interface EditForm {
  firstName: string;
  lastName: string;
  bio: string;
  visibility: Visibility;
  messagePolicy: MessagePolicy;
}

export function ProfileEditPage() {
  const { t } = useTranslation('profile');
  const navigate = useNavigate();
  const { user } = useAuth();

  const queryClient = useQueryClient();
  const update = useUpdateProfile();
  const saveNeighbourhood = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const uploadBanner = useUploadBanner();
  const deleteBanner = useDeleteBanner();

  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Quartier — état local piloté par le NeighbourhoodPicker, resynchronisé
  // quand le profil se charge.
  const [neighbourhoodId, setNeighbourhoodId] = useState<string | undefined>(
    user?.neighbourhoodId ?? undefined,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  useEffect(() => {
    setNeighbourhoodId(user?.neighbourhoodId ?? undefined);
  }, [user?.neighbourhoodId]);

  // Sans ça, le message d'erreur reste affiché indéfiniment tant que
  // l'utilisateur ne retente pas une sélection de fichier.
  useEffect(() => {
    if (!fileError) return;
    const timer = setTimeout(() => setFileError(null), 5000);
    return () => clearTimeout(timer);
  }, [fileError]);

  // `values` (et non `defaultValues`) : le formulaire se (re)remplit dès que le
  // profil est chargé, même s'il était null au premier rendu.
  const { register, handleSubmit } = useForm<EditForm>({
    values: user
      ? {
          firstName: user.firstName,
          lastName: user.lastName,
          bio: user.bio ?? '',
          visibility: (user.visibility as Visibility) ?? 'public',
          messagePolicy: (user.messagePolicy as MessagePolicy) ?? 'open',
        }
      : undefined,
  });

  if (!user) return null;

  const onPickFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    max: number,
    upload: (file: File) => void,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de re-sélectionner le même fichier
    if (!file) return;
    if (file.size > max) {
      setFileError(t('profile.file_too_large', { max: `${Math.round(max / 1024 / 1024)} MB` }));
      return;
    }
    setFileError(null);
    upload(file);
  };

  const onSubmit = handleSubmit((values) => {
    update.mutate(values, { onSuccess: () => navigate('/profile') });
  });

  const persistNeighbourhood = () => {
    saveNeighbourhood.mutate(
      { neighbourhoodId: neighbourhoodId ?? null },
      {
        onSuccess: () => {
          // Les fils d'annonces et d'événements dépendent du quartier de l'habitant.
          queryClient.invalidateQueries({ queryKey: ['listings'] });
          queryClient.invalidateQueries({ queryKey: ['events'] });
          setConfirmOpen(false);
        },
      },
    );
  };

  const onSaveNeighbourhood = () => {
    const previous = user.neighbourhoodId ?? null;
    const target = neighbourhoodId ?? null;
    if (previous === target) return;
    // Confirmer seulement le CHANGEMENT d'un quartier déjà défini (le groupe
    // de discussion du quartier sera mis à jour).
    if (previous !== null) setConfirmOpen(true);
    else persistNeighbourhood();
  };

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-white p-6">
      <h1 className="mb-6 text-xl font-bold text-navy">{t('profile.edit')}</h1>

      {/* Médias */}
      <section className="mb-8 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Avatar
            mongoId={user.profilePictureMongoId}
            firstName={user.firstName}
            lastName={user.lastName}
            size={64}
          />
          <div className="flex gap-2">
            <input
              ref={avatarInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickFile(e, AVATAR_MAX, uploadAvatar.mutate)}
            />
            <Button type="button" onClick={() => avatarInput.current?.click()}>
              {t('profile.avatar')} · {t('profile.upload')}
            </Button>
            {user.profilePictureMongoId && (
              <Button type="button" variant="secondary" onClick={() => deleteAvatar.mutate()}>
                {t('profile.remove')}
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <input
            ref={bannerInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickFile(e, BANNER_MAX, uploadBanner.mutate)}
          />
          <Button type="button" onClick={() => bannerInput.current?.click()}>
            {t('profile.banner')} · {t('profile.upload')}
          </Button>
          {user.bannerMongoId && (
            <Button type="button" variant="secondary" onClick={() => deleteBanner.mutate()}>
              {t('profile.remove')}
            </Button>
          )}
        </div>
        {fileError && <p className="text-sm text-error">{fileError}</p>}
      </section>

      {/* Champs texte */}
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField label={t('profile.first_name')} {...register('firstName')} />
        <TextField label={t('profile.last_name')} {...register('lastName')} />

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-navy">{t('profile.bio')}</span>
          <textarea
            {...register('bio')}
            rows={4}
            className="rounded-md border border-gray px-3 py-2 focus:border-navy focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-navy">{t('profile.visibility')}</span>
          <select {...register('visibility')} className="rounded-md border border-gray px-3 py-2">
            {VISIBILITIES.map((v) => (
              <option key={v} value={v}>
                {t(`profile.visibility_${v}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-navy">{t('profile.message_policy')}</span>
          <select
            {...register('messagePolicy')}
            className="rounded-md border border-gray px-3 py-2"
          >
            {MESSAGE_POLICIES.map((m) => (
              <option key={m} value={m}>
                {t(`profile.message_${m}`)}
              </option>
            ))}
          </select>
        </label>

        {update.isError && <p className="text-sm text-error">{t('profile.error')}</p>}
        {update.isSuccess && <p className="text-sm text-success">{t('profile.saved')}</p>}

        <Button type="submit" disabled={update.isPending}>
          {t('profile.save')}
        </Button>
      </form>

      {/* Mon quartier */}
      <section className="mt-10">
        <h2 className="mb-3 font-semibold text-navy">{t('neighbourhood.section_title')}</h2>
        <NeighbourhoodPicker value={neighbourhoodId} onChange={setNeighbourhoodId} />

        {saveNeighbourhood.isError && (
          <p className="mt-2 text-sm text-error">{t('profile.error')}</p>
        )}
        {saveNeighbourhood.isSuccess && (
          <p className="mt-2 text-sm text-success">{t('profile.saved')}</p>
        )}

        <Button
          type="button"
          className="mt-4"
          onClick={onSaveNeighbourhood}
          disabled={saveNeighbourhood.isPending || (user.neighbourhoodId ?? null) === (neighbourhoodId ?? null)}
        >
          {t('neighbourhood.save')}
        </Button>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title={t('neighbourhood.confirm_title')}
        message={t('neighbourhood.confirm_message')}
        confirmLabel={t('neighbourhood.confirm')}
        cancelLabel={t('profile.cancel')}
        loading={saveNeighbourhood.isPending}
        onConfirm={persistNeighbourhood}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
