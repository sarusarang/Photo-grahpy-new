import React, { useState, useEffect } from 'react';
import apiClient from '@/api/axiosClient';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';

interface InquiryFormProps {
  photographerId?: string;
  onSuccess?: () => void;
  className?: string;
}

export const PublicInquiryForm: React.FC<InquiryFormProps> = ({
  photographerId,
  onSuccess,
  className = '',
}) => {
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    event_type: 'wedding',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer tick down
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Synchronize cooldown if server emits 429 event
  useEffect(() => {
    const handleThrottle = (e: Event) => {
      const custom = e as CustomEvent<{ seconds?: number }>;
      if (custom.detail?.seconds) {
        setCooldown(custom.detail.seconds);
      }
    };
    window.addEventListener('api-throttled', handleThrottle);
    return () => window.removeEventListener('api-throttled', handleThrottle);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || cooldown > 0) return;

    setSubmitting(true);
    try {
      await apiClient.post('/api/public/inquiries/', {
        ...formData,
        photographer_id: photographerId,
      });
      toast.success('Inquiry sent successfully! The studio will contact you soon.');
      setFormData({
        client_name: '',
        client_email: '',
        client_phone: '',
        event_type: 'wedding',
        message: '',
      });
      setCooldown(15); // Local 15-second grace period prevents rapid duplicates
      if (onSuccess) onSuccess();
    } catch (err: any) {
      if (err.response?.status === 429) {
        toast.error('You have sent several messages. Please wait a minute before sending another.');
      } else {
        toast.error(err.response?.data?.message || err.message || 'Failed to submit inquiry.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-xs font-medium text-neutral-300 mb-1">Your Full Name</label>
        <input
          required
          type="text"
          placeholder="Jane Doe"
          value={formData.client_name}
          onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
          disabled={submitting}
          className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 disabled:opacity-50 transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-300 mb-1">Your Email</label>
        <input
          required
          type="email"
          placeholder="jane@example.com"
          value={formData.client_email}
          onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
          disabled={submitting}
          className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 disabled:opacity-50 transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-300 mb-1">Phone Number (Optional)</label>
        <input
          type="tel"
          placeholder="+1 (555) 000-0000"
          value={formData.client_phone}
          onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
          disabled={submitting}
          className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 disabled:opacity-50 transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-300 mb-1">Event Type</label>
        <select
          value={formData.event_type}
          onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
          disabled={submitting}
          className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 disabled:opacity-50 transition-colors cursor-pointer"
        >
          <option value="wedding">Wedding / Nuptials</option>
          <option value="editorial">Fashion / Editorial</option>
          <option value="portrait">Private Portrait</option>
          <option value="commercial">Commercial Campaign</option>
          <option value="other">Other Celebration</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-300 mb-1">Message</label>
        <textarea
          required
          rows={4}
          placeholder="Tell us about your event, preferred date, location, and vision..."
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          disabled={submitting}
          className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 disabled:opacity-50 transition-colors resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || cooldown > 0}
        className="w-full bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-amber-400/20 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sending Inquiry...</span>
          </>
        ) : cooldown > 0 ? (
          <span>Please wait {cooldown}s</span>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>Send Booking Inquiry</span>
          </>
        )}
      </button>
    </form>
  );
};

export const InquiryForm = PublicInquiryForm;
export default PublicInquiryForm;
