import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowLeft, BarChart3, Info, Phone, Video } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { useCall } from '@/features/calls/callContext';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import type { ChatMessage } from '@/types/chat';
import { useChatGroup, useGroupMembers } from '../hooks/useChatGroups';
import { useMessages, useJumpToMessage, useReturnToLiveMessages } from '../hooks/useMessages';
import { useChatSocket } from '../hooks/useChatSocket';
import { useSendMessage } from '../hooks/useSendMessage';
import { useSendAttachment } from '../hooks/useSendAttachment';
import { useTyping } from '../hooks/useTyping';
import { useMarkGroupRead } from '../hooks/useMarkGroupRead';
import { usePresence } from '../hooks/usePresence';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { GroupPollsTab } from './GroupPollsTab';
import { PinnedMessagesBar } from './PinnedMessagesBar';
import { CreatePollModal } from '@/features/polls/components/CreatePollModal';
import { canCreatePoll } from '@/features/polls/utils';
import { getGroupAvatarProps, getGroupDisplayName } from '../utils';

type Tab = 'discussion' | 'sondages';

interface ConversationThreadProps {
  groupId: string;
  panelOpen: boolean;
  onTogglePanel: () => void;
  /** Id de message à faire défiler en vue (ex. depuis "fichiers partagés" du panneau info). */
  scrollToMessageId?: string | null;
  onScrolledToMessage?: () => void;
}

// Colonne centrale du Messagerie : header (avatar, nom, toggle Discussion/
// Sondages pour les groupes), fil de discussion + composer, ou onglet
// Sondages (mockup Messagerie.dc.html).
export function ConversationThread({
  groupId,
  panelOpen,
  onTogglePanel,
  scrollToMessageId,
  onScrolledToMessage,
}: ConversationThreadProps) {
  const { t } = useTranslation('messages');
  const { user, role } = useAuth();
  const { data: group } = useChatGroup(groupId);
  const { data: members } = useGroupMembers(groupId);
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    fetchPreviousPage,
    hasPreviousPage,
    isFetchingPreviousPage,
  } = useMessages(groupId);
  // On consulte une fenêtre de contexte (jump vers un pin / un fichier ancien)
  // tant qu'il reste des pages "plus récentes" à charger avant le direct :
  // `hasPreviousPage` l'exprime directement, sans état parallèle à resynchroniser.
  // Pendant ce temps on supprime les messages live (ils s'inséreraient au mauvais
  // endroit dans la fenêtre ancrée) — ils réapparaissent au retour au direct.
  const { typingUsers } = useChatSocket(groupId, { suppressLiveMessages: hasPreviousPage });
  const sendMessage = useSendMessage(groupId);
  const sendAttachment = useSendAttachment(groupId);
  const { notifyTyping } = useTyping(groupId);
  const markGroupRead = useMarkGroupRead();
  const { startCall, phase: callPhase } = useCall();
  // Présence temps réel de l'interlocuteur (MP uniquement) pour l'en-tête.
  const presence = usePresence(group?.type === 'direct_message' ? [group.other_participant?.id] : []);
  const jumpToMessage = useJumpToMessage(groupId);
  const returnToLiveMessages = useReturnToLiveMessages(groupId);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [tab, setTab] = useState<Tab>('discussion');
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);
  // Vrai tant que les ~5 derniers messages sont visibles — pilote la pastille
  // flottante "revenir aux messages récents".
  const [seenLast5, setSeenLast5] = useState(true);

  const isGroup = group?.type !== 'direct_message';
  const isNeighbourhood = group?.type === 'neighbourhood';
  const membersById = new Map((members ?? []).map((m) => [m.user_id, m]));
  const myRole = group?.my_role ?? members?.find((m) => m.user_id === user?.id)?.role;
  const isGroupAdmin = myRole === 'admin';
  const canModerate = myRole === 'actions' || myRole === 'admin';
  const canParticipate = myRole !== 'watch';
  // Le groupe de quartier auto-provisionné garde l'autorisation "sondage de
  // quartier" existante (rôle plateforme neighbourhood_rep+), distincte du
  // rôle de groupe (souvent "message" seulement pour un neighbourhood_rep).
  const canCreatePollHere = isNeighbourhood ? canCreatePoll(role) : canModerate;
  // Une conversation privée n'a pas de rôle "modérateur" à deux — chaque
  // participant (rôle "message", forcément) peut épingler pour lui-même/eux
  // deux ; un groupe garde le contrôle actions/admin habituel.
  const canPinHere = isGroup ? canModerate : Boolean(myRole);

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const lastMessageIdRef = useRef<string | undefined>(undefined);
  // Snap unique vers le bas à la prochaine arrivée de messages : au chargement
  // initial et après un clic sur la pastille "revenir aux messages récents".
  const pendingBottomRef = useRef(true);
  // Position de scroll "collée au bas" (à quelques px) — sert à décider si un
  // nouveau message live doit garder la vue en bas, sans redéclencher de rendu.
  const nearBottomRef = useRef(true);

  const messages: ChatMessage[] = data ? [...data.pages].reverse().flatMap((page) => [...page.messages].reverse()) : [];
  const lastMessage = messages[messages.length - 1];

  // La pastille "revenir aux messages récents" s'affiche dès qu'on n'est plus au
  // bas du direct : soit on consulte une fenêtre de contexte (des messages plus
  // récents restent à charger), soit on a simplement remonté au-delà des ~5
  // derniers messages.
  const showJumpToLatest = hasPreviousPage || !seenLast5;

  async function handleJumpTo(messageId: string) {
    try {
      await jumpToMessage(messageId);
      setPendingScrollId(messageId);
    } catch (error) {
      console.error('[chat] jump to message failed', error);
    }
  }

  // Un saut externe (ex. "fichiers partagés" du panneau info) passe par le
  // même chemin qu'un clic sur un pin — charge le contexte si besoin avant
  // de programmer le scroll, au lieu de se contenter d'un lookup DOM qui
  // échouerait silencieusement pour un message pas encore chargé.
  useEffect(() => {
    if (scrollToMessageId) void handleJumpTo(scrollToMessageId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToMessageId]);

  // Tant que la cible n'est pas encore dans le DOM (message qui vient d'être
  // chargé via `around`, rendu pas encore passé), on ne consomme pas
  // pendingScrollId — cet effet se redéclenche à chaque changement de
  // `messages` et retente, jusqu'à trouver l'élément.
  useEffect(() => {
    if (!pendingScrollId) return;
    if (tab !== 'discussion') setTab('discussion');
    const el = document.getElementById(`message-${pendingScrollId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setPendingScrollId(null);
    onScrolledToMessage?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingScrollId, messages, tab]);

  // Seuils (px) : EDGE = déclenchement du chargement à l'approche d'un bord ;
  // NEAR_BOTTOM = "collé au bas" (garde la vue en bas sur un message live).
  const EDGE_PX = 80;
  const NEAR_BOTTOM_PX = 120;
  const SEEN_TAIL_COUNT = 5;

  // "A vu les ~5 derniers messages" : le 5e en partant de la fin est-il encore
  // dans le conteneur ? (repli sur un simple seuil px quand il y a moins de 5
  // messages ou que l'élément n'est pas encore monté.)
  function computeSeenLast5(el: HTMLDivElement): boolean {
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (messages.length <= SEEN_TAIL_COUNT) return distanceToBottom < NEAR_BOTTOM_PX;
    const anchorId = messages[messages.length - SEEN_TAIL_COUNT].id;
    const anchor = document.getElementById(`message-${anchorId}`);
    if (!anchor) return distanceToBottom < NEAR_BOTTOM_PX;
    return anchor.getBoundingClientRect().top < el.getBoundingClientRect().bottom;
  }

  // Charge d'anciens messages en préservant la position (contenu ajouté en haut).
  function loadOlder() {
    const el = scrollRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    prevScrollHeightRef.current = el.scrollHeight;
    fetchNextPage().then(() => {
      requestAnimationFrame(() => {
        const after = scrollRef.current;
        if (after) after.scrollTop = after.scrollHeight - prevScrollHeightRef.current;
      });
    });
  }

  // Pas d'auto-scroll : on ne charge des messages qu'en atteignant un bord — le
  // haut pour les plus anciens, le bas pour combler le trou vers le direct
  // (fenêtre de contexte). Le contenu "plus récent" s'insère sous la vue sans la
  // déplacer, l'utilisateur continue de descendre à son rythme.
  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    nearBottomRef.current = distanceToBottom < NEAR_BOTTOM_PX;
    setSeenLast5(computeSeenLast5(el));
    if (el.scrollTop < EDGE_PX) loadOlder();
    if (distanceToBottom < EDGE_PX && hasPreviousPage && !isFetchingPreviousPage) fetchPreviousPage();
  }

  // Pastille "revenir aux messages récents".
  function handleJumpToLatest() {
    if (hasPreviousPage) {
      // Dans une fenêtre de contexte : on abandonne la fenêtre ancrée pour
      // recharger directement le direct (sans repaginer message par message),
      // puis on colle en bas quand la nouvelle page arrive.
      pendingBottomRef.current = true;
      returnToLiveMessages();
    } else {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      setSeenLast5(true);
    }
  }

  // Réinitialise l'état de scroll à chaque changement de conversation : la
  // prochaine page doit se poser en bas, rien n'est encore "vu".
  useEffect(() => {
    pendingBottomRef.current = true;
    nearBottomRef.current = true;
    lastMessageIdRef.current = undefined;
    setSeenLast5(true);
  }, [groupId]);

  // Positionnement vertical, sans jamais arracher la vue de sa place :
  //  - snap unique en bas au chargement initial / après "revenir au direct" ;
  //  - sur un nouveau message live (au direct et déjà en bas), on reste collé.
  // Un jump vers un pin passe par pendingScrollId (fenêtre de contexte,
  // hasPreviousPage vrai) et n'entraîne donc aucun snap ici.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isLoading || !lastMessage) return;

    if (pendingBottomRef.current) {
      el.scrollTop = el.scrollHeight;
      pendingBottomRef.current = false;
      nearBottomRef.current = true;
      lastMessageIdRef.current = lastMessage.id;
      setSeenLast5(true);
      return;
    }

    if (lastMessage.id !== lastMessageIdRef.current) {
      if (nearBottomRef.current && !hasPreviousPage) {
        el.scrollTop = el.scrollHeight;
        setSeenLast5(true);
      }
      lastMessageIdRef.current = lastMessage.id;
    }
  }, [lastMessage, isLoading, hasPreviousPage]);

  // Marque la conversation comme lue à l'ouverture, et à chaque nouveau
  // message reçu (pas envoyé par soi-même) tant qu'on est au direct.
  useEffect(() => {
    markGroupRead(groupId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  useEffect(() => {
    // Pas de "lu" pendant qu'on consulte une fenêtre de contexte (jump vers un
    // pin) — "lastMessage" y est le dernier message affiché, pas un vrai nouveau.
    if (hasPreviousPage) return;
    if (lastMessage && lastMessage.sender_id !== user?.id) markGroupRead(groupId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage?.id, hasPreviousPage]);

  function handleSend(content: string, parentMessageId?: string) {
    sendMessage(content, 'text', parentMessageId);
  }

  // Appels 1:1 : proposés uniquement en conversation privée (l'UI d'appel et le
  // mockup CallColumn couvrent le face-à-face ; un appel de groupe multipartite
  // sortirait du périmètre actuel).
  const callPeer = group?.other_participant;
  const canCall = !isGroup && Boolean(callPeer) && callPhase === 'idle';
  function handleStartCall(type: 'audio' | 'video') {
    if (!callPeer) return;
    void startCall(groupId, type, {
      id: callPeer.id,
      name: `${callPeer.first_name} ${callPeer.last_name}`.trim(),
      avatarMongoId: callPeer.profile_picture_mongo_id,
    });
  }

  if (isLoading || !group) {
    return <main className="flex flex-1 items-center justify-center bg-surface text-sm text-gray">…</main>;
  }

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface">
      <header className="flex h-16 flex-shrink-0 items-center gap-3 border-b border-gray/20 px-4">
        {/* Retour à la liste des conversations — visible seulement sur mobile,
            où le fil occupe toute la largeur (colonne unique). */}
        <Link
          to="/chat"
          aria-label={t('chat.back_to_conversations')}
          className="-ml-1 rounded-lg p-1.5 text-gray hover:bg-gray/10 md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Avatar {...getGroupAvatarProps(group)} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-fg">{getGroupDisplayName(group, t)}</p>
          {isGroup && group.member_count != null && (
            <p className="text-xs text-gray">{t('chat.member_count', { count: group.member_count })}</p>
          )}
          {!isGroup && group.other_participant && (
            <p className={`text-xs ${presence[group.other_participant.id] ? 'text-success' : 'text-gray'}`}>
              {presence[group.other_participant.id] ? t('chat.online') : t('chat.offline')}
            </p>
          )}
        </div>

        {isGroup && (
          <div className="flex gap-1 rounded-lg bg-gray/10 p-1">
            <button
              type="button"
              onClick={() => setTab('discussion')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                tab === 'discussion' ? 'bg-surface text-fg shadow-sm' : 'text-gray'
              }`}
            >
              {t('chat.tab_discussion')}
            </button>
            <button
              type="button"
              onClick={() => setTab('sondages')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                tab === 'sondages' ? 'bg-surface text-fg shadow-sm' : 'text-gray'
              }`}
            >
              {t('chat.tab_polls')}
            </button>
          </div>
        )}

        {canCall && (
          <>
            <button
              type="button"
              onClick={() => handleStartCall('audio')}
              aria-label={t('call.start_audio')}
              title={t('call.start_audio')}
              className="rounded-lg p-2 text-gray hover:bg-gray/10 hover:text-fg"
            >
              <Phone className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => handleStartCall('video')}
              aria-label={t('call.start_video')}
              title={t('call.start_video')}
              className="rounded-lg p-2 text-gray hover:bg-gray/10 hover:text-fg"
            >
              <Video className="h-5 w-5" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onTogglePanel}
          aria-label={t('chat.group_settings')}
          className={`rounded-lg p-2 ${panelOpen ? 'bg-orange/10 text-orange' : 'text-gray hover:bg-gray/10'}`}
        >
          <Info className="h-5 w-5" />
        </button>
      </header>

      {tab === 'sondages' && isGroup ? (
        <GroupPollsTab
          groupId={groupId}
          isNeighbourhood={isNeighbourhood}
          neighbourhoodId={group.neighbourhoodId}
          canCreate={canCreatePollHere}
        />
      ) : (
        <>
          <PinnedMessagesBar groupId={groupId} onSelect={handleJumpTo} />

          <div className="relative flex min-h-0 flex-1 flex-col">
            <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4">
              {hasNextPage && (
                <div className="mb-3 flex justify-center">
                  <Button variant="secondary" onClick={loadOlder} disabled={isFetchingNextPage} className="text-xs">
                    {isFetchingNextPage ? '…' : t('chat.load_older')}
                  </Button>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.sender_id === user?.id}
                    showSender={isGroup}
                    isGroupAdmin={isGroupAdmin}
                    canPin={canPinHere}
                    canParticipate={canParticipate}
                    senderRole={membersById.get(message.sender_id)?.role}
                    onReply={setReplyTo}
                    onViewPoll={() => setTab('sondages')}
                  />
                ))}
              </div>

              {isFetchingPreviousPage && (
                <p className="mt-3 text-center text-xs text-gray">{t('chat.loading_recent')}</p>
              )}
            </div>

            {/* Pastille flottante "revenir aux messages récents" : visible dès
                qu'on n'est plus au bas du direct (remontée > 5 messages, ou
                consultation d'une fenêtre de contexte via un pin). */}
            {showJumpToLatest && (
              <button
                type="button"
                onClick={handleJumpToLatest}
                className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-navy/90"
              >
                <ArrowDown className="h-3.5 w-3.5" />
                {t('chat.back_to_recent')}
              </button>
            )}
          </div>

          <TypingIndicator userIds={typingUsers[groupId] ?? []} />
          <MessageInput
            onSend={handleSend}
            onTyping={notifyTyping}
            onSendFile={sendAttachment}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            readOnly={!canParticipate}
            extraActions={
              isGroup && canCreatePollHere ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPollModalOpen(true)}
                  aria-label={t('chat.create_poll')}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              ) : undefined
            }
          />
          {isGroup && canCreatePollHere && (
            <CreatePollModal
              open={pollModalOpen}
              onClose={() => setPollModalOpen(false)}
              groupId={isNeighbourhood ? undefined : groupId}
              neighbourhoodId={isNeighbourhood ? group.neighbourhoodId : undefined}
            />
          )}
        </>
      )}
    </main>
  );
}
