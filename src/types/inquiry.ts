export type InquiryEventType =
  | 'wedding'
  | 'pre-wedding'
  | 'editorial'
  | 'commercial'
  | 'portrait'
  | 'maternity'
  | 'other';

export type InquiryStatus = 'new' | 'contacted' | 'booked' | 'archived';

export interface PortfolioInquiry {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  eventType: InquiryEventType;
  eventDate: string;
  location?: string;
  budget?: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
  notes?: string;
}

export interface InquiryAnalyticsMetrics {
  totalInquiries: number;
  newLeads: number;
  inDiscussion: number;
  bookedCount: number;
  archivedCount: number;
  conversionRate: number; // percentage e.g. 35.5
  estimatedPipelineValue: number; // in INR
}
