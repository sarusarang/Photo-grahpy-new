import type { PortfolioInquiry, InquiryAnalyticsMetrics, InquiryStatus } from '../types/inquiry';

const STORAGE_KEY = 'photo_saas_inquiries_v1';

const INITIAL_INQUIRIES: PortfolioInquiry[] = [
  {
    id: 'inq-1',
    clientName: 'Ananya Sharma & Kabir Roy',
    clientEmail: 'ananya.roy@gmail.com',
    clientPhone: '+91 98201 44521',
    eventType: 'wedding',
    eventDate: '2026-11-24',
    location: 'Taj Lake Palace, Udaipur',
    budget: '₹4,50,000 - ₹6,000,000',
    message: 'We were completely captivated by your editorial wedding spread. We are planning a 3-day royal palace wedding in Udaipur and would love to have you document both our traditional rituals and modern cocktail reception.',
    status: 'new',
    createdAt: '2026-09-17T10:30:00.000Z',
    notes: 'Urgent response requested. Couple prefers full cinematic film + fine-art albums.',
  },
  {
    id: 'inq-2',
    clientName: 'Meera Nambiar',
    clientEmail: 'meera.design@atelierkerala.com',
    clientPhone: '+91 97455 12908',
    eventType: 'editorial',
    eventDate: '2026-10-15',
    location: 'Fort Kochi Heritage Quarters',
    budget: '₹1,50,000 - ₹2,50,000',
    message: 'Looking for high-fashion editorial imagery for our upcoming Autumn Handloom Couture collection. Needs moody cinematic light with natural coastal textures.',
    status: 'contacted',
    createdAt: '2026-09-15T14:15:00.000Z',
    notes: 'Sent initial rate card and moodboard via email. Follow-up scheduled for Friday.',
  },
  {
    id: 'inq-3',
    clientName: 'Aditya & Rhea Kapoor',
    clientEmail: 'aditya.kapoor92@yahoo.co.in',
    clientPhone: '+91 99100 88234',
    eventType: 'pre-wedding',
    eventDate: '2026-12-05',
    location: 'Dune Retreat, Jaisalmer',
    budget: '₹2,00,000 - ₹3,00,000',
    message: 'We want an intimate, candid pre-wedding shoot in the Thar desert with golden hour sunset tones and campfire night portraits.',
    status: 'booked',
    createdAt: '2026-09-10T09:00:00.000Z',
    notes: 'Booking deposit received! Travel and permits confirmed.',
  },
  {
    id: 'inq-4',
    clientName: 'Siddharth Varma',
    clientEmail: 'sidvarma@varmaholdings.in',
    clientPhone: '+91 98402 77123',
    eventType: 'commercial',
    eventDate: '2026-10-28',
    location: 'Bangalore Tech Park',
    budget: '₹1,80,000',
    message: 'Executive team portraits and architectural interior stills for our newly commissioned headquarters.',
    status: 'contacted',
    createdAt: '2026-09-08T11:45:00.000Z',
    notes: 'Awaiting NDA signature before location scout.',
  },
  {
    id: 'inq-5',
    clientName: 'Pooja & Nikhil Dave',
    clientEmail: 'pooja.dave89@gmail.com',
    clientPhone: '+91 98210 33499',
    eventType: 'maternity',
    eventDate: '2026-10-02',
    location: 'Alibaug Seaside Villa',
    budget: '₹85,000',
    message: 'Sunrise maternity outdoor session by the beach with gentle natural lighting.',
    status: 'booked',
    createdAt: '2026-09-04T16:20:00.000Z',
    notes: 'Client requested monochrome archival prints included in the delivery package.',
  },
];

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
 * Fetch all saved inquiries or initialize with default sample inquiries
 */
export function getInquiries(): PortfolioInquiry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_INQUIRIES));
      return INITIAL_INQUIRIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_INQUIRIES;
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
