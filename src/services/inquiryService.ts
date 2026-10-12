import type { PortfolioInquiry, InquiryAnalyticsMetrics, InquiryStatus } from '../types/inquiry';

const STORAGE_KEY = 'photo_saas_inquiries_v1';


type InquiryListener = (inquiries: PortfolioInquiry[]) => void;
const listeners: Set<InquiryListener> = new Set();

const notifyListeners = (inquiries: PortfolioInquiry[]) => {
  listeners.forEach((listener) => {
    try {
      listener(inquiries);
    } catch (e) {
      console.error('Error notifying inquiry listener', e);
    }
  });
};

/**
 * Fetch all saved inquiries
 */
export function getInquiries(): PortfolioInquiry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to parse inquiries from storage', err);
    return [];
  }
}

/**
 * Add a new client inquiry submitted from public portfolio
 */
export function addInquiry(
  payload: Omit<PortfolioInquiry, 'id' | 'createdAt' | 'status'>
): PortfolioInquiry {
  const current = getInquiries();
  const newInquiry: PortfolioInquiry = {
    ...payload,
    id: `inq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    status: 'new',
    createdAt: new Date().toISOString(),
  };

  const updated = [newInquiry, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  notifyListeners(updated);
  return newInquiry;
}

/**
 * Update the status of an inquiry (new -> contacted -> booked -> archived)
 */
export function updateInquiryStatus(id: string, status: InquiryStatus): PortfolioInquiry | null {
  const current = getInquiries();
  const index = current.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const updatedItem: PortfolioInquiry = {
    ...current[index],
    status,
  };

  const updatedList = [...current];
  updatedList[index] = updatedItem;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  notifyListeners(updatedList);
  return updatedItem;
}

/**
 * Delete an inquiry by ID
 */
export function deleteInquiry(id: string): boolean {
  const current = getInquiries();
  const filtered = current.filter((item) => item.id !== id);
  if (filtered.length === current.length) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  notifyListeners(filtered);
  return true;
}

/**
 * Subscribe to inquiry list mutations across tabs/components
 */
export function subscribeInquiries(listener: InquiryListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Compute real-time analytics for the photographer overview dashboard
 */
export function getInquiryAnalytics(inquiriesList?: PortfolioInquiry[]): InquiryAnalyticsMetrics {
  const list = inquiriesList || getInquiries();
  const totalInquiries = list.length;
  const newLeads = list.filter((i) => i.status === 'new').length;
  const inDiscussion = list.filter((i) => i.status === 'contacted').length;
  const bookedCount = list.filter((i) => i.status === 'booked').length;
  const archivedCount = list.filter((i) => i.status === 'archived').length;

  const activeLeads = totalInquiries - archivedCount;
  const conversionRate = activeLeads > 0 ? Math.round((bookedCount / activeLeads) * 100) : 0;

  // Estimate pipeline value from typical budget categories
  let estimatedPipelineValue = 0;
  list.forEach((inq) => {
    if (inq.status === 'archived') return;
    if (inq.budget?.includes('4,50,000') || inq.eventType === 'wedding') {
      estimatedPipelineValue += 500000;
    } else if (inq.eventType === 'pre-wedding' || inq.eventType === 'editorial') {
      estimatedPipelineValue += 220000;
    } else if (inq.eventType === 'commercial') {
      estimatedPipelineValue += 180000;
    } else {
      estimatedPipelineValue += 85000;
    }
  });

  return {
    totalInquiries,
    newLeads,
    inDiscussion,
    bookedCount,
    archivedCount,
    conversionRate,
    estimatedPipelineValue,
  };
}
