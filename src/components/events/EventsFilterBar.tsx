import React from 'react';
import { Calendar, FolderKanban, Trash2 } from 'lucide-react';

export type EventTabType = 'live' | 'upcoming' | 'past' | 'trash';

export interface EventsFilterBarProps {
  activeTab: EventTabType;
  onChangeTab: (tab: EventTabType) => void;
  liveCount: number;
  upcomingCount: number;
  pastCount: number;
  trashCount: number;
}

export const EventsFilterBar: React.FC<EventsFilterBarProps> = ({
  activeTab,
  onChangeTab,
  liveCount,
  upcomingCount,
  pastCount,
  trashCount,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 pb-3">
      <button
        onClick={() => onChangeTab('live')}
        className={`py-2 px-4 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
          activeTab === 'live'
            ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>Live Events ({liveCount})</span>
      </button>

      <button
        onClick={() => onChangeTab('upcoming')}
        className={`py-2 px-4 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
          activeTab === 'upcoming'
            ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
        }`}
      >
        <Calendar className="w-3.5 h-3.5" />
        <span>Upcoming Events ({upcomingCount})</span>
      </button>

      <button
        onClick={() => onChangeTab('past')}
        className={`py-2 px-4 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
          activeTab === 'past'
            ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
        }`}
      >
        <FolderKanban className="w-3.5 h-3.5" />
        <span>Moved to Gallery / Past ({pastCount})</span>
      </button>

      <button
        onClick={() => onChangeTab('trash')}
        className={`py-2 px-4 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
          activeTab === 'trash'
            ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-neutral-900'
        }`}
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Trash ({trashCount})</span>
      </button>
    </div>
  );
};
