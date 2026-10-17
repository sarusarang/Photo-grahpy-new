import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2, Calendar, MapPin, DollarSign, Mail, Phone, User, MessageSquare } from 'lucide-react';
import type { ClientInquiryPayload } from '../../types/portfolio';

interface BookingInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  studioName: string;
  artistName?: string;
  accentColor?: string;
  onSubmit: (payload: ClientInquiryPayload) => Promise<boolean>;
}

export const BookingInquiryModal: React.FC<BookingInquiryModalProps> = ({
  isOpen,
  onClose,
  studioName,
  artistName,
  accentColor = '#d4af37',
  onSubmit,
}) => {
  const [formData, setFormData] = useState<ClientInquiryPayload>({
    client_name: '',
    client_email: '',
    client_phone: '',
    event_type: 'wedding',
    event_date: '',
    event_location: '',
    location: '',
    estimated_budget: '',
    budget: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  React.useEffect(() => {
    const handleThrottle = (e: Event) => {
      const customEvent = e as CustomEvent<{ seconds?: number; url?: string }>;
      if (customEvent.detail?.url?.includes('inquiries')) {
        setCooldown(customEvent.detail.seconds || 30);
      }
    };
    window.addEventListener('api-throttled', handleThrottle);
    return () => window.removeEventListener('api-throttled', handleThrottle);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || cooldown > 0) return;

    if (!formData.client_name || !formData.client_email || !formData.message) {
      setError('Please fill in your name, email, and message.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: ClientInquiryPayload = {
        ...formData,
        location: formData.event_location,
        budget: formData.estimated_budget,
      };

      const ok = await onSubmit(payload);
      if (ok) {
        setIsSuccess(true);
        setCooldown(15);
      } else {
        setError('Failed to send inquiry. Please try again or reach out on WhatsApp.');
      }
    } catch {
      setError('An unexpected network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-9 text-neutral-100 shadow-2xl z-10 my-8 overflow-hidden"
        >
          {/* Ambient Lighting */}
          <div
            className="absolute -top-20 -right-20 w-52 h-52 rounded-full blur-3xl pointer-events-none opacity-20"
            style={{ backgroundColor: accentColor }}
          />

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {isSuccess ? (
            /* Success Confirmation State */
            <div className="py-8 text-center space-y-4">
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
              >
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-serif text-white">Inquiry Received</h3>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto leading-relaxed">
                Thank you for your interest in {studioName}. Your message has been delivered directly to {artistName || 'the photographer'}, who will respond within 24 hours.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs tracking-wider uppercase transition cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            /* Booking Inquiry Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1 pb-2 border-b border-neutral-800">
                <span
                  className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold block"
                  style={{ color: accentColor }}
                >
                  Direct Client Inquiries
                </span>
                <h3 className="text-2xl font-serif font-normal text-white">
                  Commission {studioName}
                </h3>
                <p className="text-xs text-neutral-400">
                  Share your vision, dates, and destination for bespoke availability and investment guides.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Client Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    <span>Your Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="Elena & Julian"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs sm:text-sm outline-none focus:border-amber-500 transition font-sans"
                  />
                </div>

                {/* Client Email */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    placeholder="elena@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs sm:text-sm outline-none focus:border-amber-500 transition font-sans"
                  />
                </div>

                {/* Client Phone */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    <span>Phone / WhatsApp</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.client_phone || ''}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs sm:text-sm outline-none focus:border-amber-500 transition font-mono"
                  />
                </div>

                {/* Event Type */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider">
                    Experience Type
                  </label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs sm:text-sm outline-none focus:border-amber-500 transition cursor-pointer"
                  >
                    <option value="wedding">Destination / Luxury Wedding</option>
                    <option value="editorial">Fashion / Haute Editorial</option>
                    <option value="portrait">Private Fine Art Portrait</option>
                    <option value="commercial">Commercial / Campaign</option>
                    <option value="event">Private Gala / Celebration</option>
                    <option value="other">Bespoke Commission</option>
                  </select>
                </div>

                {/* Event Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>Event Date</span>
                  </label>
                  <input
                    type="date"
                    value={formData.event_date || ''}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs sm:text-sm outline-none focus:border-amber-500 transition"
                  />
                </div>

                {/* Event Location */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    <span>Location / Venue</span>
                  </label>
                  <input
                    type="text"
                    value={formData.event_location || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        event_location: e.target.value,
                        location: e.target.value,
                      })
                    }
                    placeholder="Lake Como / Mumbai / Paris"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs sm:text-sm outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Estimated Budget */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3" />
                  <span>Estimated Budget Range</span>
                </label>
                <input
                  type="text"
                  value={formData.estimated_budget || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimated_budget: e.target.value,
                      budget: e.target.value,
                    })
                  }
                  placeholder="e.g. ₹1,50,000 / $5,000+"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs sm:text-sm outline-none focus:border-amber-500 transition font-sans"
                />
              </div>

              {/* Message */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" />
                  <span>Story &amp; Vision *</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your celebration, guest count, aesthetic preferences, or specific timeline..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs sm:text-sm outline-none focus:border-amber-500 transition resize-none font-sans"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || cooldown > 0}
                  className="w-full py-3.5 rounded-xl text-neutral-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-xl active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: accentColor }}
                >
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>
                    {isSubmitting
                      ? 'Sending Inquiry...'
                      : cooldown > 0
                      ? `Please wait ${cooldown}s`
                      : 'Submit Studio Inquiry'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
