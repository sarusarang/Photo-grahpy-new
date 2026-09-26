import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse rounded-lg bg-neutral-800/50 backdrop-blur-sm ${className}`}
    />
  );
};

export const GalleryGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/[0.06] bg-neutral-900/40 p-4 space-y-4 overflow-hidden"
        >
          <Skeleton className="w-full h-48 sm:h-56 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="w-3/4 h-5" />
            <Skeleton className="w-1/2 h-3.5" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
            <Skeleton className="w-20 h-3" />
            <Skeleton className="w-16 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const EventListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/[0.06] bg-neutral-900/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
            <div className="space-y-2">
              <Skeleton className="w-48 h-5" />
              <Skeleton className="w-32 h-3.5" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-24 h-9 rounded-lg" />
            <Skeleton className="w-28 h-9 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-14 rounded-xl bg-neutral-900/30 border border-white/[0.04] p-3 flex items-center justify-between gap-4"
        >
          <Skeleton className="w-1/3 h-4" />
          <Skeleton className="w-1/4 h-4" />
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-20 h-7 rounded-lg" />
        </div>
      ))}
    </div>
  );
};

export const GalleryDetailSkeleton: React.FC = () => {
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-32 h-3.5" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-24 h-9 rounded-xl" />
          <Skeleton className="w-28 h-9 rounded-xl" />
        </div>
      </div>
      <Skeleton className="w-full h-72 sm:h-96 rounded-3xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-2xl" />
        ))}
      </div>
    </div>
  );
};

export const AnalyticsSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-neutral-900/40 border border-white/[0.06]">
        <div className="space-y-2">
          <Skeleton className="w-32 h-4 rounded-full" />
          <Skeleton className="w-64 h-7 rounded-xl" />
          <Skeleton className="w-96 max-w-full h-4 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-48 h-9 rounded-xl" />
          <Skeleton className="w-28 h-9 rounded-xl" />
        </div>
      </div>

      {/* 6 Metric Strips */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-4 sm:p-5 rounded-2xl bg-neutral-900/40 border border-white/[0.06] space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="w-20 h-3" />
              <Skeleton className="w-6 h-6 rounded-lg" />
            </div>
            <Skeleton className="w-16 h-8 rounded-lg" />
            <Skeleton className="w-24 h-3" />
          </div>
        ))}
      </div>

      {/* Timeline Chart Skeleton */}
      <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900/40 border border-white/[0.06] space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="w-40 h-5" />
            <Skeleton className="w-64 h-3.5" />
          </div>
          <Skeleton className="w-24 h-6 rounded-full" />
        </div>
        <Skeleton className="w-full h-64 rounded-2xl" />
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-neutral-900/40 border border-white/[0.06] space-y-4">
          <Skeleton className="w-48 h-5" />
          <TableRowSkeleton rows={4} />
        </div>
        <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900/40 border border-white/[0.06] space-y-4">
          <Skeleton className="w-36 h-5" />
          <Skeleton className="w-full h-48 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;

