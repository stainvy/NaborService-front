import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChatGroup, useGroupMembers } from '../hooks/useChatGroups';
import { ConversationsSidebar } from '../components/ConversationsSidebar';
import { ConversationThread } from '../components/ConversationThread';
import { ConversationInfoPanel } from '../components/ConversationInfoPanel';

// Page Messagerie unifiée (mockup Messagerie.dc.html) : conversations à
// gauche, fil de discussion/Sondages au centre, infos/réglages à droite.
// Remplace ChatListPage + ThreadPage — /chat et /chat/:groupId partagent
// cette même page, seul le panneau central change selon la présence du param.
//
// Responsive : sur mobile une seule colonne à la fois — /chat montre la liste
// en pleine largeur, /chat/:groupId le fil (avec retour vers la liste dans son
// en-tête), et le panneau d'infos s'ouvre en surimpression. Sur ≥ md, les trois
// colonnes cohabitent comme sur le mockup.
export function MessagingPage() {
  const { t } = useTranslation('messages');
  const { user } = useAuth();
  const { groupId } = useParams<{ groupId: string }>();
  const { data: group } = useChatGroup(groupId);
  const { data: members } = useGroupMembers(groupId);
  // Panneau d'infos ouvert par défaut sur desktop (3 colonnes), fermé sur
  // mobile où il s'affiche en surimpression au-dessus du fil.
  const [panelOpen, setPanelOpen] = useState(
    () => typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches,
  );
  const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(null);

  const myRole = group?.my_role ?? members?.find((m) => m.user_id === user?.id)?.role;
  const hasActiveThread = Boolean(groupId && group);

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Liste des conversations : pleine largeur sur mobile tant qu'aucune
            conversation n'est ouverte ; colonne fixe (masquée si on lit un fil
            sur mobile) sur desktop. */}
        <div className={`${hasActiveThread ? 'hidden md:flex' : 'flex'} w-full flex-shrink-0 md:w-80`}>
          <ConversationsSidebar activeGroupId={groupId} />
        </div>

        {hasActiveThread && group ? (
          <>
            <ConversationThread
              groupId={groupId!}
              panelOpen={panelOpen}
              onTogglePanel={() => setPanelOpen((v) => !v)}
              scrollToMessageId={scrollToMessageId}
              onScrolledToMessage={() => setScrollToMessageId(null)}
            />
            {panelOpen && (
              <>
                {/* Fond cliquable pour fermer le panneau en surimpression (mobile). */}
                <button
                  type="button"
                  aria-label={t('chat.close')}
                  onClick={() => setPanelOpen(false)}
                  className="fixed inset-0 z-30 bg-navy/40 md:hidden"
                />
                <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-shrink-0 md:static md:z-auto md:w-80 md:max-w-none">
                  <ConversationInfoPanel
                    group={group}
                    members={members}
                    myRole={myRole}
                    onJumpToMessage={(id) => {
                      setScrollToMessageId(id);
                      // Sur mobile le panneau couvre le fil : le refermer pour
                      // laisser voir le message ciblé.
                      if (!window.matchMedia('(min-width: 768px)').matches) setPanelOpen(false);
                    }}
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <div className="hidden flex-1 flex-col items-center justify-center gap-2 bg-surface text-gray md:flex">
            <MessageSquare className="h-10 w-10 opacity-40" />
            <p className="text-sm">{t('chat.select_conversation')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
