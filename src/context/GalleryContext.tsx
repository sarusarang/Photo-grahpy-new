import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Gallery, MediaItem, SubscriptionPlan, GalleryTemplateId } from '../types';
import { INITIAL_GALLERIES, INITIAL_SUBSCRIPTION, AVAILABLE_PLANS } from '../data/demoData';
import { getInitialGalleryCover } from '../utils/coverImageUtils';

interface GalleryContextType {
  galleries: Gallery[];
  subscription: SubscriptionPlan;
  availablePlans: SubscriptionPlan[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  createGallery: (galleryData: Partial<Gallery>) => Gallery;
  updateGallery: (galleryId: string, updates: Partial<Gallery>) => void;
  deleteGallery: (galleryId: string) => void;
  addMediaToGallery: (
    galleryId: string,
    items: (Omit<MediaItem, 'id' | 'galleryId' | 'dateAdded'> & {
      id?: string;
      galleryId?: string;
      dateAdded?: string;
    })[]
  ) => void;
  removeMediaFromGallery: (galleryId: string, mediaId: string) => void;
  reorderMediaInGallery: (galleryId: string, reorderedList: MediaItem[]) => void;
  toggleMediaFavorite: (galleryId: string, mediaId: string) => void;
  setCoverImage: (galleryId: string, mediaUrl: string) => void;
  setTemplateBannerImage: (galleryId: string, templateId: GalleryTemplateId, mediaUrl: string) => void;
  setMasonryBannerImage: (galleryId: string, slotIndex: number, mediaUrl: string) => void;
  addSectionToGallery: (galleryId: string, sectionTitle: string) => void;
  moveMediaToSection: (galleryId: string, mediaIds: string[], targetSection: string) => void;
  deleteSectionFromGallery: (galleryId: string, sectionTitle: string) => void;
  renameSectionInGallery: (galleryId: string, oldTitle: string, newTitle: string) => void;
  updateGalleryTemplate: (galleryId: string, templateId: GalleryTemplateId) => void;
  upgradeSubscription: (planId: string) => void;
  getGalleryByIdOrSlug: (idOrSlug: string) => Gallery | undefined;
  resetAllDemoData: () => void;
}

const GALLERIES_STORAGE_KEY = 'photo_saas_galleries_v3';
const SUBSCRIPTION_STORAGE_KEY = 'photo_saas_subscription_v3';

const GalleryContext = createContext<GalleryContextType | undefined>(undefined);

export const GalleryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [galleries, setGalleries] = useState<Gallery[]>(() => {
    try {
      const saved = localStorage.getItem(GALLERIES_STORAGE_KEY);
      if (saved && (saved.includes('Villa Balbiano') || saved.includes('Paris Fashion Week'))) {
        localStorage.removeItem(GALLERIES_STORAGE_KEY);
        return [];
      }
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [subscription, setSubscription] = useState<SubscriptionPlan>(() => {
    return {
      id: 'plan-standard-1y',
      name: 'Standard Annual',
      tier: 'standard',
      priceMonthly: 800,
      billingCycle: 'annual',
      storageLimitGB: 20,
      storageUsedGB: 0,
      daysRemaining: 365,
      expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      status: 'active',
      features: [],
    };
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    localStorage.setItem(GALLERIES_STORAGE_KEY, JSON.stringify(galleries));
  }, [galleries]);

  useEffect(() => {
    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
  }, [subscription]);

  // Recalculate storage used whenever galleries change based on real media
  useEffect(() => {
    let totalMB = 0;
    for (const gal of galleries) {
      for (const m of gal.media) {
        totalMB += m.sizeMB || 0;
      }
    }
    const totalGB = Number((totalMB / 1024).toFixed(2));
    setSubscription((prev) => ({
      ...prev,
      storageUsedGB: totalGB,
    }));
  }, [galleries]);

  const createGallery = (galleryData: Partial<Gallery>): Gallery => {
    const id = galleryData.id || `gal-${Date.now()}`;
    const slug =
      galleryData.slug ||
      (galleryData.title || 'untitled')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const newGallery: Gallery = {
      id,
      slug: galleryData.slug || `${slug}-${Math.floor(100 + Math.random() * 900)}`,
      title: galleryData.title || 'Untitled Gallery',
      clientName: galleryData.clientName || 'Private Client',
      clientEmail: galleryData.clientEmail || '',
      eventDate: galleryData.eventDate || new Date().toISOString().split('T')[0],
      createdAt: galleryData.createdAt || new Date().toISOString().split('T')[0],
      coverImage:
        galleryData.coverImage ||
        getInitialGalleryCover(galleryData.templateId),
      templateId: galleryData.templateId || 'editorial',
      status: galleryData.status || 'active',
      isPasswordProtected: galleryData.isPasswordProtected || false,
      password: galleryData.password || '',
      allowDownloads: galleryData.allowDownloads !== undefined ? galleryData.allowDownloads : true,
      allowFavorites: galleryData.allowFavorites !== undefined ? galleryData.allowFavorites : true,
      media: galleryData.media || [],
      viewsCount: galleryData.viewsCount || 0,
      downloadsCount: galleryData.downloadsCount || 0,
    };

    setGalleries((prev) => [newGallery, ...prev]);
    return newGallery;
  };

  const updateGallery = (galleryId: string, updates: Partial<Gallery>) => {
    setGalleries((prev) =>
      prev.map((gal) => (gal.id === galleryId ? { ...gal, ...updates } : gal))
    );
  };

  const deleteGallery = (galleryId: string) => {
    setGalleries((prev) => prev.filter((gal) => gal.id !== galleryId));
  };

  const addMediaToGallery = (
    galleryId: string,
    items: (Omit<MediaItem, 'id' | 'galleryId' | 'dateAdded'> & {
      id?: string;
      galleryId?: string;
      dateAdded?: string;
    })[]
  ) => {
    const nowStr = new Date().toISOString().split('T')[0];
    const newItems: MediaItem[] = items.map((it, idx) => ({
      ...it,
      id: it.id || `m-${Date.now()}-${idx}`,
      galleryId: it.galleryId || galleryId,
      dateAdded: it.dateAdded || nowStr,
    }));

    setGalleries((prev) =>
      prev.map((gal) => {
        if (gal.id !== galleryId) return gal;

        // Collect newly introduced section titles
        const existingSections = new Set(gal.sections || []);
        newItems.forEach((it) => {
          if (it.sectionTitle && it.sectionTitle.trim()) {
            existingSections.add(it.sectionTitle.trim());
          }
        });

        return {
          ...gal,
          sections: Array.from(existingSections),
          media: [...gal.media, ...newItems],
          coverImage: gal.coverImage || (newItems[0]?.url ?? gal.coverImage),
        };
      })
    );
  };

  const removeMediaFromGallery = (galleryId: string, mediaId: string) => {
    setGalleries((prev) =>
      prev.map((gal) => {
        if (gal.id !== galleryId) return gal;
        const newMedia = gal.media.filter((m) => m.id !== mediaId);
        return {
          ...gal,
          media: newMedia,
          coverImage:
            newMedia.length === 0
              ? getInitialGalleryCover(gal.templateId)
              : gal.coverImage,
        };
      })
    );
  };

  const reorderMediaInGallery = (galleryId: string, reorderedList: MediaItem[]) => {
    setGalleries((prev) =>
      prev.map((gal) => (gal.id === galleryId ? { ...gal, media: reorderedList } : gal))
    );
  };

  const toggleMediaFavorite = (galleryId: string, mediaId: string) => {
    setGalleries((prev) =>
      prev.map((gal) => {
        if (gal.id !== galleryId) return gal;
        return {
          ...gal,
          media: gal.media.map((m) =>
            m.id === mediaId ? { ...m, isFavorite: !m.isFavorite } : m
          ),
        };
      })
    );
  };

  const setCoverImage = (galleryId: string, mediaUrl: string) => {
    setGalleries((prev) =>
      prev.map((gal) => {
        if (gal.id !== galleryId) return gal;
        return {
          ...gal,
          coverImage: mediaUrl,
          templateBanners: {
            ...(gal.templateBanners || {}),
            [gal.templateId]: mediaUrl,
          },
          media: gal.media.map((m) => ({
            ...m,
            isCover: m.url === mediaUrl,
          })),
        };
      })
    );
  };

  const setTemplateBannerImage = (galleryId: string, templateId: GalleryTemplateId, mediaUrl: string) => {
    setGalleries((prev) =>
      prev.map((gal) => {
        if (gal.id !== galleryId) return gal;
        const updatedBanners = {
          ...(gal.templateBanners || {}),
          [templateId]: mediaUrl,
        };
        const isActiveTemplate = gal.templateId === templateId;
        const updatedMasonryBanners = templateId === 'masonry'
          ? [
              mediaUrl,
              gal.masonryBannerImages?.[1] || gal.media[1]?.url || gal.media[0]?.url || '',
              gal.masonryBannerImages?.[2] || gal.media[2]?.url || gal.media[0]?.url || '',
              gal.masonryBannerImages?.[3] || gal.media[3]?.url || gal.media[0]?.url || '',
            ]
          : gal.masonryBannerImages;

        return {
          ...gal,
          templateBanners: updatedBanners,
          masonryBannerImages: updatedMasonryBanners,
          ...(isActiveTemplate ? {
            coverImage: mediaUrl,
            media: gal.media.map((m) => ({
              ...m,
              isCover: m.url === mediaUrl,
            })),
          } : {}),
        };
      })
    );
  };

  const setMasonryBannerImage = (galleryId: string, slotIndex: number, mediaUrl: string) => {
    setGalleries((prev) =>
      prev.map((gal) => {
        if (gal.id !== galleryId) return gal;
        const currentBanners = gal.masonryBannerImages && gal.masonryBannerImages.length >= 4
          ? [...gal.masonryBannerImages]
          : [
              gal.templateBanners?.['masonry'] || gal.coverImage || gal.media[0]?.url || '',
              gal.media[1]?.url || gal.media[0]?.url || '',
              gal.media[2]?.url || gal.media[0]?.url || '',
              gal.media[3]?.url || gal.media[0]?.url || '',
            ];
        currentBanners[slotIndex] = mediaUrl;

        const isSlot0 = slotIndex === 0;
        return {
          ...gal,
          masonryBannerImages: currentBanners,
          ...(isSlot0 ? {
            templateBanners: {
              ...(gal.templateBanners || {}),
              masonry: mediaUrl,
            },
            ...(gal.templateId === 'masonry' ? {
              coverImage: mediaUrl,
              media: gal.media.map((m) => ({
                ...m,
                isCover: m.url === mediaUrl,
              })),
            } : {}),
          } : {}),
        };
      })
    );
  };

  const updateGalleryTemplate = (galleryId: string, templateId: GalleryTemplateId) => {
    setGalleries((prev) =>
      prev.map((gal) => {
        if (gal.id !== galleryId) return gal;
        const templateCover = gal.templateBanners?.[templateId] || gal.coverImage;
        return {
          ...gal,
          templateId,
          coverImage: templateCover,
          media: gal.media.map((m) => ({
            ...m,
            isCover: m.url === templateCover,
          })),
        };
      })
    );
  };

  const addSectionToGallery = (galleryId: string, sectionTitle: string) => {
    const trimmed = sectionTitle.trim().toUpperCase();
    if (!trimmed) return;
    setGalleries((prev) =>
      prev.map((gal) => {
        if (gal.id !== galleryId) return gal;
        const existing = gal.sections || [];
        if (existing.some((s) => s.toUpperCase() === trimmed)) return gal;
        return {
          ...gal,
          sections: [...existing, trimmed],
        };
      })
    );
  };

  const moveMediaToSection = (galleryId: string, mediaIds: string[], targetSection: string) => {
    const trimmedTarget = targetSection.trim().toUpperCase();
    if (mediaIds.length === 0) return;

    setGalleries((prev) =>
      prev.map((gal) => {
        if (gal.id !== galleryId) return gal;

        const currentSections = new Set(gal.sections || []);
        if (trimmedTarget && trimmedTarget !== 'UNASSIGNED') {
          currentSections.add(trimmedTarget);
        }

        const updatedMedia = gal.media.map((item) => {
          if (mediaIds.includes(item.id)) {
            return {
              ...item,
              sectionTitle: trimmedTarget === 'UNASSIGNED' || !trimmedTarget ? undefined : trimmedTarget,
            };
          }
          return item;
        });

        return {
          ...gal,
          sections: Array.from(currentSections),
          media: updatedMedia,
        };
      })
    );
  };

  const deleteSectionFromGallery = (galleryId: string, sectionTitle: string) => {
    const trimmed = sectionTitle.trim().toUpperCase();
    setGalleries((prev) =>
      prev.map((gal) => {
        if (gal.id !== galleryId) return gal;
        return {
          ...gal,
          sections: (gal.sections || []).filter((s) => s.toUpperCase() !== trimmed),
          media: gal.media.map((item) =>
            (item.sectionTitle || '').toUpperCase() === trimmed
              ? { ...item, sectionTitle: undefined }
              : item
          ),
        };
      })
    );
  };

  const renameSectionInGallery = (galleryId: string, oldTitle: string, newTitle: string) => {
    const oldT = oldTitle.trim().toUpperCase();
    const newT = newTitle.trim().toUpperCase();
    if (!newT || oldT === newT) return;

    setGalleries((prev) =>
      prev.map((gal) => {
        if (gal.id !== galleryId) return gal;
        const existing = gal.sections || [];
        const updatedSections = existing.map((s) => (s.toUpperCase() === oldT ? newT : s));
        return {
          ...gal,
          sections: Array.from(new Set(updatedSections)),
          media: gal.media.map((item) =>
            (item.sectionTitle || '').toUpperCase() === oldT
              ? { ...item, sectionTitle: newT }
              : item
          ),
        };
      })
    );
  };

  const upgradeSubscription = (planId: string) => {
    const selected = AVAILABLE_PLANS.find((p) => p.id === planId);
    if (selected) {
      setSubscription({
        ...selected,
        storageUsedGB: subscription.storageUsedGB,
        status: 'active',
        daysRemaining: selected.billingCycle === 'annual' ? 365 : 30,
        expiryDate: '2027-09-10',
      });
    }
  };

  const getGalleryByIdOrSlug = (idOrSlug: string): Gallery | undefined => {
    return galleries.find((g) => g.id === idOrSlug || g.slug === idOrSlug);
  };

  const resetAllDemoData = () => {
    setGalleries(INITIAL_GALLERIES);
    setSubscription(INITIAL_SUBSCRIPTION);
    localStorage.removeItem(GALLERIES_STORAGE_KEY);
    localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
  };

  return (
    <GalleryContext.Provider
      value={{
        galleries,
        subscription,
        availablePlans: AVAILABLE_PLANS,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        createGallery,
        updateGallery,
        deleteGallery,
        addMediaToGallery,
        removeMediaFromGallery,
        reorderMediaInGallery,
        toggleMediaFavorite,
        setCoverImage,
        setTemplateBannerImage,
        setMasonryBannerImage,
        addSectionToGallery,
        moveMediaToSection,
        deleteSectionFromGallery,
        renameSectionInGallery,
        updateGalleryTemplate,
        upgradeSubscription,
        getGalleryByIdOrSlug,
        resetAllDemoData,
      }}
    >
      {children}
    </GalleryContext.Provider>
  );
};

export const useGallery = (): GalleryContextType => {
  const context = useContext(GalleryContext);
  if (!context) {
    throw new Error('useGallery must be used within a GalleryProvider');
  }
  return context;
};
