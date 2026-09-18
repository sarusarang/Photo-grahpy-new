import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TUTORIAL_STEPS } from '../../data/tutorialData';
import {
  Play,
  CheckCircle,
  ArrowRight,
  FolderPlus,
  UploadCloud,
  SlidersHorizontal,
  Palette,
  Share2,
  DownloadCloud,
  ExternalLink,
  X,
  BookOpen,
} from 'lucide-react';

export const TutorialPage: React.FC = () => {
  const [activeStepId, setActiveStepId] = useState<number>(1);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case 'FolderPlus':
        return <FolderPlus className="w-5 h-5" />;
      case 'UploadCloud':
        return <UploadCloud className="w-5 h-5" />;
      case 'SlidersHorizontal':
        return <SlidersHorizontal className="w-5 h-5" />;
      case 'Palette':
        return <Palette className="w-5 h-5" />;
      case 'Share2':
        return <Share2 className="w-5 h-5" />;
      case 'DownloadCloud':
        return <DownloadCloud className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const currentStep = TUTORIAL_STEPS.find((s) => s.id === activeStepId) || TUTORIAL_STEPS[0];

  return (
    <div className="dashboard-container p-4 sm:p-8 max-w-7xl mx-auto space-y-8 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400 font-mono font-semibold">
              Masterclass Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-neutral-900 dark:text-white tracking-tight font-bold">
            Photographer Guide & Onboarding
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Master the 6 key workflows from creating private galleries to client proofing and 4K video delivery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/gallery/sarang-wedding-editorial"
            target="_blank"
            className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Preview Client View</span>
          </Link>
        </div>
      </div>

      {/* Featured Video Spotlight Card */}
      <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800 shadow-md dark:shadow-2xl p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="max-w-xl space-y-4">
          <span className="px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-700 dark:text-amber-300 text-xs font-mono uppercase tracking-widest font-semibold">
            Essential 5-Minute Tour
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif text-neutral-900 dark:text-white leading-tight font-bold">
            How Top Studios Deliver Galleries That WOW Clients
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Discover how to use cloud uploads, fine-art editorial typography, mobile-first proofing,
            and instant full-resolution ZIP downloads to create an unforgettable client experience.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() =>
                setSelectedVideo(
                  'https://assets.mixkit.co/videos/preview/mixkit-bride-holding-a-bouquet-of-flowers-43183-large.mp4'
                )
              }
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold tracking-wide transition-all shadow-md shadow-amber-500/10 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Watch Video Tour (04:15)</span>
            </button>
            <span className="text-xs text-neutral-400 font-mono">No prior setup required</span>
          </div>
        </div>

        {/* Video Thumbnail Graphic */}
        <div
          onClick={() =>
            setSelectedVideo(
              'https://assets.mixkit.co/videos/preview/mixkit-bride-holding-a-bouquet-of-flowers-43183-large.mp4'
            )
          }
          className="relative w-full lg:w-[420px] aspect-video rounded-2xl overflow-hidden shadow-xl cursor-pointer group border border-neutral-200 dark:border-neutral-700/60"
        >
          <img
            src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80"
            alt="Tutorial Tour"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 fill-current ml-0.5" />
            </div>
          </div>
          <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/70 text-[11px] font-mono text-white">
            04:15
          </span>
        </div>
      </div>

      {/* The 6 Visual Tutorial Cards */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-serif text-neutral-900 dark:text-white font-bold">The 6 Core Workflow Steps</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Click any step below for detailed step-by-step instructions</p>
          </div>
          <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold">{TUTORIAL_STEPS.length} Guided Steps</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TUTORIAL_STEPS.map((step) => {
            const isActive = activeStepId === step.id;
            return (
              <div
                key={step.id}
                onClick={() => setActiveStepId(step.id)}
                className={`rounded-3xl p-6 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-white dark:bg-[#121319] border-amber-400 ring-2 ring-amber-400 shadow-xl'
                    : 'bg-white dark:bg-[#121319] border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm'
                }`}
              >
                <div>
                  <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden mb-4 bg-neutral-900">
                    <img
                      src={step.videoThumbUrl}
                      alt={step.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 w-8 h-8 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center font-bold text-xs shadow-md">
                      {step.id}
                    </div>
                    <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-white">
                      {step.videoDuration}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      {getStepIcon(step.iconName)}
                    </div>
                    <h4 className="text-base font-semibold text-neutral-900 dark:text-white truncate">{step.title}</h4>
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                    {step.shortDesc}
                  </p>

                  <ul className="space-y-1.5 my-3 text-[11px] text-neutral-600 dark:text-neutral-300">
                    {step.keyPoints.slice(0, 2).map((pt, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="truncate">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                  <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 group-hover:underline">
                    <span>View Step Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  {step.actionRoute && (
                    <Link
                      to={step.actionRoute}
                      onClick={(e) => e.stopPropagation()}
                      className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white underline text-[11px]"
                    >
                      Try Now
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Step Detail Drawer/Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center font-bold">
              {currentStep.id}
            </div>
            <div>
              <h3 className="text-xl font-serif text-neutral-900 dark:text-white font-bold">{currentStep.title}</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{currentStep.shortDesc}</p>
            </div>
          </div>

          {currentStep.actionRoute && (
            <Link
              to={currentStep.actionRoute}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-sm"
            >
              <span>{currentStep.actionLabel || 'Go to Action'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-3xl">
          {currentStep.details}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {currentStep.keyPoints.map((pt, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2.5 text-xs text-neutral-800 dark:text-neutral-200"
            >
              <CheckCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{pt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Video Modal if clicked */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-900 dark:text-white">Interactive Platform Walkthrough</span>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-1 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              <video src={selectedVideo} controls autoPlay className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
