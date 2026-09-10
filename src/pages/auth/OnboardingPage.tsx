import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import {
  Camera,
  Mail,
  ArrowRight,
  User,
  FolderOpen,
  Cloud,
  Users,
  MapPin,
  Phone,
} from 'lucide-react';

type OnboardStep = 'email' | 'otp' | 'profile';

const avatarPresets = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
];

export const OnboardingPage: React.FC = () => {
  const { completeOnboarding } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<OnboardStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  // Profile fields
  const [studioName, setStudioName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(avatarPresets[0]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setTimeout(() => {
      setStep('otp');
      setIsLoading(false);
      showToast('Code Sent!', `OTP sent to ${email}`, 'success');
    }, 800);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) {
      const nextEl = document.getElementById(`reg-otp-${index + 1}`);
      nextEl?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevEl = document.getElementById(`reg-otp-${index - 1}`);
      prevEl?.focus();
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.join('').length < 6) return;
    setIsLoading(true);
    setTimeout(() => {
      setStep('profile');
      setIsLoading(false);
    }, 700);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      completeOnboarding({
        studioName: studioName.trim() || 'Ex Studio',
        fullName: fullName.trim() || 'Photographer',
        email: email.trim(),
        phone: phone.trim() || '',
        location: location.trim() || '',
        bio: 'Fine-art photographer capturing timeless moments.',
        avatarUrl,
      });
      showToast('Welcome to Ex Studio!', 'Your studio profile is ready.', 'success');
      navigate('/dashboard/drive');
    }, 900);
  };

  const stepLabel = step === 'email' ? '1 of 3' : step === 'otp' ? '2 of 3' : '3 of 3';
  const stepTitle =
    step === 'email'
      ? 'Create Your Account'
      : step === 'otp'
      ? 'Verify Your Email'
      : 'Set Up Your Studio';

  const stepSub =
    step === 'email'
      ? 'Join thousands of photographers building beautiful client experiences.'
      : step === 'otp'
      ? `Enter the 6-digit code sent to ${email}`
      : 'Tell us about your studio to personalize your experience.';

  return (
    <div className="auth-root">
      {/* LEFT PANEL */}
      <div className="auth-left">
        {/* Top Nav */}
        <div className="auth-nav">
          <div className="auth-brand">
            <div className="auth-logo-box">
              <Camera className="auth-logo-icon" />
            </div>
            <div className="auth-brand-text">
              <span className="auth-brand-name">EX STUDIO</span>
              <span className="auth-brand-sub">PHOTOGRAPHY</span>
            </div>
          </div>
          <div className="auth-nav-links">
            <span>Capture</span>
            <span className="auth-nav-dot">•</span>
            <span>Share</span>
            <span className="auth-nav-dot">•</span>
            <span>Deliver</span>
          </div>
        </div>

        {/* Form Area */}
        <div className="auth-form-area">
          <span className="auth-platform-tag">STEP {stepLabel}</span>
          <h1 className="auth-heading">{stepTitle}</h1>
          <p className="auth-subheading">{stepSub}</p>

          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <div className="auth-input-wrapper">
                  <Mail className="auth-input-icon" />
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@studio.com"
                    className="auth-input"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="auth-btn-primary">
                {isLoading ? <span className="auth-spinner" /> : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="auth-btn-icon" />
                  </>
                )}
              </button>

              <p className="auth-switch-text">
                Already have an account?{' '}
                <a href="/login" className="auth-link">Sign in</a>
              </p>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="auth-form">
              <div className="auth-otp-row">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`reg-otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`auth-otp-box ${digit ? 'auth-otp-filled' : ''}`}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.join('').length < 6}
                className="auth-btn-primary"
              >
                {isLoading ? <span className="auth-spinner" /> : (
                  <>
                    <span>Verify Email</span>
                    <ArrowRight className="auth-btn-icon" />
                  </>
                )}
              </button>

              <p className="auth-switch-text">
                Didn't get the code?{' '}
                <button
                  type="button"
                  onClick={() => { setOtp(['', '', '', '', '', '']); showToast('Code Resent', `New OTP sent to ${email}`, 'success'); }}
                  className="auth-link"
                >
                  Resend
                </button>
                {' · '}
                <button type="button" onClick={() => setStep('email')} className="auth-link">
                  Change email
                </button>
              </p>
            </form>
          )}

          {/* Step 3: Profile Setup */}
          {step === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="auth-form auth-form-profile">
              {/* Avatar */}
              <div className="auth-avatar-row">
                <img src={avatarUrl} alt="Avatar" className="auth-avatar-preview" />
                <div className="auth-avatar-presets">
                  {avatarPresets.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatarUrl(p)}
                      className={`auth-avatar-preset-btn ${avatarUrl === p ? 'active' : ''}`}
                    >
                      <img src={p} alt="" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="auth-field-grid">
                <div className="auth-field">
                  <label className="auth-label">Studio Name</label>
                  <div className="auth-input-wrapper">
                    <Camera className="auth-input-icon" />
                    <input
                      type="text"
                      value={studioName}
                      onChange={(e) => setStudioName(e.target.value)}
                      placeholder="e.g. Ex Studio"
                      className="auth-input"
                      required
                    />
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Your Name</label>
                  <div className="auth-input-wrapper">
                    <User className="auth-input-icon" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Sarang Varma"
                      className="auth-input"
                      required
                    />
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Phone (optional)</label>
                  <div className="auth-input-wrapper">
                    <Phone className="auth-input-icon" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="auth-input"
                    />
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Location (optional)</label>
                  <div className="auth-input-wrapper">
                    <MapPin className="auth-input-icon" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. New York, NY"
                      className="auth-input"
                    />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="auth-btn-primary">
                {isLoading ? <span className="auth-spinner" /> : (
                  <>
                    <span>Enter Workspace</span>
                    <ArrowRight className="auth-btn-icon" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <div className="auth-footer-brand">
            <div className="auth-footer-line" />
            <span className="auth-footer-tag">FOR PHOTOGRAPHERS</span>
            <span className="auth-footer-tag">BY PHOTOGRAPHERS</span>
          </div>
          <div className="auth-footer-links">
            <span>STORE</span>
            <span className="auth-nav-dot">•</span>
            <span>SHARE</span>
            <span className="auth-nav-dot">•</span>
            <span>GROW</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-right">
        <img
          src="/auth_side_panel.jpg"
          alt="Ex Studio Photography Platform"
          className="auth-right-img"
        />
        <div className="auth-right-overlay">
          <div className="auth-features">
            <div className="auth-feature-item">
              <FolderOpen className="auth-feature-icon" />
              <span>Organize<br />Your Work</span>
            </div>
            <div className="auth-feature-item">
              <Cloud className="auth-feature-icon" />
              <span>Secure Cloud<br />Storage</span>
            </div>
            <div className="auth-feature-item">
              <Users className="auth-feature-icon" />
              <span>Share with<br />Clients</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
