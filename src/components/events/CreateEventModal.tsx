import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  Sparkles,
  Camera,
  MapPin,
  Clock,
  User,
  Radio,
  Image as ImageIcon,
  ArrowRight,
} from 'lucide-react';
import type { EventType, EventStatus } from '../../types/event';
import { CURATED_EVENT_BANNERS, getExpiryDateHoursAhead } from '../../data/eventData';
import { useEvent } from '../../context/EventContext';
import { useToast } from '../ui/Toast';
import { useNavigate } from 'react-router-dom';

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

  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [status, setStatus] = useState<EventStatus>(defaultStatus);
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState('18:00');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [selectedBanner, setSelectedBanner] = useState(CURATED_EVENT_BANNERS[0].url);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Title Required', 'Please provide a name for the event.', 'error');
      return;
    }

    const expiresAt = getExpiryDateHoursAhead(qrDurationHours);

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
        expiresAt,
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
    navigate(`/dashboard/events/${newEvent.id}`);
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
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as EventType)}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400 transition-colors"
                >
                  <option value="wedding">Wedding Celebration</option>
                  <option value="reception">Reception / Sangeet</option>
                  <option value="gala">VIP Gala / Soirée</option>
                  <option value="fashion">Haute Couture Fashion Show</option>
                  <option value="birthday">Birthday / Anniversary</option>
                  <option value="corporate">Corporate Summit</option>
                  <option value="concert">Concert / Performance</option>
                  <option value="other">Bespoke Special Event</option>
                </select>
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
                <select
                  value={qrDurationHours}
                  onChange={(e) => setQrDurationHours(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400 transition-colors"
                >
                  <option value={2}>2 Hours</option>
                  <option value={4}>4 Hours (Standard)</option>
                  <option value={8}>8 Hours</option>
                  <option value={24}>24 Hours (Full Day)</option>
                </select>
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

            {/* Choose Editorial Banner Preset */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-neutral-700 dark:text-neutral-300 font-semibold flex items-center justify-between">
                <span>Select Editorial Banner Preset</span>
                <span className="text-[11px] text-neutral-500 font-normal">
                  Can be updated anytime
                </span>
              </label>

              <div className="grid grid-cols-3 gap-2.5">
                {CURATED_EVENT_BANNERS.slice(0, 3).map((preset) => {
                  const isSelected = selectedBanner === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedBanner(preset.url)}
                      className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 ring-2 ring-amber-400/50'
                          : 'border-neutral-200 dark:border-neutral-800 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <span className="absolute bottom-1.5 left-2 right-2 text-[10px] font-mono text-white truncate text-left">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
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
    </div>,
    document.body
  );
};
