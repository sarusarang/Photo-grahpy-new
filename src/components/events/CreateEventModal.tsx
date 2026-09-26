import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  Sparkles,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import type { EventType, EventStatus } from '../../types/event';
import { CURATED_EVENT_BANNERS, getExpiryDateHoursAhead } from '../../data/eventData';
import { useEvent } from '../../context/EventContext';
import { useToast } from '../ui/Toast';
import { useNavigate } from 'react-router-dom';
import { useCreateEvent } from '@/hooks/useAtelierQueries';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import { PlanUpgradeModal } from '@/components/billing/PlanUpgradeModal';
import { CustomSelect, type CustomSelectOption } from '../ui/CustomSelect';

const EVENT_TYPE_OPTIONS: CustomSelectOption<EventType>[] = [
  { value: 'wedding', label: 'Wedding Celebration' },
  { value: 'reception', label: 'Reception / Sangeet' },
  { value: 'gala', label: 'VIP Gala / Soirée' },
  { value: 'fashion', label: 'Haute Couture Fashion Show' },
  { value: 'birthday', label: 'Birthday / Anniversary' },
  { value: 'corporate', label: 'Corporate Summit' },
  { value: 'concert', label: 'Concert / Performance' },
  { value: 'other', label: 'Bespoke Special Event' },
];

const QR_VALIDITY_OPTIONS: CustomSelectOption<number>[] = [
  { value: 2, label: '2 Hours' },
  { value: 4, label: '4 Hours (Standard)' },
  { value: 8, label: '8 Hours' },
  { value: 24, label: '24 Hours (Full Day)' },
];

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStatus?: EventStatus;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  defaultStatus = 'live',
}) => {
  const { createEvent } = useEvent();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const planQuota = usePlanQuota();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const clientContact = '';
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [status, setStatus] = useState<EventStatus>(defaultStatus);
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState('18:00');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const selectedBanner = CURATED_EVENT_BANNERS[0].url;
  const [qrDurationHours, setQrDurationHours] = useState<number>(4);

  // Lock background scroll & handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const { mutateAsync: apiCreateEvent } = useCreateEvent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Title Required', 'Please provide a name for the event.', 'error');
      return;
    }

    if (!planQuota.canCreateEvent) {
      setIsUpgradeModalOpen(true);
      return;
    }

    try {
      const createdFromApi = await apiCreateEvent({
        title: title.trim(),
        event_type: eventType,
        venue: venue.trim() || 'Private Venue',
        qr_duration_hours: qrDurationHours,
      });

      const newEvent = createEvent({
        id: createdFromApi.id,
        slug: createdFromApi.slug || createdFromApi.id,
        title: createdFromApi.title,
        clientName: clientName.trim() || 'Private Client',
        clientContact: clientContact.trim(),
        eventType,
        status: (createdFromApi.status as any) || status,
        bannerUrl: selectedBanner,
        eventDate,
        eventTime,
        venue: venue.trim() || 'Private Venue',
        city: city.trim(),
        qrSettings: {
          validFrom: new Date().toISOString(),
          expiresAt: getExpiryDateHoursAhead(qrDurationHours),
          durationHours: qrDurationHours,
          isActive: true,
          allowGuestUploads: false,
        },
      });

      showToast(
        status === 'live' ? 'Live Event Created!' : 'Upcoming Event Scheduled',
        status === 'live'
          ? `Event is now live and ready for instant photo uploads.`
          : `Scheduled for ${eventDate}. QR stand cards pre-generated.`,
        'success'
      );

      onClose();
      navigate(`/dashboard/events/${createdFromApi.id || newEvent.id}`);
    } catch {
      // Local fallback
      const newEvent = createEvent({
        title: title.trim(),
        clientName: clientName.trim() || 'Private Client',
        clientContact: clientContact.trim(),
        eventType,
        status,
        bannerUrl: selectedBanner,
        eventDate,
        eventTime,
        venue: venue.trim() || 'Private Venue',
        city: city.trim(),
        qrSettings: {
          validFrom: new Date().toISOString(),
          expiresAt: getExpiryDateHoursAhead(qrDurationHours),
          durationHours: qrDurationHours,
          isActive: true,
          allowGuestUploads: false,
        },
      });

      showToast(
        status === 'live' ? 'Live Event Created!' : 'Upcoming Event Scheduled',
        'Saved to studio schedule.',
        'info'
      );

      onClose();
      navigate(`/dashboard/events/${newEvent.id}`);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:backdrop-blur-md overlay-animate overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white dark:bg-[#111218] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white shadow-2xl rounded-3xl my-auto modal-animate max-h-[min(90vh,760px)] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-neutral-200 dark:border-neutral-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                Live & Upcoming
              </span>
              <h3 className="text-xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
                Create New Event
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Plan Quota Badge */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Studio Plan: <strong className="font-semibold">{planQuota.planName}</strong></span>
              </div>
              <div className="text-[11px] font-mono font-semibold">
                {planQuota.isUnlimitedEvents ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Unlimited Live Events</span>
                ) : (
                  <span className="text-neutral-600 dark:text-neutral-400">
                    <strong className="text-amber-600 dark:text-amber-400">{planQuota.eventsRemaining}</strong> of {planQuota.maxEvents} events left
                  </span>
                )}
              </div>
            </div>

            {/* Quota Exceeded Warning */}
            {!planQuota.canCreateEvent && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  <div>
                    <p className="font-bold">Event Quota Reached ({planQuota.eventsUsed}/{planQuota.maxEvents})</p>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                      Your current plan allows up to {planQuota.maxEvents} live scheduled events.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs shrink-0 transition-colors shadow-sm cursor-pointer"
                >
                  Upgrade Plan
                </button>
              </div>
            )}

            {/* Status Switcher: Live Now vs Upcoming */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('live')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  status === 'live'
                    ? 'bg-amber-400/10 border-amber-400 text-neutral-900 dark:text-white ring-1 ring-amber-400'
                    : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase text-amber-600 dark:text-amber-400">
                    Live Event (Happening Now)
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Active QR scanning, instant photo uploads, and camera tethering ready.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStatus('upcoming')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  status === 'upcoming'
                    ? 'bg-amber-400/10 border-amber-400 text-neutral-900 dark:text-white ring-1 ring-amber-400'
                    : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span className="text-xs font-mono font-bold uppercase text-amber-600 dark:text-amber-400">
                    Upcoming Event (Future)
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Schedule future date, pre-generate QR stand cards for guest tables.
                </p>
              </button>
            </div>

            {/* Event Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-neutral-700 dark:text-neutral-300 font-semibold">
                Event Title <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Royal Palace Wedding • Ananya & Kabir"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            {/* Client Name & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-700 dark:text-neutral-300 font-semibold">
                  Client / Couple Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Elena & Julian Rossi"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-700 dark:text-neutral-300 font-semibold">
                  Event Type
                </label>
                <CustomSelect
                  value={eventType}
                  onChange={(val) => setEventType(val as EventType)}
                  options={EVENT_TYPE_OPTIONS}
                />
              </div>
            </div>

            {/* Date, Time, Venue */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-700 dark:text-neutral-300 font-semibold">
                  Event Date
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-700 dark:text-neutral-300 font-semibold">
                  Start Time
                </label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-700 dark:text-neutral-300 font-semibold">
                  QR Validity
                </label>
                <CustomSelect
                  value={qrDurationHours}
                  onChange={(val) => setQrDurationHours(Number(val))}
                  options={QR_VALIDITY_OPTIONS}
                />
              </div>
            </div>

            {/* Venue & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-700 dark:text-neutral-300 font-semibold">
                  Venue Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. The Oberoi Udaivilas"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-700 dark:text-neutral-300 font-semibold">
                  City / Region
                </label>
                <input
                  type="text"
                  placeholder="e.g. Udaipur, India"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Submit & Cancel (Fixed Footer) */}
          <div className="p-4 sm:p-6 pt-3 border-t border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/80 dark:bg-[#111218]/90 backdrop-blur-xs flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 text-xs font-mono transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold flex items-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-amber-400/20 cursor-pointer"
            >
              <span>{status === 'live' ? 'Launch Live Event' : 'Schedule Event'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        errorCode="EVENT_LIMIT_EXCEEDED"
        lockedFeature="Live Events"
        errorMessage={`Your ${planQuota.planName} has reached its limit of ${planQuota.maxEvents} live events. Upgrade your studio subscription to schedule unlimited events.`}
      />
    </div>,
    document.body
  );
};
