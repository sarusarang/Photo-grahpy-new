import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getInquiries,
  getInquiryAnalytics,
  updateInquiryStatus,
  deleteInquiry,
  subscribeInquiries,
} from '../../services/inquiryService';
import type { PortfolioInquiry, InquiryStatus, InquiryEventType } from '../../types/inquiry';
import { useToast } from '../../components/ui/Toast';
import {
  MessageSquare,
  Search,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Tag,
  CheckCircle2,
  Clock,
  Archive,
  Trash2,
  ExternalLink,
  MessageCircle,
  Filter,
  Sparkles,
  ArrowUpRight,
  ChevronDown,
  User,
  DollarSign,
  AlertCircle,
  Users,
  CalendarCheck,
  TrendingUp,
  Check,
} from 'lucide-react';

/* ─── STATUS CONFIG & CUSTOM DROPDOWN ─── */
const STATUS_CONFIG: Record<
  InquiryStatus,
  {
    label: string;
    pillBg: string;
    dotBg: string;
    textColor: string;
    borderColor: string;
  }
> = {
  new: {
    label: 'New Lead',
    pillBg: 'bg-purple-500/15 hover:bg-purple-500/25',
    dotBg: 'bg-purple-500 shadow-xs shadow-purple-500/50',
    textColor: 'text-purple-600 dark:text-purple-300',
    borderColor: 'border-purple-500/30 dark:border-purple-500/40',
  },
  contacted: {
    label: 'In Discussion',
    pillBg: 'bg-amber-500/15 hover:bg-amber-500/25',
    dotBg: 'bg-amber-500 shadow-xs shadow-amber-500/50',
    textColor: 'text-amber-600 dark:text-amber-300',
    borderColor: 'border-amber-500/30 dark:border-amber-500/40',
  },
  booked: {
    label: 'Confirmed Booked',
    pillBg: 'bg-emerald-500/15 hover:bg-emerald-500/25',
    dotBg: 'bg-emerald-500 shadow-xs shadow-emerald-500/50',
    textColor: 'text-emerald-600 dark:text-emerald-300',
    borderColor: 'border-emerald-500/30 dark:border-emerald-500/40',
  },
  archived: {
    label: 'Archived',
    pillBg: 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-800',
    dotBg: 'bg-neutral-400',
    textColor: 'text-neutral-600 dark:text-neutral-400',
    borderColor: 'border-neutral-300 dark:border-neutral-700',
  },
};

const InquiryStatusDropdown: React.FC<{
  status: InquiryStatus;
  onChange: (status: InquiryStatus) => void;
}> = ({ status, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = STATUS_CONFIG[status] || STATUS_CONFIG.new;

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const options: InquiryStatus[] = ['new', 'contacted', 'booked', 'archived'];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all flex items-center gap-2 select-none shadow-xs ${current.pillBg} ${current.borderColor} ${current.textColor}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className={`w-2 h-2 rounded-full ${current.dotBg} shrink-0`} />
        <span>{current.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 opacity-70 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white dark:bg-[#161822] border border-neutral-200 dark:border-neutral-800/90 shadow-2xl shadow-black/25 dark:shadow-black/70 p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-mono">
            Update Status
          </div>
          <div className="space-y-0.5">
            {options.map((opt) => {
              const cfg = STATUS_CONFIG[opt];
              const isSelected = opt === status;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-900 dark:text-white font-semibold'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${cfg.dotBg} shrink-0`} />
                    <span className="truncate">{cfg.label}</span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-amber-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── EVENT TYPE CUSTOM DROPDOWN ─── */
const EVENT_TYPES: { id: InquiryEventType | 'all'; label: string }[] = [
  { id: 'all', label: 'All Events' },
  { id: 'wedding', label: 'Weddings' },
  { id: 'pre-wedding', label: 'Pre-Wedding' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'maternity', label: 'Maternity' },
  { id: 'portrait', label: 'Portrait' },
];

const EventTypeDropdown: React.FC<{
  value: InquiryEventType | 'all';
  onChange: (val: InquiryEventType | 'all') => void;
}> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const currentLabel = EVENT_TYPES.find((t) => t.id === value)?.label || 'All Events';

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 cursor-pointer transition-all shadow-xs"
      >
        <span>{currentLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-white dark:bg-[#161822] border border-neutral-200 dark:border-neutral-800/90 shadow-2xl shadow-black/25 dark:shadow-black/70 p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
          <div className="space-y-0.5">
            {EVENT_TYPES.map((t) => {
              const isSelected = t.id === value;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onChange(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-900 dark:text-white font-semibold'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  <span>{t.label}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-amber-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const InquiriesPage: React.FC = () => {
  const { photographer, user } = useAuth();
  const { showToast } = useToast();

  const [inquiries, setInquiries] = useState<PortfolioInquiry[]>(() => getInquiries());
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<InquiryEventType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Subscribe to real-time changes
  useEffect(() => {
    const unsubscribe = subscribeInquiries((updated) => {
      setInquiries(updated);
    });
    return unsubscribe;
  }, []);

  const stats = useMemo(() => getInquiryAnalytics(inquiries), [inquiries]);

  // Filter inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      // 1. Status filter
      if (statusFilter !== 'all' && inq.status !== statusFilter) return false;

      // 2. Type filter
      if (typeFilter !== 'all' && inq.eventType !== typeFilter) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = inq.clientName.toLowerCase().includes(q);
        const matchEmail = inq.clientEmail.toLowerCase().includes(q);
        const matchPhone = inq.clientPhone?.toLowerCase().includes(q);
        const matchLoc = inq.location?.toLowerCase().includes(q);
        const matchMsg = inq.message.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchLoc && !matchMsg) return false;
      }

      return true;
    });
  }, [inquiries, statusFilter, typeFilter, searchQuery]);

  const handleStatusChange = (id: string, newStatus: InquiryStatus) => {
    const updated = updateInquiryStatus(id, newStatus);
    if (updated) {
      showToast(`Inquiry marked as ${newStatus}`, 'success');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to remove this client inquiry?')) {
      const ok = deleteInquiry(id);
      if (ok) {
        showToast('Inquiry removed', 'info');
      }
    }
  };

  const portfolioId = user?.username || photographer.id || 'studio';

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 space-y-7 transition-colors">
      {/* ─── 1. HEADER SECTION ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Client Inquiries & Booking Pipeline
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 text-xs font-mono font-bold">
              {stats.totalInquiries} Leads
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Prospective couples and commercial clients who inquired through your public portfolio.
          </p>
        </div>

        {/* View Live Portfolio Link */}
        <Link
          to={`/portfolio/${portfolioId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-amber-400 dark:hover:border-amber-400 text-neutral-800 dark:text-neutral-200 hover:text-amber-500 text-xs font-semibold flex items-center gap-2 transition-all shrink-0 shadow-xs"
        >
          <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
          <span>View Public Portfolio</span>
        </Link>
      </div>

      {/* ─── 2. PIPELINE METRIC BADGES (5 KEY METRICS) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Total Leads */}
        <div className="group p-5 rounded-2xl bg-white dark:bg-[#13141b]/95 border border-neutral-200 dark:border-neutral-800/80 shadow-xs hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700/80 transition-all relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Total Leads
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center transition-transform group-hover:scale-110 duration-200">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white font-mono tracking-tight block">
              {stats.totalInquiries}
            </span>
            <span className="text-[11px] text-neutral-500 mt-1 block font-medium">Received to date</span>
          </div>
        </div>

        {/* Card 2: New Leads */}
        <div className="group p-5 rounded-2xl bg-white dark:bg-[#13141b]/95 border border-purple-500/30 shadow-xs hover:shadow-md hover:border-purple-500/50 bg-gradient-to-br from-purple-500/5 to-transparent transition-all relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/20 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              New Leads
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 flex items-center justify-center transition-transform group-hover:scale-110 duration-200 relative">
              <Sparkles className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-white dark:ring-[#13141b] animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-white dark:ring-[#13141b]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-300 font-mono tracking-tight block">
              {stats.newLeads}
            </span>
            <span className="text-[11px] text-neutral-500 mt-1 block font-medium">Awaiting response</span>
          </div>
        </div>

        {/* Card 3: In Discussion */}
        <div className="group p-5 rounded-2xl bg-white dark:bg-[#13141b]/95 border border-amber-500/30 shadow-xs hover:shadow-md hover:border-amber-500/50 bg-gradient-to-br from-amber-500/5 to-transparent transition-all relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              In Discussion
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center transition-transform group-hover:scale-110 duration-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-amber-500 dark:text-amber-400 font-mono tracking-tight block">
              {stats.inDiscussion}
            </span>
            <span className="text-[11px] text-neutral-500 mt-1 block font-medium">Quote / proposal sent</span>
          </div>
        </div>

        {/* Card 4: Confirmed Bookings */}
        <div className="group p-5 rounded-2xl bg-white dark:bg-[#13141b]/95 border border-emerald-500/30 shadow-xs hover:shadow-md hover:border-emerald-500/50 bg-gradient-to-br from-emerald-500/5 to-transparent transition-all relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Confirmed Bookings
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center justify-center transition-transform group-hover:scale-110 duration-200">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-300 font-mono tracking-tight block">
              {stats.bookedCount}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block font-semibold">
              {stats.conversionRate}% Conversion
            </span>
          </div>
        </div>

        {/* Card 5: Pipeline Value */}
        <div className="col-span-2 sm:col-span-1 lg:col-span-1 group p-5 rounded-2xl bg-white dark:bg-[#13141b]/95 border border-amber-500/30 shadow-xs hover:shadow-md hover:border-amber-500/50 bg-gradient-to-br from-amber-500/5 to-transparent transition-all relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pipeline Value
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center transition-transform group-hover:scale-110 duration-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white font-mono tracking-tight block">
              ₹{(stats.estimatedPipelineValue / 100000).toFixed(1)}L
            </span>
            <span className="text-[11px] text-neutral-500 mt-1 block font-medium">Estimated potential</span>
          </div>
        </div>
      </div>

      {/* ─── 3. SEARCH & STATUS FILTER TOOLBAR ─── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#13141b]/95 border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        {/* Status Segmented Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Inquiries', count: inquiries.length },
            { id: 'new', label: 'New', count: stats.newLeads },
            { id: 'contacted', label: 'In Discussion', count: stats.inDiscussion },
            { id: 'booked', label: 'Booked', count: stats.bookedCount },
            { id: 'archived', label: 'Archived', count: stats.archivedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as InquiryStatus | 'all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-neutral-900 dark:bg-amber-400 text-white dark:text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                statusFilter === tab.id
                  ? 'bg-white/20 dark:bg-neutral-950/20 text-white dark:text-neutral-950 font-bold'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Event Type Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client, city, or event..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <EventTypeDropdown value={typeFilter} onChange={setTypeFilter} />
        </div>
      </div>

      {/* ─── 4. INQUIRIES LIST / CARDS ─── */}
      <div className="space-y-4">
        {filteredInquiries.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#13141b]/95 border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-400 mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              No Client Inquiries Found
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search query or status filter.'
                : 'Share your public portfolio link to start receiving client wedding commissions.'}
            </p>
          </div>
        ) : (
          filteredInquiries.map((inq) => (
            <div
              key={inq.id}
              className={`p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#13141b]/95 border transition-all space-y-4 shadow-xs ${
                inq.status === 'new'
                  ? 'border-purple-500/50 shadow-purple-500/5 ring-1 ring-purple-500/20'
                  : 'border-neutral-200 dark:border-neutral-800/90 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              {/* Top Row: Client & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-400/30 text-amber-500 font-bold text-sm flex items-center justify-center shrink-0 uppercase font-mono shadow-xs">
                    {inq.clientName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight truncate">
                      {inq.clientName}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                      <span>Submitted {new Date(inq.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span>•</span>
                      <span className="font-medium text-neutral-700 dark:text-neutral-300 capitalize">{inq.eventType}</span>
                    </p>
                  </div>
                </div>

                {/* Status Switcher Segment (Custom Modern Dropdown) */}
                <div className="flex items-center gap-2 shrink-0">
                  <InquiryStatusDropdown
                    status={inq.status}
                    onChange={(newStatus) => handleStatusChange(inq.id, newStatus)}
                  />

                  <button
                    onClick={() => handleDelete(inq.id)}
                    className="p-2 rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                    title="Delete inquiry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Middle Row: Event Details Strip */}
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/70 border border-neutral-200/70 dark:border-neutral-800/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Event Date
                  </span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>{inq.eventDate}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Destination / Venue
                  </span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 mt-0.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{inq.location || 'Undisclosed'}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Target Budget
                  </span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 mt-0.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{inq.budget || 'Custom'}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Contact Phone
                  </span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                    <span>{inq.clientPhone || 'None provided'}</span>
                  </span>
                </div>
              </div>

              {/* Message / Vision */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  Client Message
                </span>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed bg-neutral-50/50 dark:bg-neutral-900/40 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/50">
                  "{inq.message}"
                </p>
              </div>

              {/* Bottom Row: Communication Triggers */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${inq.clientEmail}?subject=Photography Commission Inquiry - ${photographer.studioName || 'Studio'}&body=Dear ${inq.clientName},%0D%0A%0D%0AThank you for reaching out regarding your ${inq.eventType} on ${inq.eventDate}.`}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Reply via Email</span>
                  </a>

                  {inq.clientPhone && (
                    <a
                      href={`https://wa.me/${inq.clientPhone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(inq.clientName)},%20thank%20you%20for%20your%20inquiry%20regarding%20photography%20for%20your%20${encodeURIComponent(inq.eventType)}!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Client</span>
                    </a>
                  )}

                  {inq.clientPhone && (
                    <a
                      href={`tel:${inq.clientPhone}`}
                      className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                  )}
                </div>

                <span className="text-[11px] font-mono text-neutral-400">
                  Client: {inq.clientEmail}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
