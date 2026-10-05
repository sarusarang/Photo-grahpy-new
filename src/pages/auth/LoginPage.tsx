import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/AuthContext';
import {
  Mail,
  ArrowRight,
  FolderOpen,
  Cloud,
  Users,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import {
  emailSchema,
  type EmailFormData,
} from '../../schemas/authSchemas';
import { useSendLoginOtp, useVerifyLoginOtp, useResendLoginOtp } from '../../service/auth/useAuth';
import { OtpSection } from '../../components/auth';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, photographer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as { from?: { pathname?: string } } | null;
  const from = locationState?.from?.pathname || '/dashboard/gallery';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (!photographer.isOnboarded) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, photographer.isOnboarded, navigate, from]);

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [sentEmail, setSentEmail] = useState('');

  const sendOtpMutation = useSendLoginOtp();
  const verifyOtpMutation = useVerifyLoginOtp();
  const resendOtpMutation = useResendLoginOtp();

  // Email form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  const onEmailSubmit = async (data: EmailFormData) => {
    setSentEmail(data.email);
    try {
      await sendOtpMutation.mutateAsync({ email: data.email });
      setStep('otp');
    } catch {
      // Error handled by mutation
    }
  };

  const handleVerifyOtp = async (code: string) => {
    try {
      const res = await verifyOtpMutation.mutateAsync({
        email: sentEmail,
        otp: code,
      });

      if (res?.user) {
        login(res.user);
      }

      // Check if new user or profile incomplete: route directly to onboarding profile setup
      const isNewUser = Boolean(res?.is_new_user);
      const isUserOnboarded = Boolean(
        (res?.user as any)?.is_onboarded ||
        (res?.user?.fullname && res.user.fullname.trim().length > 0)
      );

      if (isNewUser || !isUserOnboarded) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch {
      // Error handled by mutation toast
    }
  };

  const handleResendOtp = async () => {
    if (!sentEmail) return;
    await resendOtpMutation.mutateAsync({ email: sentEmail });
  };

  const handleChangeEmail = () => {
    setStep('email');
  };

  const isEmailLoading = sendOtpMutation.isPending;

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex overflow-x-hidden bg-neutral-950 text-white font-sans select-none">
      {/* LEFT PANEL */}
      <div className="w-full lg:w-[48%] xl:w-[44%] 2xl:w-[40%] min-h-screen min-h-[100dvh] flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-neutral-950 border-r border-neutral-800/80 z-10 overflow-y-auto">
        {/* Top Brand Nav */}
        <header className="flex items-center justify-between shrink-0">
          <Link to="/" className="flex items-center group py-1" title="EX SHARE">
            <Logo variant="dark" className="h-6 sm:h-7 w-auto object-contain transition-transform group-hover:scale-105" />
          </Link>
          <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-medium tracking-wide">
            <span>Capture</span>
            <span className="text-neutral-600">•</span>
            <span>Share</span>
            <span className="text-neutral-600">•</span>
            <span>Deliver</span>
          </div>
        </header>

        {/* Center Form Area */}
        <main className="my-auto w-full max-w-md mx-auto flex flex-col justify-center py-2">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold tracking-[0.18em] text-amber-400 uppercase">
              PHOTOGRAPHER CLOUD PLATFORM
            </span>
          </div>

          {step === 'email' ? (
            <>
              <h1 className="text-2xl sm:text-[28px] font-extrabold text-white tracking-tight leading-tight mb-1">
                Welcome Back
              </h1>
              <p className="text-xs sm:text-[13px] text-neutral-400 mb-4 sm:mb-6 leading-relaxed">
                Sign in to your studio and continue creating beautiful stories.
              </p>

              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="login-email" className="text-[11px] font-medium text-neutral-300 tracking-wide">
                    Email Address <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 pointer-events-none" />
                    <input
                      id="login-email"
                      type="email"
                      {...emailForm.register('email')}
                      placeholder="you@studio.com"
                      className={`w-full py-2.5 pl-10 pr-3.5 rounded-xl bg-neutral-900 border text-xs sm:text-sm text-white placeholder:text-neutral-600 focus:outline-none transition-all ${
                        emailForm.formState.errors.email
                          ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40'
                          : 'border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40'
                      }`}
                      autoFocus
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <div className="flex items-center gap-1.5 text-rose-400 text-[11px] mt-0.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{emailForm.formState.errors.email.message}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isEmailLoading}
                  className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-amber-400/20 active:scale-[0.99] flex items-center justify-center gap-2 mt-1 cursor-pointer disabled:opacity-50"
                >
                  {isEmailLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-neutral-500 mt-4">
                Don't have an account?{' '}
                <Link to="/signup" className="text-amber-400 font-semibold hover:text-amber-300 transition-colors">
                  Sign up
                </Link>
              </p>
            </>
          ) : (
            <OtpSection
              email={sentEmail}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              onChangeEmail={handleChangeEmail}
              isVerifying={verifyOtpMutation.isPending}
              isResending={resendOtpMutation.isPending}
              validityMinutes={10}
              resendCooldownSeconds={30}
              idPrefix="login-otp"
              submitLabel="Verify & Sign In"
            />
          )}
        </main>

        {/* Bottom Footer */}
        <footer className="shrink-0 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-neutral-500">
          <div className="flex flex-col gap-0.5">
            <div className="w-5 h-0.5 bg-amber-400 mb-1" />
            <span className="text-[9px] font-semibold tracking-wider text-neutral-400 uppercase">
              FOR PHOTOGRAPHERS
            </span>
            <span className="text-[8px] font-medium tracking-wider text-neutral-500 uppercase">
              BY PHOTOGRAPHERS
            </span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-semibold tracking-widest text-neutral-500">
            <span>STORE</span>
            <span className="text-neutral-700">•</span>
            <span>SHARE</span>
            <span className="text-neutral-700">•</span>
            <span>GROW</span>
          </div>
        </footer>
      </div>

      {/* RIGHT PANEL */}
      <div className="hidden lg:block flex-1 h-full relative overflow-hidden bg-neutral-950 select-none">
        <img
          src="/auth_side_panel.jpg"
          alt="EX SHARE Photography Platform"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/20 to-transparent flex flex-col justify-end p-8">
          <div className="flex items-center justify-center gap-8 xl:gap-12 p-4 rounded-2xl bg-neutral-950/40 backdrop-blur-md border border-white/10 max-w-lg mx-auto">
            <div className="flex flex-col items-center gap-1.5 text-center text-neutral-300">
              <FolderOpen className="w-5 h-5 text-amber-400" />
              <span className="text-[11px] font-medium leading-tight">
                Organize<br />Your Work
              </span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex flex-col items-center gap-1.5 text-center text-neutral-300">
              <Cloud className="w-5 h-5 text-amber-400" />
              <span className="text-[11px] font-medium leading-tight">
                Secure Cloud<br />Storage
              </span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex flex-col items-center gap-1.5 text-center text-neutral-300">
              <Users className="w-5 h-5 text-amber-400" />
              <span className="text-[11px] font-medium leading-tight">
                Share with<br />Clients
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
