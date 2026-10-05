import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Images,
  Calendar,
  CreditCard,
  Cloud,
  BarChart3,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Sliders,
  Check,
  X,
  Volume2,
  VolumeX,
  RotateCcw,
} from 'lucide-react';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
  type StudioNotificationSettings,
} from '@/service/notifications';

interface SwitchToggleProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}

const SwitchToggle: React.FC<SwitchToggleProps> = ({
  id,
  checked,
  onChange,
  disabled = false,
  label,
}) => {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#121319] ${
        checked ? 'bg-amber-400' : 'bg-neutral-200 dark:bg-neutral-800'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-neutral-950 shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

interface NotificationCardProps {
  id: string;
  title: string;
  description: string;
  channel: 'email' | 'inapp';
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  id,
  title,
  description,
  channel,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <div
      onClick={() => !disabled && onChange()}
      className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start justify-between gap-4 select-none ${
        checked
          ? 'bg-white dark:bg-neutral-900/90 border-neutral-300/80 dark:border-neutral-700/80 shadow-xs hover:border-amber-400/50 dark:hover:border-amber-400/50 hover:shadow-md'
          : 'bg-neutral-50/70 dark:bg-neutral-950/60 border-neutral-200/80 dark:border-neutral-800/80 opacity-75 hover:opacity-100 hover:border-neutral-300 dark:hover:border-neutral-700'
      }`}
    >
      <div className="space-y-1.5 pr-2 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wide uppercase ${
              channel === 'email'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}
          >
            {channel === 'email' ? <Mail className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
            {channel === 'email' ? 'EMAIL' : 'IN-APP'}
          </span>
          <p className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white leading-snug">
            {title}
          </p>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
        <SwitchToggle
          id={id}
          label={title}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export const NotificationSettingsSection: React.FC = () => {
  const { data: serverSettings, isLoading, isError, refetch, isFetching } =
    useNotificationSettings();
  const { mutate: updateSettings, isPending: isSaving } =
    useUpdateNotificationSettings();

  const [formState, setFormState] = useState<StudioNotificationSettings>({
    email_inquiries: true,
    inapp_inquiries: true,
    email_gallery_visited: true,
    email_gallery_download: true,
    inapp_gallery_activity: true,
    email_event_activity: true,
    inapp_event_activity: true,
    email_billing_alerts: true,
    inapp_billing_alerts: true,
    email_storage_warnings: true,
    inapp_storage_warnings: true,
    email_weekly_digest: true,
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Sync form state when backend data arrives
  useEffect(() => {
    if (serverSettings) {
      setFormState({
        email_inquiries: serverSettings.email_inquiries ?? true,
        inapp_inquiries: serverSettings.inapp_inquiries ?? true,
        email_gallery_visited: serverSettings.email_gallery_visited ?? true,
        email_gallery_download: serverSettings.email_gallery_download ?? true,
        inapp_gallery_activity: serverSettings.inapp_gallery_activity ?? true,
        email_event_activity: serverSettings.email_event_activity ?? true,
        inapp_event_activity: serverSettings.inapp_event_activity ?? true,
        email_billing_alerts: serverSettings.email_billing_alerts ?? true,
        inapp_billing_alerts: serverSettings.inapp_billing_alerts ?? true,
        email_storage_warnings: serverSettings.email_storage_warnings ?? true,
        inapp_storage_warnings: serverSettings.inapp_storage_warnings ?? true,
        email_weekly_digest: serverSettings.email_weekly_digest ?? true,
      });
      setHasChanges(false);
    }
  }, [serverSettings]);

  const handleToggle = (key: keyof StudioNotificationSettings) => {
    setFormState((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setHasChanges(true);
      return next;
    });
  };

  const handleSave = () => {
    updateSettings(formState, {
      onSuccess: () => {
        setHasChanges(false);
      },
    });
  };

  const handleDiscard = () => {
    if (serverSettings) {
      setFormState({
        email_inquiries: serverSettings.email_inquiries ?? true,
        inapp_inquiries: serverSettings.inapp_inquiries ?? true,
        email_gallery_visited: serverSettings.email_gallery_visited ?? true,
        email_gallery_download: serverSettings.email_gallery_download ?? true,
        inapp_gallery_activity: serverSettings.inapp_gallery_activity ?? true,
        email_event_activity: serverSettings.email_event_activity ?? true,
        inapp_event_activity: serverSettings.inapp_event_activity ?? true,
        email_billing_alerts: serverSettings.email_billing_alerts ?? true,
        inapp_billing_alerts: serverSettings.inapp_billing_alerts ?? true,
        email_storage_warnings: serverSettings.email_storage_warnings ?? true,
        inapp_storage_warnings: serverSettings.inapp_storage_warnings ?? true,
        email_weekly_digest: serverSettings.email_weekly_digest ?? true,
      });
      setHasChanges(false);
    }
  };

  const handleEnableAll = () => {
    setFormState({
      email_inquiries: true,
      inapp_inquiries: true,
      email_gallery_visited: true,
      email_gallery_download: true,
      inapp_gallery_activity: true,
      email_event_activity: true,
      inapp_event_activity: true,
      email_billing_alerts: true,
      inapp_billing_alerts: true,
      email_storage_warnings: true,
      inapp_storage_warnings: true,
      email_weekly_digest: true,
    });
    setHasChanges(true);
  };

  const handleMuteAll = () => {
    setFormState({
      email_inquiries: false,
      inapp_inquiries: false,
      email_gallery_visited: false,
      email_gallery_download: false,
      inapp_gallery_activity: false,
      email_event_activity: false,
      inapp_event_activity: false,
      email_billing_alerts: false,
      inapp_billing_alerts: false,
      email_storage_warnings: false,
      inapp_storage_warnings: false,
      email_weekly_digest: false,
    });
    setHasChanges(true);
  };

  const handleResetDefaults = () => {
    const defaults: StudioNotificationSettings = {
      email_inquiries: true,
      inapp_inquiries: true,
      email_gallery_visited: true,
      email_gallery_download: true,
      inapp_gallery_activity: true,
      email_event_activity: true,
      inapp_event_activity: true,
      email_billing_alerts: true,
      inapp_billing_alerts: true,
      email_storage_warnings: true,
      inapp_storage_warnings: true,
      email_weekly_digest: true,
    };
    setFormState(defaults);
    setHasChanges(true);
  };

  // Metrics counts
  const totalCount = 12;
  const activeCount = Object.values(formState).filter((v) => typeof v === 'boolean' && v).length;
  const emailActiveCount = [
    formState.email_inquiries,
    formState.email_gallery_visited,
    formState.email_gallery_download,
    formState.email_event_activity,
    formState.email_billing_alerts,
    formState.email_storage_warnings,
    formState.email_weekly_digest,
  ].filter(Boolean).length;
  const inAppActiveCount = [
    formState.inapp_inquiries,
    formState.inapp_gallery_activity,
    formState.inapp_event_activity,
    formState.inapp_billing_alerts,
    formState.inapp_storage_warnings,
  ].filter(Boolean).length;

  // Fallback 1: Loading Skeleton
  if (isLoading) {
    return (
      <div className="w-full space-y-6 fade-up">
        <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/80 shadow-sm space-y-8">
          <div className="flex items-center justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800">
            <div className="space-y-2">
              <div className="h-6 w-64 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
              <div className="h-4 w-96 bg-neutral-100 dark:bg-neutral-800/60 rounded-lg animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between"
              >
                <div className="space-y-2">
                  <div className="h-4 w-44 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                  <div className="h-3 w-64 bg-neutral-100 dark:bg-neutral-800/60 rounded animate-pulse" />
                </div>
                <div className="h-6 w-11 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Fallback 2: Error State with Retry
  if (isError) {
    return (
      <div className="w-full space-y-6 fade-up">
        <div className="p-10 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-lg font-bold text-neutral-900 dark:text-white">
              Unable to Load Notification Preferences
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              There was a connection issue loading your preferences from the studio server.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs uppercase tracking-wider hover:opacity-90 cursor-pointer shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 fade-up">
      {/* Main Full-Width Notification Container */}
      <div className="p-6 sm:p-8 lg:p-10 rounded-3xl bg-white dark:bg-[#121319]/95 border border-neutral-200 dark:border-neutral-800/80 shadow-sm dark:shadow-2xl space-y-8">
        
        {/* 1. Header Bar with Realtime Sync Status & Immediate Save */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-neutral-100 dark:border-neutral-800/80">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-500 flex items-center justify-center shrink-0 shadow-xs">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
                  Studio Notification Preferences
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Control which alerts reach your email inbox and studio in-app notification center.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
            {hasChanges && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-600 dark:text-amber-400 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Unsaved Changes
              </span>
            )}

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh from studio server"
              className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-850 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-amber-500' : ''}`} />
            </button>

            {hasChanges && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/15 cursor-pointer active:scale-95"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 2. Interactive Channels Summary & Batch Toggles Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/70 border border-neutral-200 dark:border-neutral-850">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Delivery Channels:
            </span>

            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium text-xs">
              <Mail className="w-3.5 h-3.5" />
              <span>Email Delivery: <strong>{emailActiveCount} of 7 active</strong></span>
            </span>

            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium text-xs">
              <Bell className="w-3.5 h-3.5" />
              <span>Studio Bell: <strong>{inAppActiveCount} of 5 active</strong></span>
            </span>

            <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500 hidden sm:inline">
              ({activeCount} of {totalCount} total alerts enabled)
            </span>
          </div>

          {/* Batch Quick Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleEnableAll}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Enable All</span>
            </button>

            <button
              type="button"
              onClick={handleMuteAll}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              <VolumeX className="w-3.5 h-3.5 text-rose-500" />
              <span>Mute All</span>
            </button>
          </div>
        </div>

        {/* 3. Notification Groups in Two-Column Grid Layout */}
        <div className="space-y-8">
          
          {/* GROUP 1: Client Inquiries & Booking Leads */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
                  Client Inquiries & Booking Leads
                </h4>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                {[formState.email_inquiries, formState.inapp_inquiries].filter(Boolean).length} / 2 Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NotificationCard
                id="toggle-email-inquiries"
                channel="email"
                title="New Client Inquiry Email"
                description="Receive an immediate email alert when a client fills out your studio contact form."
                checked={formState.email_inquiries}
                onChange={() => handleToggle('email_inquiries')}
                disabled={isSaving}
              />

              <NotificationCard
                id="toggle-inapp-inquiries"
                channel="inapp"
                title="In-App Studio Inquiry Notification"
                description="Display badge notifications and cards in the top header bell for new inquiries."
                checked={formState.inapp_inquiries}
                onChange={() => handleToggle('inapp_inquiries')}
                disabled={isSaving}
              />
            </div>
          </div>

          {/* GROUP 2: Galleries & Client Activity */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                  <Images className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
                  Galleries & Client Activity
                </h4>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                {[formState.email_gallery_visited, formState.email_gallery_download, formState.inapp_gallery_activity].filter(Boolean).length} / 3 Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NotificationCard
                id="toggle-gallery-visited"
                channel="email"
                title="Client Gallery First Unlock"
                description="Notify me when a client enters their PIN and accesses their private collection."
                checked={formState.email_gallery_visited}
                onChange={() => handleToggle('email_gallery_visited')}
                disabled={isSaving}
              />

              <NotificationCard
                id="toggle-gallery-download"
                channel="email"
                title="Full Gallery ZIP Download Started"
                description="Alert me when a client triggers high-res archive packaging and download."
                checked={formState.email_gallery_download}
                onChange={() => handleToggle('email_gallery_download')}
                disabled={isSaving}
              />

              <NotificationCard
                id="toggle-inapp-gallery"
                channel="inapp"
                title="Gallery Publication & Client Activity"
                description="Push in-app notification when collections are published or favorites marked."
                checked={formState.inapp_gallery_activity}
                onChange={() => handleToggle('inapp_gallery_activity')}
                disabled={isSaving}
              />

              {/* Informative Studio Companion Card */}
              <div className="p-4 sm:p-5 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-950/30 flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                    Live Client View Telemetry
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Client impressions and proofing selections sync automatically with your Studio Analytics dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* GROUP 3: Live Events & Guest Streams */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
                  Live Events & Guest Sharing
                </h4>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                {[formState.inapp_event_activity, formState.email_event_activity].filter(Boolean).length} / 2 Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NotificationCard
                id="toggle-inapp-events"
                channel="inapp"
                title="Live Event Guest Uploads & Activity"
                description="Stream guest photo uploads and QR interactions to your studio bell in real time."
                checked={formState.inapp_event_activity}
                onChange={() => handleToggle('inapp_event_activity')}
                disabled={isSaving}
              />

              <NotificationCard
                id="toggle-email-events"
                channel="email"
                title="Event Milestone & Guest Attendance Digest"
                description="Receive an email overview when guest selfie matches and attendance cross major thresholds."
                checked={formState.email_event_activity}
                onChange={() => handleToggle('email_event_activity')}
                disabled={isSaving}
              />
            </div>
          </div>

          {/* GROUP 4: Subscription & Billing */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
                  Subscription & Auto-Renewal Billing
                </h4>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                {[formState.email_billing_alerts, formState.inapp_billing_alerts].filter(Boolean).length} / 2 Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NotificationCard
                id="toggle-email-billing"
                channel="email"
                title="Billing Receipts & Renewal Invoices"
                description="Receive payment receipts, auto-renewal invoices, and cancellation notices directly in your inbox."
                checked={formState.email_billing_alerts}
                onChange={() => handleToggle('email_billing_alerts')}
                disabled={isSaving}
              />

              <NotificationCard
                id="toggle-inapp-billing"
                channel="inapp"
                title="In-App Membership & Auto-Pay Alerts"
                description="Show membership activation notices, renewal confirmations, and cycle expiration banners."
                checked={formState.inapp_billing_alerts}
                onChange={() => handleToggle('inapp_billing_alerts')}
                disabled={isSaving}
              />
            </div>
          </div>

          {/* GROUP 5: Storage & Cloud Quotas */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
                  <Cloud className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
                  Cloud Storage & Capacity Warnings
                </h4>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                {[formState.email_storage_warnings, formState.inapp_storage_warnings].filter(Boolean).length} / 2 Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NotificationCard
                id="toggle-email-storage"
                channel="email"
                title="Email Storage Quota Warnings"
                description="Send critical alerts to your email when studio vault storage crosses 85% or 95% capacity."
                checked={formState.email_storage_warnings}
                onChange={() => handleToggle('email_storage_warnings')}
                disabled={isSaving}
              />

              <NotificationCard
                id="toggle-inapp-storage"
                channel="inapp"
                title="In-App Storage Warning Banners"
                description="Display urgent warning banners in the studio notification tray when low on disk space."
                checked={formState.inapp_storage_warnings}
                onChange={() => handleToggle('inapp_storage_warnings')}
                disabled={isSaving}
              />
            </div>
          </div>

          {/* GROUP 6: Studio Analytics & Weekly Digest */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
                  Studio Analytics & Weekly Digest
                </h4>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                {formState.email_weekly_digest ? '1 / 1 Active' : '0 / 1 Active'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NotificationCard
                id="toggle-weekly-digest"
                channel="email"
                title="Weekly Studio Performance Summary"
                description="Receive a Monday morning digest of total gallery views, client downloads, and new inquiries."
                checked={formState.email_weekly_digest}
                onChange={() => handleToggle('email_weekly_digest')}
                disabled={isSaving}
              />

              <div className="p-4 sm:p-5 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-950/30 flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                    Scheduled Delivery
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Sent automatically every Monday at 09:00 AM in your studio's local timezone.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 4. Bottom Footer Actions Bar */}
        <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={isSaving}
            className="inline-flex items-center gap-2 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Recommended Defaults</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {hasChanges && (
              <button
                type="button"
                onClick={handleDiscard}
                disabled={isSaving}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Discard Changes
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md ${
                hasChanges
                  ? 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-amber-400/20 cursor-pointer scale-[1.02]'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed shadow-none'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                  <span>Saving to Studio Server...</span>
                </>
              ) : hasChanges ? (
                <>
                  <Sparkles className="w-4 h-4 text-neutral-950" />
                  <span>Save Notification Preferences</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Preferences Up to Date</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* 5. Floating Bottom Bar when Unsaved Changes Exist */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] sm:w-auto p-3.5 px-5 rounded-2xl bg-neutral-900/95 dark:bg-[#121319]/95 text-white border border-amber-400/40 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold text-neutral-200">
              You have unsaved changes
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Discard
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer active:scale-95"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
              <span>Save</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
