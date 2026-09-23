import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Sparkles,
  QrCode,
  FolderKanban,
  Plus,
  Clock,
  MapPin,
  Camera,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Users,
  Search,
  CheckCircle2,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { useEvent } from '../../context/EventContext';
import { useToast } from '../../components/ui/Toast';
import { CreateEventModal } from '../../components/events/CreateEventModal';
import { EventQRCodeModal } from '../../components/events/EventQRCodeModal';
import { EventPrintStandModal } from '../../components/events/EventPrintStandModal';
import { ChangeBannerModal } from '../../components/events/ChangeBannerModal';
import { MoveToGalleryModal } from '../../components/events/MoveToGalleryModal';
import type { LiveEvent } from '../../types/event';

export const EventsPage: React.FC = () => {
  const {
    events,
    activeLiveEvents,
    upcomingEvents,
    pastEvents,
    deleteEvent,
  } = useEvent();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'past'>('live');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<'live' | 'upcoming'>('live');
  const [qrModalEvent, setQrModalEvent] = useState<LiveEvent | null>(null);
  const [printStandEvent, setPrintStandEvent] = useState<LiveEvent | null>(null);
  const [bannerModalEvent, setBannerModalEvent] = useState<LiveEvent | null>(null);
  const [moveToGalleryEvent, setMoveToGalleryEvent] = useState<LiveEvent | null>(null);

  // Filter events based on active tab and search query
  const filteredEvents = (
    activeTab === 'live'
      ? activeLiveEvents
      : activeTab === 'upcoming'
      ? upcomingEvents
      : pastEvents
  ).filter((evt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      evt.title.toLowerCase().includes(q) ||
      evt.clientName.toLowerCase().includes(q) ||
      evt.venue.toLowerCase().includes(q)
    );
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteEvent(id);
      showToast('Event Deleted', `Removed ${title}.`, 'info');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* ─── Top Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-500 font-bold">
              Live Tethering & Event Engine
            </span>
            {activeLiveEvents.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {activeLiveEvents.length} Active Now
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight mt-1">
            Live & Upcoming Events
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl font-light">
            Capture photos on the fly with instant cloud upload, generate time-expiring guest QR
            codes, and deliver an AI Face Search guest experience.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCreateDefaultStatus('upcoming');
              setIsCreateModalOpen(true);
            }}
            className="py-2.5 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-200 text-xs font-mono font-bold border border-neutral-300 dark:border-neutral-800 transition-all cursor-pointer flex items-center gap-2"
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>+ Upcoming Event</span>
          </button>

          <button
            onClick={() => {
              setCreateDefaultStatus('live');
              setIsCreateModalOpen(true);
            }}
            className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Start Live Event</span>
          </button>
        </div>
      </div>


      {/* ─── Tabs & Search Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('live')}
            className={`py-2 px-4 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'live'
                ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Live Events ({activeLiveEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-2 px-4 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'upcoming'
                ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Upcoming Events ({upcomingEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('past')}
            className={`py-2 px-4 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'past'
                ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Moved to Gallery / Past ({pastEvents.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events, clients, venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>
      </div>

      {/* ─── Events Grid ─── */}
      {filteredEvents.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-[#111218] border border-neutral-200 dark:border-neutral-800/80 rounded-3xl p-8 max-w-lg mx-auto space-y-4">
          <Calendar className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mx-auto stroke-1" />
          <div>
            <h3 className="text-lg font-serif font-bold text-neutral-900 dark:text-white">
              No {activeTab} events found
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {activeTab === 'live'
                ? 'Start a live event when shooting a wedding or party to upload photos in real-time.'
                : activeTab === 'upcoming'
                ? 'Schedule an upcoming shoot or celebration to pre-generate QR stand cards.'
                : 'Events you move into the Studio Drive Gallery will appear here.'}
            </p>
          </div>
          <button
            onClick={() => {
              setCreateDefaultStatus(activeTab === 'upcoming' ? 'upcoming' : 'live');
              setIsCreateModalOpen(true);
            }}
            className="py-2.5 px-5 rounded-xl bg-amber-400 text-neutral-950 text-xs font-mono font-bold hover:bg-amber-300 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{activeTab === 'upcoming' ? 'Add Upcoming Event' : 'Start Live Event'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const isLive = event.status === 'live';
            const isUpcoming = event.status === 'upcoming';
            const isMoved = event.status === 'moved_to_gallery';

            return (
              <div
                key={event.id}
                className="group relative rounded-3xl bg-white dark:bg-[#101117] border border-neutral-200 dark:border-neutral-800/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Banner Thumbnail with Overlays */}
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                  <img
                    src={event.bannerUrl}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

                  {/* Status Tag */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    {isLive && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-neutral-950 flex items-center gap-1.5 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-950 animate-pulse" />
                        LIVE STREAMING
                      </span>
                    )}
                    {isUpcoming && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-neutral-950 flex items-center gap-1.5 shadow-md">
                        <Clock className="w-3 h-3" />
                        UPCOMING
                      </span>
                    )}
                    {isMoved && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-neutral-800 text-neutral-200 border border-neutral-700 flex items-center gap-1.5 shadow-md">
                        <CheckCircle2 className="w-3 h-3 text-amber-400" />
                        IN GALLERY DRIVE
                      </span>
                    )}
                  </div>

                  {/* Top-Right Quick Actions: Change Banner & Delete */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setBannerModalEvent(event)}
                      className="p-1.5 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-all cursor-pointer"
                      title="Change Editorial Banner"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                    </button>
                    <button
                      onClick={() => handleDelete(event.id, event.title)}
                      className="p-1.5 rounded-xl bg-black/60 hover:bg-rose-950/80 text-white hover:text-rose-300 backdrop-blur-md transition-all cursor-pointer"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title & Date on Banner */}
                  <div className="absolute bottom-3 left-3 right-3 text-white space-y-1">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-amber-300 block">
                      {event.eventType} • {event.eventDate}
                    </span>
                    <h3 className="text-lg font-serif font-bold text-white line-clamp-1 leading-snug">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-300 line-clamp-1 font-mono">
                      <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{event.venue}</span>
                    </div>
                  </div>
                </div>

                {/* Card Content & Stats */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  {/* Client & Photo stats */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800 text-center">
                    <div>
                      <span className="text-[9px] font-mono uppercase text-neutral-500 dark:text-neutral-400 block font-medium">
                        Photos
                      </span>
                      <span className="text-sm font-sans font-bold tabular-nums text-neutral-900 dark:text-white">
                        {event.media.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase text-neutral-500 dark:text-neutral-400 block font-medium">
                        QR Scans
                      </span>
                      <span className="text-sm font-sans font-bold tabular-nums text-amber-600 dark:text-amber-500">
                        {event.stats.qrScans}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase text-neutral-500 dark:text-neutral-400 block font-medium">
                        AI Matches
                      </span>
                      <span className="text-sm font-sans font-bold tabular-nums text-emerald-600 dark:text-emerald-500">
                        {event.stats.matchesFound}
                      </span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="space-y-2 pt-1">
                    {/* Primary Button: Open Event Control Room */}
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/dashboard/events/${event.id}`}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-400" />
                        <span>Manage & Live Feed</span>
                      </Link>

                      {/* QR Modal Trigger */}
                      <button
                        onClick={() => setQrModalEvent(event)}
                        className="py-2.5 px-3 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-600 dark:text-amber-500 border border-amber-500/30 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        title="View & Configure QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR</span>
                      </button>
                    </div>

                    {/* Secondary Actions: Move to Gallery & Guest Link Preview */}
                    <div className="flex items-center justify-between text-xs font-mono pt-1 text-neutral-600 dark:text-neutral-400">
                      {!isMoved ? (
                        <button
                          onClick={() => setMoveToGalleryEvent(event)}
                          className="text-amber-600 dark:text-amber-500 hover:text-amber-500 dark:hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Move to Gallery</span>
                        </button>
                      ) : (
                        <Link
                          to={`/dashboard/drive/${event.associatedGalleryId || 'gal-lake-como'}`}
                          className="text-emerald-600 dark:text-emerald-500 hover:underline flex items-center gap-1 font-medium"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>View in Drive</span>
                        </Link>
                      )}

                      <Link
                        to={`/events/${event.id}`}
                        target="_blank"
                        className="hover:text-neutral-900 dark:hover:text-white text-neutral-600 dark:text-neutral-400 flex items-center gap-1 transition-colors"
                        title="Open guest scanning template"
                      >
                        <span>Guest View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
          isOpen={!!qrModalEvent}
          onClose={() => setQrModalEvent(null)}
          event={qrModalEvent}
          onOpenPrintStand={() => setPrintStandEvent(qrModalEvent)}
        />
      )}

      {printStandEvent && (
        <EventPrintStandModal
          isOpen={!!printStandEvent}
          onClose={() => setPrintStandEvent(null)}
          event={printStandEvent}
        />
      )}

      {bannerModalEvent && (
        <ChangeBannerModal
          isOpen={!!bannerModalEvent}
          onClose={() => setBannerModalEvent(null)}
          event={bannerModalEvent}
        />
      )}

      {moveToGalleryEvent && (
        <MoveToGalleryModal
          isOpen={!!moveToGalleryEvent}
          onClose={() => setMoveToGalleryEvent(null)}
          event={moveToGalleryEvent}
        />
      )}
    </div>
  );
};
