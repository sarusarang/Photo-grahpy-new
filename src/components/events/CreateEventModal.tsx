import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  Sparkles,
  Clock,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import type { EventType, EventStatus } from '../../types/event';
import { CURATED_EVENT_BANNERS, getExpiryDateHoursAhead } from './eventConstants';
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

  const { mutateAsync: apiCreateEvent, isPending } = useCreateEvent();

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
        city: city.trim(),
        client_name: clientName.trim() || 'Private Client',
        client_contact: clientContact.trim(),
        event_date: eventDate,
        event_time: eventTime,
        status,
        banner_url: selectedBanner,
        qr_duration_hours: qrDurationHours,
        qr_valid_from: new Date().toISOString(),
        qr_expires_at: getExpiryDateHoursAhead(qrDurationHours),
      });

      showToast(
        status === 'live' ? 'Live Event Created!' : 'Upcoming Event Scheduled',
        status === 'live'
          ? `"${title}" is live and ready for instant photo uploads.`
          : `Scheduled for ${eventDate}. QR stand cards pre-generated and ready to print.`,
        'success'
      );

      onClose();
      navigate(`/dashboard/events/${createdFromApi.id}`);
    } catch (err: any) {
      showToast('Creation Failed', err?.message || 'Failed to create event on server.', 'error');
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 dark:bg-black/85 backdrop-blur-md overlay-animate overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white dark:bg-[#0c0d14] border border-neutral-200/90 dark:border-white/[0.09] text-neutral-900 dark:text-white shadow-[0_25px_70px_rgba(0,0,0,0.5)] rounded-3xl my-auto modal-animate max-h-[min(92vh,780px)] flex flex-col overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-gradient-to-br from-amber-500/15 via-amber-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-gradient-to-tl from-amber-500/10 via-amber-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-neutral-200 dark:border-white/[0.08] shrink-0 bg-neutral-50/50 dark:bg-transparent">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30 text-amber-500 dark:text-amber-400 flex items-center justify-center shadow-inner">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                Live & Upcoming Events
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight mt-0.5">
                Create New Event
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
            {/* Plan Quota Badge */}
            <div className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border text-xs ${
              planQuota.isExpired
                ? 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                : 'bg-amber-500/10 dark:bg-amber-400/5 border border-amber-500/20 dark:border-amber-400/15'
            }`}>
              <div className="flex items-center gap-2 font-medium">
                {planQuota.isExpired ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                <span>Studio Plan: <strong className="font-semibold text-neutral-900 dark:text-white">{planQuota.planName}</strong></span>
              </div>
              <div className="text-[11px] font-mono font-semibold">
                {planQuota.isExpired ? (
                  <span className="text-rose-500 font-bold uppercase tracking-wider">
                    MEMBERSHIP EXPIRED
                  </span>
                ) : planQuota.isUnlimitedEvents ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Unlimited Live Events</span>
                ) : (
                  <span className="text-neutral-600 dark:text-neutral-400">
                    <strong className="text-amber-600 dark:text-amber-400">{planQuota.eventsRemaining}</strong> of {planQuota.maxEvents} events left
                  </span>
                )}
              </div>
            </div>

            {/* Quota Exceeded or Plan Expired Warning */}
            {!planQuota.canCreateEvent && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  <div>
                    <p className="font-bold">
                      {planQuota.isExpired ? 'Studio Membership Expired' : `Event Quota Reached (${planQuota.eventsUsed}/${planQuota.maxEvents})`}
                    </p>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                      {planQuota.isExpired
                        ? 'Your subscription period has ended. Renew or select any plan to resume hosting live events.'
                        : `Your current plan allows up to ${planQuota.maxEvents} live scheduled events.`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs shrink-0 transition-colors shadow-sm cursor-pointer"
                >
                  {planQuota.isExpired ? 'Renew Plan' : 'Upgrade Plan'}
                </button>
              </div>
            )}

            {/* Status Switcher: Live Now vs Upcoming */}
            <div className="p-1.5 rounded-2xl bg-neutral-100/90 dark:bg-[#07080e] border border-neutral-200/80 dark:border-white/[0.06] shadow-inner grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('live')}
                className={`p-3.5 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                  status === 'live'
                    ? 'bg-white dark:bg-gradient-to-b dark:from-[#15231c] dark:to-[#0f1914] border border-emerald-500/40 text-neutral-950 dark:text-white shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                    : 'border-transparent bg-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                  <span className={`text-xs font-mono font-bold uppercase ${status === 'live' ? 'text-emerald-700 dark:text-emerald-300' : 'text-neutral-500'}`}>
                    Live Event (Happening Now)
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Active QR scanning, instant photo uploads, and camera tethering ready.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStatus('upcoming')}
                className={`p-3.5 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                  status === 'upcoming'
                    ? 'bg-white dark:bg-gradient-to-b dark:from-[#262015] dark:to-[#17140e] border border-amber-500/40 text-neutral-950 dark:text-white shadow-md shadow-amber-500/10 ring-1 ring-amber-400/30'
                    : 'border-transparent bg-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Clock className={`w-3.5 h-3.5 ${status === 'upcoming' ? 'text-amber-400' : 'text-neutral-500'}`} />
                  <span className={`text-xs font-mono font-bold uppercase ${status === 'upcoming' ? 'text-amber-700 dark:text-amber-300' : 'text-neutral-500'}`}>
                    Upcoming Event (Future)
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Schedule future date, pre-generate QR stand cards for guest tables.
                </p>
              </button>
            </div>

            {/* Event Title */}
            <div className="space-y-1.5">
              <label className="atelier-label">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Event Title</span>
                  <span className="text-amber-500">*</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400 font-normal">Headline for guest portal</span>
              </label>
              <div className="atelier-input-wrapper">
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Palace Wedding • Ananya & Kabir"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="atelier-input font-medium"
                />
              </div>
            </div>

            {/* Client Name & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="atelier-label">
                  <span className="flex items-center gap-1.5">
                    <span>Client / Couple Name</span>
                  </span>
                </label>
                <div className="atelier-input-wrapper">
                  <input
                    type="text"
                    placeholder="e.g. Elena & Julian Rossi"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="atelier-input"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="atelier-label">
                  <span className="flex items-center gap-1.5">
                    <span>Event Type</span>
                  </span>
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
                <label className="atelier-label">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>Event Date</span>
                  </span>
                </label>
                <div className="atelier-input-wrapper">
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="atelier-input font-mono text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="atelier-label">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Start Time</span>
                  </span>
                </label>
                <div className="atelier-input-wrapper">
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="atelier-input font-mono text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="atelier-label">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>QR Validity</span>
                  </span>
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
                <label className="atelier-label">
                  <span className="flex items-center gap-1.5">
                    <span>Venue Location</span>
                  </span>
                </label>
                <div className="atelier-input-wrapper">
                  <input
                    type="text"
                    placeholder="e.g. The Oberoi Udaivilas"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="atelier-input"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="atelier-label">
                  <span className="flex items-center gap-1.5">
                    <span>City / Region</span>
                  </span>
                </label>
                <div className="atelier-input-wrapper">
                  <input
                    type="text"
                    placeholder="e.g. Udaipur, India"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="atelier-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit & Cancel (Fixed Footer) */}
          <div className="relative p-4 sm:p-6 pt-4 border-t border-neutral-200 dark:border-white/[0.08] flex items-center justify-end gap-3 shrink-0 bg-neutral-50/80 dark:bg-[#0c0d14]/90 backdrop-blur-md">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl border border-neutral-200/90 dark:border-white/[0.1] hover:bg-neutral-100 dark:hover:bg-white/[0.05] disabled:opacity-50 text-neutral-700 dark:text-neutral-300 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !planQuota.canCreateEvent}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 text-xs font-mono font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/25 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{status === 'live' ? 'Launching Live Event...' : 'Scheduling Event...'}</span>
                </>
              ) : (
                <>
                  <span>{status === 'live' ? 'Launch Live Event' : 'Schedule Event'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
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
