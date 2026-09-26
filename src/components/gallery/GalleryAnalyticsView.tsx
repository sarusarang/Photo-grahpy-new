import React, { useState, useMemo } from 'react';
import type { Gallery } from '../../types';
import type { GalleryAnalyticsData } from '../../types/analytics';
import { useGalleryAnalytics, useTrackGalleryActivity } from '@/hooks/useAtelierQueries';
import { ExportGalleryAnalyticsCsvApi } from '@/service/galleries/GalleryApi';
import { normalizeServerGalleryAnalytics } from '@/utils/galleryNormalizer';
import { useToast } from '../ui/Toast';
import { AnalyticsSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Eye,
  Users,
  Download,
  Heart,
  Clock,
  Sparkles,
  Smartphone,
  Monitor,
  Tablet,
  Share2,
  FileSpreadsheet,
  Zap,
  ShieldCheck,
  Globe,
  Loader2,
  RefreshCw,
  BarChart3,
} from 'lucide-react';

interface GalleryAnalyticsViewProps {
  gallery: Gallery;
  onOpenLightbox?: (index: number) => void;
}

export const GalleryAnalyticsView: React.FC<GalleryAnalyticsViewProps> = ({
  gallery,
}) => {
  const { showToast } = useToast();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [isExporting, setIsExporting] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Pure Server Query Hook (Zero Mock Fallback)
  const {
    data: serverAnalytics,
    isLoading: isLoadingServerAnalytics,
    isError: isAnalyticsError,
    refetch,
    isFetching,
  } = useGalleryAnalytics(gallery.id, timeRange);

  const { mutateAsync: trackEventMutation, isPending: isSimulating } = useTrackGalleryActivity();

  // Normalized Server Telemetry Data
  const analytics: GalleryAnalyticsData | null = useMemo(() => {
    if (!serverAnalytics) return null;
    try {
      return normalizeServerGalleryAnalytics(serverAnalytics, gallery.id);
    } catch {
      return null;
    }
  }, [serverAnalytics, gallery.id]);

  // Handle Real Telemetry Ping / Visitor Verification
  const handleRecordTestPing = async () => {
    try {
      await trackEventMutation({
        galleryId: gallery.id,
        type: 'view',
        device: 'mobile',
        details: 'Photographer live studio ping test',
      });
      await refetch();
      showToast(
        'Live Ping Dispatched',
        'Recorded view event directly to server analytics stream.',
        'success'
      );
    } catch {
      showToast('Ping Failed', 'Unable to record live event to server.', 'error');
    }
  };

  // Handle Export CSV directly from Django DRF Backend
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const blob = await ExportGalleryAnalyticsCsvApi(gallery.id, timeRange);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_${gallery.slug || gallery.id}_${timeRange}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Report Exported', 'Downloaded gallery analytics CSV file.', 'info');
    } catch {
      showToast('Export Failed', 'Could not export analytics CSV from server.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Find max views in timeline for scale
  const maxTimelineViews = useMemo(() => {
    if (!analytics || !analytics.timeline.length) return 10;
    return Math.max(...analytics.timeline.map((d) => d.views), 10);
  }, [analytics]);

  // 1. Loading Skeleton State
  if (isLoadingServerAnalytics && !analytics) {
    return <AnalyticsSkeleton />;
  }

  // 2. Error State
  if (isAnalyticsError && !analytics) {
    return (
      <div className="py-12">
        <ErrorState
          title="Failed to Load Live Analytics"
          message="Could not retrieve visitor intelligence from the studio server. Please check your network connection and retry."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // 3. Fallback when server returned no data
  if (!analytics) {
    return (
      <div className="py-12">
        <EmptyState
          icon={BarChart3}
          title="No Analytics Data Available"
          description={`Telemetry records for "${gallery.title}" are currently empty.`}
          actionLabel="Refresh Data"
          onAction={() => refetch()}
        />
      </div>
    );
  }

  // Check if completely empty (zero views, zero events)
  const hasZeroEvents =
    analytics.totalViews === 0 &&
    analytics.photoImpressions === 0 &&
    analytics.totalDownloads === 0 &&
    analytics.timeline.length === 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase tracking-wider border border-amber-500/20">
              Live Intelligence
            </span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Tracking Active
            </span>
            {isFetching && (
              <span className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
                <Loader2 className="w-3 h-3 animate-spin" /> Syncing...
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900 dark:text-white">
            Client Engagement & Analytics
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Real-time client viewing patterns, download activity, and photo popularity for{' '}
            <span className="font-semibold text-neutral-900 dark:text-neutral-200">
              "{gallery.title}"
            </span>
            .
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Time Range Pills */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            {(['7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Test Live Telemetry Ping */}
          <button
            onClick={handleRecordTestPing}
            disabled={isSimulating}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition-all shadow-sm shadow-amber-500/10 cursor-pointer active:scale-95 disabled:opacity-50"
            title="Dispatch a live telemetry ping to verify backend recording"
          >
            <Zap className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Recording...' : 'Send Live Ping'}</span>
          </button>

          {/* Export Report */}
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-medium transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
            title="Export CSV Report"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Top KPI Metric Strip (6 High-Impact Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {/* Total Views */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-md space-y-2 hover:border-amber-500/40 transition-colors group">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">
              Gallery Views
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {analytics.totalViews.toLocaleString()}
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
            Total page sessions
          </p>
        </div>

        {/* Unique Visitors */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-md space-y-2 hover:border-blue-500/40 transition-colors group">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">
              Unique Visitors
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {analytics.uniqueVisitors.toLocaleString()}
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
            Couples & invited guests
          </p>
        </div>

        {/* Photo Impressions */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-md space-y-2 hover:border-violet-500/40 transition-colors group">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">
              Photo Opens
            </span>
            <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {analytics.photoImpressions.toLocaleString()}
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
            Lightbox & full previews
          </p>
        </div>

        {/* Total Downloads */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-md space-y-2 hover:border-emerald-500/40 transition-colors group">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">
              Downloads
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {analytics.totalDownloads.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {analytics.fullZipDownloads} Master ZIPs
          </p>
        </div>

        {/* Client Favorites */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-md space-y-2 hover:border-rose-500/40 transition-colors group">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">
              Heart Favorites
            </span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform">
              <Heart className="w-4 h-4 fill-rose-500/20" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {analytics.favoritesCount.toLocaleString()}
          </div>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
            Selected for album print
          </p>
        </div>

        {/* Engagement Duration */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-md space-y-2 hover:border-amber-500/40 transition-colors group">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">
              Avg Session
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {analytics.avgSessionDuration}
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
            Bounce rate: {analytics.bounceRate}
          </p>
        </div>
      </div>

      {/* If 0 events exist, show a clean Empty State banner */}
      {hasZeroEvents ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-neutral-900/20 border border-dashed border-neutral-300 dark:border-neutral-800 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-serif font-bold text-neutral-900 dark:text-white">
            No Visitor Activity Recorded Yet
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
            Live telemetry is listening for activity. As soon as couples or guests view your gallery, open photos in lightbox, or download images, detailed charts and logs will appear here.
          </p>
          <div className="pt-2">
            <button
              onClick={handleRecordTestPing}
              disabled={isSimulating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs shadow-md transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Send Test View Event</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 3. Interactive Timeline Trend Chart */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-neutral-900 dark:text-white">
                  Visitor Traffic & Activity Timeline
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Daily distribution of views, downloads, and photo favorites.
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-amber-400" />
                  <span className="text-neutral-600 dark:text-neutral-400 font-medium">Views</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500" />
                  <span className="text-neutral-600 dark:text-neutral-400 font-medium">Downloads</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-rose-500" />
                  <span className="text-neutral-600 dark:text-neutral-400 font-medium">Favorites</span>
                </div>
              </div>
            </div>

            {/* Bar Chart Container */}
            {analytics.timeline.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-neutral-400">
                No timeline records for this time period.
              </div>
            ) : (
              <div className="relative pt-6">
                <div className="h-56 sm:h-64 flex items-end gap-1.5 sm:gap-2 pt-6 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                  {analytics.timeline.map((item, index) => {
                    const viewHeightPercent = Math.max(
                      (item.views / maxTimelineViews) * 100,
                      item.views > 0 ? 6 : 2
                    );
                    const isHovered = hoveredBarIndex === index;

                    return (
                      <div
                        key={item.date || index}
                        className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                        onMouseEnter={() => setHoveredBarIndex(index)}
                        onMouseLeave={() => setHoveredBarIndex(null)}
                      >
                        {/* Tooltip on Hover */}
                        {isHovered && (
                          <div className="absolute -top-16 z-30 p-2 rounded-xl bg-neutral-950 text-white border border-neutral-800 text-[11px] shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                            <p className="font-bold text-amber-400">{item.date}</p>
                            <div className="flex items-center gap-3 pt-0.5 text-[10px]">
                              <span>{item.views} Views</span>
                              <span className="text-emerald-400">{item.downloads} DL</span>
                              <span className="text-rose-400">{item.favorites} Favs</span>
                            </div>
                          </div>
                        )}

                        {/* Bar Pillar */}
                        <div
                          style={{ height: `${viewHeightPercent}%` }}
                          className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 relative overflow-hidden ${
                            isHovered
                              ? 'bg-amber-400 shadow-md shadow-amber-400/30'
                              : 'bg-amber-400/80 hover:bg-amber-400'
                          }`}
                        >
                          {/* Inner accent for downloads */}
                          {item.downloads > 0 && (
                            <div
                              style={{
                                height: `${Math.min((item.downloads / Math.max(item.views, 1)) * 100, 100)}%`,
                              }}
                              className="w-full bg-emerald-500/80 absolute bottom-0 left-0"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* X-axis Labels */}
                <div className="flex items-center justify-between pt-2 text-[10px] font-mono text-neutral-400">
                  <span>{analytics.timeline[0]?.shortDate || 'Start'}</span>
                  <span>{analytics.timeline[Math.floor(analytics.timeline.length / 2)]?.shortDate}</span>
                  <span>{analytics.timeline[analytics.timeline.length - 1]?.shortDate || 'Today'}</span>
                </div>
              </div>
            )}
          </div>

          {/* 4. Audience Tech & Acquisition Channels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Demographics */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-serif font-bold text-neutral-900 dark:text-white">
                    Device Ecosystem
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Client viewing screen breakdown.
                  </p>
                </div>
                <Smartphone className="w-5 h-5 text-neutral-400" />
              </div>

              <div className="space-y-4 pt-1">
                {/* Mobile */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-neutral-700 dark:text-neutral-300">
                      <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                      Mobile Handsets
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-white font-mono">
                      {analytics.devices.mobile}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      style={{ width: `${analytics.devices.mobile}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                    />
                  </div>
                </div>

                {/* Desktop */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-neutral-700 dark:text-neutral-300">
                      <Monitor className="w-3.5 h-3.5 text-blue-500" />
                      Desktop & iMacs
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-white font-mono">
                      {analytics.devices.desktop}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      style={{ width: `${analytics.devices.desktop}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-300"
                    />
                  </div>
                </div>

                {/* Tablet */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-neutral-700 dark:text-neutral-300">
                      <Tablet className="w-3.5 h-3.5 text-purple-500" />
                      Tablets & iPads
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-white font-mono">
                      {analytics.devices.tablet}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      style={{ width: `${analytics.devices.tablet}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Traffic Channels */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-serif font-bold text-neutral-900 dark:text-white">
                    Acquisition Channels
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    How clients and guests arrived at this private collection.
                  </p>
                </div>
                <Globe className="w-5 h-5 text-neutral-400" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 space-y-1">
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block font-semibold">
                    Direct Private Link
                  </span>
                  <div className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {analytics.trafficSources.directLink}%
                  </div>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    SMS & WhatsApp
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 space-y-1">
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block font-semibold">
                    Studio Email Delivery
                  </span>
                  <div className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {analytics.trafficSources.email}%
                  </div>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                    Official invitation
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 space-y-1">
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block font-semibold">
                    Social & Bio Link
                  </span>
                  <div className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {analytics.trafficSources.social}%
                  </div>
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                    Instagram highlights
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 space-y-1">
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block font-semibold">
                    Event Table QR
                  </span>
                  <div className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {analytics.trafficSources.qrCode}%
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Physical printouts
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Top Performing Photographs */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-neutral-900 dark:text-white">
                  Most Popular Photographs
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Ranked by client views, favorites, and individual downloads.
                </p>
              </div>
              <span className="text-xs text-neutral-400 font-medium">
                {gallery.media.length} total media items in collection
              </span>
            </div>

            {analytics.topPhotos.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-xs font-medium">
                No photo impression telemetry recorded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                {analytics.topPhotos.slice(0, 4).map((photo, index) => (
                  <div
                    key={photo.id}
                    className="group rounded-2xl overflow-hidden bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800/80 hover:border-amber-500/40 transition-all flex flex-col justify-between"
                  >
                    {/* Photo Thumbnail */}
                    <div className="relative h-44 w-full overflow-hidden bg-neutral-900">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      {/* Rank Badge */}
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-amber-400 font-bold text-[10px] border border-amber-400/30">
                        #{index + 1} Most Viewed
                      </span>

                      {photo.sectionTitle && (
                        <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md text-white text-[9px] uppercase tracking-wider font-semibold">
                          {photo.sectionTitle}
                        </span>
                      )}
                    </div>

                    {/* Details & Performance Metrics */}
                    <div className="p-3.5 space-y-2.5">
                      <h4 className="font-serif font-bold text-xs text-neutral-900 dark:text-white truncate">
                        {photo.title}
                      </h4>

                      <div className="grid grid-cols-3 divide-x divide-neutral-200 dark:divide-neutral-800 text-center pt-1 border-t border-neutral-100 dark:border-neutral-800/80">
                        <div>
                          <span className="text-[10px] text-neutral-400 uppercase block font-medium">
                            Views
                          </span>
                          <span className="text-xs font-bold text-neutral-900 dark:text-white">
                            {photo.views}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 uppercase block font-medium">
                            Favs
                          </span>
                          <span className="text-xs font-bold text-rose-500">
                            {photo.favorites}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 uppercase block font-medium">
                            Downloads
                          </span>
                          <span className="text-xs font-bold text-emerald-500">
                            {photo.downloads}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. Live Client Activity Stream */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-base sm:text-lg font-serif font-bold text-neutral-900 dark:text-white">
                  Recent Client Activity Log
                </h3>
              </div>
              <span className="text-xs text-neutral-400 font-medium">
                Last updated: {new Date(analytics.lastUpdated).toLocaleTimeString()}
              </span>
            </div>

            {analytics.recentActivity.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                No recent activity events logged yet. Client actions will stream here in real time.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                {analytics.recentActivity.map((act) => (
                  <div
                    key={act.id}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          act.type === 'view'
                            ? 'bg-amber-500/10 text-amber-500'
                            : act.type === 'favorite'
                            ? 'bg-rose-500/10 text-rose-500'
                            : act.type === 'download_all' || act.type === 'download_single'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : act.type === 'share'
                            ? 'bg-blue-500/10 text-blue-500'
                            : 'bg-purple-500/10 text-purple-500'
                        }`}
                      >
                        {act.type === 'view' && <Eye className="w-4 h-4" />}
                        {act.type === 'favorite' && <Heart className="w-4 h-4" />}
                        {(act.type === 'download_all' || act.type === 'download_single') && (
                          <Download className="w-4 h-4" />
                        )}
                        {act.type === 'share' && <Share2 className="w-4 h-4" />}
                        {act.type === 'unlock' && <ShieldCheck className="w-4 h-4" />}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                            {act.title}
                          </span>
                          {act.device && (
                            <span className="px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-500 uppercase font-medium">
                              {act.device}
                            </span>
                          )}
                          {act.location && (
                            <span className="text-[11px] text-neutral-400 font-medium">
                              • {act.location}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {act.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] text-neutral-400 dark:text-neutral-500 shrink-0 font-medium">
                      {act.timeAgo}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
