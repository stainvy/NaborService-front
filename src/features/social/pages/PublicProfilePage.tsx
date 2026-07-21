import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { FullPageLoader } from '@/components/FullPageLoader';
import { mediaUrl } from '@/lib/media';
import { usePublicProfile } from '../hooks/usePublicProfile';
import { useFollow, useUnfollow } from '../hooks/useFollow';
import { useBlock, useUnblock } from '../hooks/useBlock';
import { useReportUser } from '../hooks/useReportUser';
import { useStartDirectChat } from '@/features/chat/hooks/useStartDirectChat';
import { isFullProfile } from '../types';

export function PublicProfilePage() {
  const { t, i18n } = useTranslation('profile');
  const { t: tMessages } = useTranslation('messages');
  const { id = '' } = useParams();
  const { user } = useAuth();

  const { data: profile, isLoading } = usePublicProfile(id);
  const follow = useFollow();
  const unfollow = useUnfollow();
  const block = useBlock();
  const unblock = useUnblock();
  const report = useReportUser(id);
  const startDirectChat = useStartDirectChat();

  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');

  // Hooks d'abord, branchements ensuite : on ne redirige qu'après leur appel.
  useEffect(() => {
    if (report.isSuccess) setReportOpen(false);
  }, [report.isSuccess]);

  // Son propre profil → page profil dédiée.
  if (user && id === user.id) return <Navigate to="/profile" replace />;
  if (isLoading || !profile) return <FullPageLoader />;

  const full = isFullProfile(profile);
  const bannerUrl = full ? mediaUrl(profile.bannerMongoId) : null;

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-surface">
      <div
        className="h-40 w-full bg-navy/10"
        style={
          bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover' } : undefined
        }
      />
      <div className="px-6">
        <div className="-mt-10 flex items-end gap-4">
          <div className="rounded-full ring-4 ring-white">
            <Avatar
              mongoId={full ? profile.profilePictureMongoId : null}
              firstName={profile.firstName}
              lastName={profile.lastName}
              size={80}
            />
          </div>
          <h1 className="pb-2 text-xl font-bold text-fg">
            {profile.firstName} {profile.lastName}
          </h1>
        </div>

        {full ? (
          <section className="mt-6">
            <p className="whitespace-pre-line text-gray">{profile.bio || t('profile.no_bio')}</p>
            {profile.createdAt && (
              <p className="mt-2 text-sm text-gray">
                {t('social.member_since', {
                  date: new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                    dateStyle: 'medium',
                  }).format(new Date(profile.createdAt)),
                })}
              </p>
            )}
          </section>
        ) : (
          <p className="mt-6 rounded-md bg-gray/10 p-4 text-sm text-gray">
            {t('social.restricted')}
          </p>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => startDirectChat.start(id, profile.firstName)}
            disabled={startDirectChat.isPending}
          >
            {startDirectChat.isPending ? tMessages('chat.starting_conversation') : tMessages('chat.start_direct_message')}
          </Button>
          {profile.isFollowing ? (
            <Button
              variant="secondary"
              onClick={() => unfollow.mutate(id)}
              disabled={unfollow.isPending}
            >
              {t('social.unfollow')}
            </Button>
          ) : (
            <Button onClick={() => follow.mutate(id)} disabled={follow.isPending}>
              {t('social.follow')}
            </Button>
          )}
          {profile.isBlockedByMe ? (
            <Button
              variant="secondary"
              onClick={() => unblock.mutate(id)}
              disabled={unblock.isPending}
            >
              {t('social.unblock')}
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => block.mutate(id)}
              disabled={block.isPending}
            >
              {t('social.block')}
            </Button>
          )}
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="rounded-md px-4 py-2 text-sm font-semibold text-error underline"
          >
            {t('social.report')}
          </button>
        </div>
      </div>

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={t('social.report_title')}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            report.mutate({ reason });
          }}
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-fg">{t('social.report_reason')}</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
              className="rounded-md border border-gray px-3 py-2 focus:border-navy focus:outline-none"
            />
          </label>
          {report.isSuccess && <p className="text-sm text-success">{t('social.reported')}</p>}
          <Button type="submit" disabled={report.isPending || reason.trim().length === 0}>
            {t('social.report_submit')}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
