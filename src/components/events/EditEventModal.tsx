import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Edit3,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  CheckCircle2,
  Loader2,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { LiveEvent, EventType, EventStatus } from '../../types/event';
import { useUpdateEvent } from '@/hooks/useAtelierQueries';
import { useToast } from '../ui/Toast';
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

const QR_DURATION_OPTIONS: CustomSelectOption<number>[] = [
  { value: 2, label: '2 Hours' },
  { value: 4, label: '4 Hours (Standard)' },
  { value: 8, label: '8 Hours' },
  { value: 24, label: '24 Hours (Full Day)' },
  { value: 48, label: '48 Hours (Weekend)' },
  { value: 168, label: '7 Days' },
];

const STATUS_OPTIONS: EventStatus[] = ['live', 'upcoming', 'completed'];

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: LiveEvent;
  onUpdated?: () => void;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  onClose,
  event,
  onUpdated,
}) => {
  const { showToast } = useToast();
  const { mutateAsync: updateEventMutation, isPending } = useUpdateEvent();

  // Form states initialized from event prop
  const [title, setTitle] = useState(event.title || '');
  const [clientName, setClientName] = useState(event.clientName || '');
  const [clientContact, setClientContact] = useState(event.clientContact || '');
  const [eventType, setEventType] = useState<EventType>(event.eventType || 'wedding');
  const [status, setStatus] = useState<EventStatus>(
    event.status === 'upcoming' || event.status === 'completed' ? event.status : 'live'
  );
  const [eventDate, setEventDate] = useState(
    event.eventDate || new Date().toISOString().split('T')[0]
  );
  const [eventTime, setEventTime] = useState(event.eventTime || '18:00');
  const [venue, setVenue] = useState(event.venue || '');
  const [city, setCity] = useState(event.city || '');
  const [qrDurationHours, setQrDurationHours] = useState<number>(
    typeof event.qrSettings?.durationHours === 'number' ? event.qrSettings.durationHours : 4
  );

  // Keep form in sync whenever event prop changes
  useEffect(() => {
    if (isOpen && event) {
      setTitle(event.title || '');
      setClientName(event.clientName || '');
      setClientContact(event.clientContact || '');
      setEventType(event.eventType || 'wedding');
      setStatus(
        event.status === 'upcoming' || event.status === 'completed' ? event.status : 'live'
      );
      setEventDate(event.eventDate || new Date().toISOString().split('T')[0]);
      setEventTime(event.eventTime || '18:00');
      setVenue(event.venue || '');
      setCity(event.city || '');
      setQrDurationHours(
        typeof event.qrSettings?.durationHours === 'number' ? event.qrSettings.durationHours : 4
      );
    }
  }, [isOpen, event]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Title Required', 'Please provide a name for the event.', 'error');
      return;
    }

    try {
      // Build clean payload with only desired fields
      const payload: Record<string, any> = {
        title: title.trim(),
        client_name: clientName.trim() || 'Private Client',
        client_contact: clientContact.trim(),
        event_type: eventType,
        status,
        event_date: eventDate,
        event_time: eventTime || undefined,
        venue: venue.trim() || 'Private Venue',
        city: city.trim(),
        qr_duration_hours: qrDurationHours,
        // CamelCase mirrors for maximum client-side compatibility
        clientName: clientName.trim() || 'Private Client',
        clientContact: clientContact.trim(),
        eventType,
        eventDate,
        eventTime: eventTime || undefined,
      };

      await updateEventMutation({
        id: event.id,
        updates: payload,
      });

      showToast(
        'Event Details Saved',
        `Updated details for "${title.trim()}" successfully.`,
        'success'
      );
      onUpdated?.();
      onClose();
    } catch (err: any) {
      showToast(
        'Update Failed',
        err?.message || 'Failed to update event details on server.',
        'error'
      );
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
              <Edit3 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  Event Command Center
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 dark:bg-white/[0.06] text-amber-700 dark:text-amber-300 border border-amber-500/20 dark:border-white/[0.1] flex items-center gap-1">
                  {status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  {status}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight mt-0.5">
                Edit Event Details
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
            {/* Live Status Selector: Live, Upcoming, Completed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <span>Event Status Mode</span>
                </label>
                <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                  Controls live ingestion & guest scanning
                </span>
              </div>
              <div className="p-1.5 rounded-2xl bg-neutral-100/90 dark:bg-[#07080e] border border-neutral-200/80 dark:border-white/[0.06] shadow-inner grid grid-cols-3 gap-1.5">
                {STATUS_OPTIONS.map((st) => {
                  const isSelected = status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`py-2.5 px-3 rounded-xl border text-center transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-xs font-mono capitalize ${
                        isSelected
                          ? st === 'live'
                            ? 'bg-white dark:bg-gradient-to-b dark:from-[#15231c] dark:to-[#0f1914] border-emerald-500/50 text-neutral-900 dark:text-emerald-300 font-bold shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                            : st === 'upcoming'
                            ? 'bg-white dark:bg-gradient-to-b dark:from-[#262015] dark:to-[#17140e] border-amber-500/50 text-neutral-900 dark:text-amber-300 font-bold shadow-md shadow-amber-500/10 ring-1 ring-amber-400/30'
                            : 'bg-white dark:bg-gradient-to-b dark:from-[#1b1c26] dark:to-[#11121a] border-neutral-400/40 text-neutral-900 dark:text-neutral-200 font-bold shadow-md ring-1 ring-neutral-400/30'
                          : 'border-transparent bg-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      {st === 'live' && (
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-neutral-500'}`} />
                      )}
                      {st === 'upcoming' && (
                        <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-neutral-500'}`} />
                      )}
                      {st === 'completed' && (
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`} />
                      )}
                      <span>{st}</span>
                    </button>
                  );
                })}
              </div>
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

            {/* Client / Couple Name & Event Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="atelier-label">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-500" />
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
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    <span>Event Category</span>
                  </span>
                </label>
                <CustomSelect
                  value={eventType}
                  onChange={(val) => setEventType(val as EventType)}
                  options={EVENT_TYPE_OPTIONS}
                />
              </div>
            </div>

            {/* Client Contact Phone/Email */}
            <div className="space-y-1.5">
              <label className="atelier-label">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-500" />
                  <span>Client Contact Info (Phone / Email)</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400 font-normal">Private coordinator record</span>
              </label>
              <div className="atelier-input-wrapper">
                <input
                  type="text"
                  placeholder="e.g. contact@client.com or +1 (555) 234-5678"
                  value={clientContact}
                  onChange={(e) => setClientContact(e.target.value)}
                  className="atelier-input"
                />
              </div>
            </div>

            {/* Date, Time, QR Validity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="atelier-label">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>Shoot Date</span>
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
                    <span>QR Window</span>
                  </span>
                </label>
                <CustomSelect
                  value={qrDurationHours}
                  onChange={(val) => setQrDurationHours(Number(val))}
                  options={QR_DURATION_OPTIONS}
                />
              </div>
            </div>

            {/* Venue & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="atelier-label">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
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
                    placeholder="e.g. Udaipur, Rajasthan"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="atelier-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Sticky Footer */}
          <div className="relative p-4 sm:p-6 pt-4 border-t border-neutral-200 dark:border-white/[0.08] flex items-center justify-end gap-3 shrink-0 bg-neutral-50/80 dark:bg-[#0c0d14]/90 backdrop-blur-md">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl border border-neutral-200/90 dark:border-white/[0.1] hover:bg-neutral-100 dark:hover:bg-white/[0.05] text-neutral-700 dark:text-neutral-300 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.98] text-neutral-950 text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-400/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
