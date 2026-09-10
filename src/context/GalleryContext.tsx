import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Gallery, MediaItem, SubscriptionPlan, GalleryTemplateId } from '../types';
import { INITIAL_GALLERIES, INITIAL_SUBSCRIPTION, AVAILABLE_PLANS } from '../data/demoData';

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
  addMediaToGallery: (galleryId: string, items: Omit<MediaItem, 'id' | 'galleryId' | 'dateAdded'>[]) => void;
  removeMediaFromGallery: (galleryId: string, mediaId: string) => void;
  reorderMediaInGallery: (galleryId: string, reorderedList: MediaItem[]) => void;
  toggleMediaFavorite: (galleryId: string, mediaId: string) => void;
  setCoverImage: (galleryId: string, mediaUrl: string) => void;
  updateGalleryTemplate: (galleryId: string, templateId: GalleryTemplateId) => void;
  upgradeSubscription: (planId: string) => void;
  getGalleryByIdOrSlug: (idOrSlug: string) => Gallery | undefined;
  resetAllDemoData: () => void;
}

const GALLERIES_STORAGE_KEY = 'photo_saas_galleries_v2';
const SUBSCRIPTION_STORAGE_KEY = 'photo_saas_subscription_v2';

const GalleryContext = createContext<GalleryContextType | undefined>(undefined);

export const GalleryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [galleries, setGalleries] = useState<Gallery[]>(() => {
    const saved = localStorage.getItem(GALLERIES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_GALLERIES;
  });

  const [subscription, setSubscription] = useState<SubscriptionPlan>(() => {
    const saved = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_SUBSCRIPTION;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    localStorage.setItem(GALLERIES_STORAGE_KEY, JSON.stringify(galleries));
  }, [galleries]);

  useEffect(() => {
    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
  }, [subscription]);

  // Recalculate storage used whenever galleries change
  useEffect(() => {
    let totalMB = 0;
    for (const gal of galleries) {
      for (const m of gal.media) {
        totalMB += m.sizeMB || 5;
      }
    }
    // Base platform overhead + media
    const totalGB = Number((28.5 + totalMB / 1024).toFixed(1));
    setSubscription((prev) => ({
      ...prev,
      storageUsedGB: totalGB,
    }));
  }, [galleries]);

  const createGallery = (galleryData: Partial<Gallery>): Gallery => {
    const id = `gal-${Date.now()}`;
    const slug = (galleryData.title || 'untitled')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newGallery: Gallery = {
      id,
      slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
      title: galleryData.title || 'Untitled Gallery',
      clientName: galleryData.clientName || 'Private Client',
      clientEmail: galleryData.clientEmail || '',
      eventDate: galleryData.eventDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      coverImage:
        galleryData.coverImage ||
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      templateId: galleryData.templateId || 'editorial',
      status: galleryData.status || 'active',
      isPasswordProtected: galleryData.isPasswordProtected || false,
      password: galleryData.password || '',
      allowDownloads: galleryData.allowDownloads !== undefined ? galleryData.allowDownloads : true,
      allowFavorites: galleryData.allowFavorites !== undefined ? galleryData.allowFavorites : true,
      media: galleryData.media || [],
      viewsCount: 0,
      downloadsCount: 0,
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
    items: Omit<MediaItem, 'id' | 'galleryId' | 'dateAdded'>[]
  ) => {
    const nowStr = new Date().toISOString().split('T')[0];
    const newItems: MediaItem[] = items.map((it, idx) => ({
      ...it,
      id: `m-${Date.now()}-${idx}`,
      galleryId,
      dateAdded: nowStr,
    }));

    setGalleries((prev) =>
      prev.map((gal) => {
        if (gal.id !== galleryId) return gal;
        return {
          ...gal,
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
        return {
          ...gal,
          media: gal.media.filter((m) => m.id !== mediaId),
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
          media: gal.media.map((m) => ({
            ...m,
            isCover: m.url === mediaUrl,
          })),
        };
      })
    );
  };

  const updateGalleryTemplate = (galleryId: string, templateId: GalleryTemplateId) => {
    setGalleries((prev) =>
      prev.map((gal) => (gal.id === galleryId ? { ...gal, templateId } : gal))
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
