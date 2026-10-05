import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeServerEvent } from '@/utils/eventNormalizer';
import { Calendar, Trash2, Plus } from 'lucide-react';
import { useEvents, useDeleteEvent, useRestoreEvent, useUpdateEvent } from '@/hooks/useAtelierQueries';
import { EventListSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { useToast } from '@/components/ui/Toast';
import {
  EventsHeader,
  EventsFilterBar,
  EventCard,
  EventDeleteModal,
  CreateEventModal,
  EventQRCodeModal,
  EventPrintStandModal,
  ChangeBannerModal,
  MoveToGalleryModal,
  EditEventModal,
  type EventTabType,
} from '@/components/events';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import { PlanUpgradeModal } from '@/components/billing/PlanUpgradeModal';
import type { LiveEvent } from '@/types/event';

export const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const planQuota = usePlanQuota();

  // Live Backend Events Sync
  const {
    data: apiEvents,
    isLoading: isLoadingEvents,
    isError: isEventsError,
    refetch: refetchEvents,
  } = useEvents();

  const deleteEventMutation = useDeleteEvent();
  const restoreEventMutation = useRestoreEvent();
  const updateEventMutation = useUpdateEvent();

  // Normalize server events strictly from live API response
  const effectiveEvents = useMemo<LiveEvent[]>(() => {
    if (apiEvents && Array.isArray(apiEvents)) {
      return apiEvents.map((e: any) => normalizeServerEvent(e));
    }
    return [];
  }, [apiEvents]);

  const liveEvents = useMemo(
    () => effectiveEvents.filter((e) => e.status === 'live'),
    [effectiveEvents]
  );
  const upcomingEvts = useMemo(
    () => effectiveEvents.filter((e) => e.status === 'upcoming'),
    [effectiveEvents]
  );
  const pastEvts = useMemo(
    () => effectiveEvents.filter((e) => e.status === 'completed' || e.status === 'moved_to_gallery'),
    [effectiveEvents]
  );
  const trashEvts = useMemo(
    () => effectiveEvents.filter((e) => e.status === 'trash' || e.status === 'archived'),
    [effectiveEvents]
  );

  const [activeTab, setActiveTab] = useState<EventTabType>('live');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<'live' | 'upcoming'>('live');
  const [qrModalEvent, setQrModalEvent] = useState<LiveEvent | null>(null);
  const [printStandEvent, setPrintStandEvent] = useState<LiveEvent | null>(null);
  const [bannerModalEvent, setBannerModalEvent] = useState<LiveEvent | null>(null);
  const [moveToGalleryEvent, setMoveToGalleryEvent] = useState<LiveEvent | null>(null);
  const [editModalEvent, setEditModalEvent] = useState<LiveEvent | null>(null);

  // Deletion modal state
  const [targetDeleteModal, setTargetDeleteModal] = useState<{
    event: LiveEvent;
    mode: 'trash' | 'permanent';
  } | null>(null);

  const handleOpenCreateModal = (status: 'live' | 'upcoming') => {
    if (!planQuota.canCreateEvent) {
      setIsUpgradeModalOpen(true);
      return;
    }
    setCreateDefaultStatus(status);
    setIsCreateModalOpen(true);
  };

  // Filter events based on active tab
  const filteredEvents =
    activeTab === 'live'
      ? liveEvents
      : activeTab === 'upcoming'
        ? upcomingEvts
        : activeTab === 'past'
          ? pastEvts
          : trashEvts;

  const handleConfirmDelete = async () => {
    if (!targetDeleteModal) return;
    const { event, mode } = targetDeleteModal;
    const permanent = mode === 'permanent';

    try {
      await deleteEventMutation.mutateAsync({ id: event.id, permanent });
      showToast(
        permanent ? 'Event Permanently Deleted' : 'Moved to Event Trash',
        permanent
          ? `"${event.title}" and its media have been permanently removed.`
          : `"${event.title}" has been moved to Trash (auto-purged after 15 days).`,
        'info'
      );
      setTargetDeleteModal(null);
      refetchEvents();
    } catch (err: any) {
      showToast('Action Failed', err?.message || 'Could not complete deletion.', 'error');
    }
  };

  const handleRestoreEvent = async (event: LiveEvent) => {
    try {
      await restoreEventMutation.mutateAsync({ id: event.id, targetStatus: 'upcoming' });
      showToast('Event Restored', `"${event.title}" has been restored to your upcoming events.`, 'success');
      refetchEvents();
    } catch (err: any) {
      showToast('Restore Failed', err?.message || 'Could not restore event.', 'error');
    }
  };

  const handleStartLiveShoot = async (event: LiveEvent) => {
    try {
      await updateEventMutation.mutateAsync({
        id: event.id,
        updates: { status: 'live' },
      });
      showToast('Live Mode Started!', `"${event.title}" is now active and ready for live shooting.`, 'success');
      refetchEvents();
      setActiveTab('live');
    } catch (err: any) {
      showToast('Update Failed', err?.message || 'Could not start live shoot.', 'error');
    }
  };

  return (
    <div className="dashboard-container p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* ─── Top Header & Quota ─── */}
      <EventsHeader
        planQuota={planQuota}
        liveCount={liveEvents.length}
        onOpenCreateModal={handleOpenCreateModal}
        onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
      />

      {/* ─── Tabs Filter Bar ─── */}
      <EventsFilterBar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        liveCount={liveEvents.length}
        upcomingCount={upcomingEvts.length}
        pastCount={pastEvts.length}
        trashCount={trashEvts.length}
      />

      {/* ─── Events Grid ─── */}
      {isLoadingEvents && effectiveEvents.length === 0 ? (
        <EventListSkeleton count={3} />
      ) : isEventsError && effectiveEvents.length === 0 ? (
        <ErrorState
          title="Failed to Load Events"
          message="Could not reach the live event tethering service. Please verify your backend API connection."
          onRetry={() => refetchEvents()}
        />
      ) : filteredEvents.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-[#111218] border border-neutral-200 dark:border-neutral-800/80 rounded-3xl p-8 max-w-lg mx-auto space-y-4">
          {activeTab === 'trash' ? (
            <Trash2 className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mx-auto stroke-1" />
          ) : (
            <Calendar className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mx-auto stroke-1" />
          )}
          <div>
            <h3 className="text-lg font-serif font-bold text-neutral-900 dark:text-white">
              No {activeTab} events found
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {activeTab === 'live'
                ? 'Start a live event when shooting a celebration to upload photos in real-time.'
                : activeTab === 'upcoming'
                  ? 'Schedule an upcoming shoot days in advance to pre-generate printable QR stand cards.'
                  : activeTab === 'trash'
                    ? 'Your event trash is empty. Deleted events are held here for 15 days.'
                    : 'Events you move into your Studio Galleries will appear here.'}
            </p>
          </div>
          {activeTab !== 'trash' && activeTab !== 'past' && (
            <button
              onClick={() => {
                const targetStatus = activeTab === 'upcoming' ? 'upcoming' : 'live';
                setCreateDefaultStatus(targetStatus);
                handleOpenCreateModal(targetStatus);
              }}
              className="py-2.5 px-5 rounded-xl bg-amber-400 text-neutral-950 text-xs font-mono font-bold hover:bg-amber-300 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{activeTab === 'upcoming' ? 'Schedule Upcoming Event' : 'Start Live Event'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isPlanExpired={planQuota.isExpired}
              onRenewPlan={() => setIsUpgradeModalOpen(true)}
              onNavigate={(id) => {
                if (planQuota.isExpired) {
                  setIsUpgradeModalOpen(true);
                  return;
                }
                navigate(`/dashboard/events/${id}`);
              }}
              onEdit={(e) => {
                if (planQuota.isExpired) {
                  setIsUpgradeModalOpen(true);
                  return;
                }
                setEditModalEvent(e);
              }}
              onChangeBanner={(e) => {
                if (planQuota.isExpired) {
                  setIsUpgradeModalOpen(true);
                  return;
                }
                setBannerModalEvent(e);
              }}
              onSoftDelete={(e) => {
                if (planQuota.isExpired) {
                  setIsUpgradeModalOpen(true);
                  return;
                }
                setTargetDeleteModal({ event: e, mode: 'trash' });
              }}
              onPermanentDelete={(e) => {
                if (planQuota.isExpired) {
                  setIsUpgradeModalOpen(true);
                  return;
                }
                setTargetDeleteModal({ event: e, mode: 'permanent' });
              }}
              onRestore={handleRestoreEvent}
              isRestoring={restoreEventMutation.isPending}
              onStartLiveShoot={(e) => {
                if (planQuota.isExpired) {
                  setIsUpgradeModalOpen(true);
                  return;
                }
                handleStartLiveShoot(e);
              }}
              onPrintStand={(e) => {
                if (planQuota.isExpired) {
                  setIsUpgradeModalOpen(true);
                  return;
                }
                setPrintStandEvent(e);
              }}
              onOpenQR={(e) => {
                if (planQuota.isExpired) {
                  setIsUpgradeModalOpen(true);
                  return;
                }
                setQrModalEvent(e);
              }}
              onMoveToGallery={(e) => {
                if (planQuota.isExpired) {
                  setIsUpgradeModalOpen(true);
                  return;
                }
                setMoveToGalleryEvent(e);
              }}
            />
          ))}
        </div>
      )}

      {/* Delete / Move to Trash Confirmation Modal */}
      <EventDeleteModal
        isOpen={Boolean(targetDeleteModal)}
        target={targetDeleteModal}
        isDeleting={deleteEventMutation.isPending}
        onClose={() => setTargetDeleteModal(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* ─── Modals ─── */}
      {isCreateModalOpen && (
        <CreateEventModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          defaultStatus={createDefaultStatus}
        />
      )}

      {qrModalEvent && (
        <EventQRCodeModal
          isOpen={Boolean(qrModalEvent)}
          onClose={() => setQrModalEvent(null)}
          event={qrModalEvent}
          onOpenPrintStand={() => setPrintStandEvent(qrModalEvent)}
          onUpdated={refetchEvents}
        />
      )}

      {printStandEvent && (
        <EventPrintStandModal
          isOpen={Boolean(printStandEvent)}
          onClose={() => setPrintStandEvent(null)}
          event={printStandEvent}
        />
      )}

      {bannerModalEvent && (
        <ChangeBannerModal
          isOpen={Boolean(bannerModalEvent)}
          onClose={() => setBannerModalEvent(null)}
          event={bannerModalEvent}
        />
      )}

      {editModalEvent && (
        <EditEventModal
          isOpen={Boolean(editModalEvent)}
          onClose={() => setEditModalEvent(null)}
          event={editModalEvent}
          onUpdated={refetchEvents}
        />
      )}

      {moveToGalleryEvent && (
        <MoveToGalleryModal
          isOpen={Boolean(moveToGalleryEvent)}
          onClose={() => setMoveToGalleryEvent(null)}
          event={moveToGalleryEvent}
        />
      )}

      {/* Plan Upgrade Modal */}
      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        errorCode={planQuota.isExpired ? 'PLAN_EXPIRED' : 'EVENT_LIMIT_EXCEEDED'}
        lockedFeature="Live Events"
        errorMessage={
          planQuota.isExpired
            ? `Your studio plan has expired. Renew your plan to unlock and manage live events, guest portals, and hardware tethering.`
            : `Your ${planQuota.planName} has reached its limit of ${planQuota.maxEvents} live events. Upgrade your studio subscription to schedule unlimited events.`
        }
      />
    </div>
  );
};
