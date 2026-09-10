import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Camera, Mail, ArrowRight, FolderOpen, Cloud, Users } from 'lucide-react';

type AuthStep = 'email' | 'otp';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setTimeout(() => {
      setSentEmail(email);
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
    // auto-focus next
    if (value && index < 5) {
      const nextEl = document.getElementById(`otp-${index + 1}`);
      nextEl?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevEl = document.getElementById(`otp-${index - 1}`);
      prevEl?.focus();
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return;
    setIsLoading(true);
    setTimeout(() => {
      login(sentEmail);
      showToast('Welcome back!', 'Logged into Ex Studio.', 'success');
      navigate('/dashboard/drive');
    }, 700);
  };

  const handleResend = () => {
    setOtp(['', '', '', '', '', '']);
    showToast('Code Resent', `New OTP sent to ${sentEmail}`, 'success');
  };

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
          <span className="auth-platform-tag">PHOTOGRAPHER CLOUD PLATFORM</span>

          {step === 'email' ? (
            <>
              <h1 className="auth-heading">Welcome Back</h1>
              <p className="auth-subheading">
                Sign in to your studio and continue creating beautiful stories.
              </p>

              <form onSubmit={handleEmailSubmit} className="auth-form">
                <div className="auth-field">
                  <label className="auth-label">Email</label>
                  <div className="auth-input-wrapper">
                    <Mail className="auth-input-icon" />
                    <input
                      id="login-email"
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="auth-btn-primary"
                >
                  {isLoading ? (
                    <span className="auth-spinner" />
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="auth-btn-icon" />
                    </>
                  )}
                </button>
              </form>

              <p className="auth-switch-text">
                Don't have an account?{' '}
                <Link to="/onboarding" className="auth-link">
                  Sign up
                </Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="auth-heading">Check your email</h1>
              <p className="auth-subheading">
                We sent a 6-digit code to <strong className="auth-email-highlight">{sentEmail}</strong>
              </p>

              <form onSubmit={handleOtpSubmit} className="auth-form">
                <div className="auth-otp-row">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
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
                  {isLoading ? (
                    <span className="auth-spinner" />
                  ) : (
                    <>
                      <span>Verify & Sign In</span>
                      <ArrowRight className="auth-btn-icon" />
                    </>
                  )}
                </button>
              </form>

              <p className="auth-switch-text">
                Didn't receive the code?{' '}
                <button type="button" onClick={handleResend} className="auth-link">
                  Resend
                </button>
                {' · '}
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); }}
                  className="auth-link"
                >
                  Change email
                </button>
              </p>
            </>
          )}
        </div>

        {/* Bottom footer */}
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
          {/* Feature pills at bottom */}
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
