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
  otpSchema,
  type EmailFormData,
  type OtpFormData,
} from '../../schemas/authSchemas';
import { useSendLoginOtp, useVerifyLoginOtp, useResendLoginOtp } from '../../service/auth/useAuth';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard/drive';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [sentEmail, setSentEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);


  const sendOtpMutation = useSendLoginOtp();
  const verifyOtpMutation = useVerifyLoginOtp();
  const resendOtpMutation = useResendLoginOtp();

  // Email form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  // OTP form
  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
    mode: 'onChange',
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

  const handleOtpDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const nextDigits = [...otpDigits];
    nextDigits[index] = val.slice(-1);
    setOtpDigits(nextDigits);

    const fullCode = nextDigits.join('');
    otpForm.setValue('otp', fullCode, { shouldValidate: fullCode.length === 6 });

    if (val && index < 5) {
      const nextEl = document.getElementById(`login-otp-${index + 1}`);
      nextEl?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevEl = document.getElementById(`login-otp-${index - 1}`);
      prevEl?.focus();
    }
  };

  const onOtpSubmit = async (data: OtpFormData) => {
    try {
      const res = await verifyOtpMutation.mutateAsync({
        email: sentEmail,
        otp: data.otp,
      });

      if (res?.user) {
        login(res.user);
      }
      navigate(from, { replace: true });
    } catch {
      // Error handled by mutation
    }
  };

  const handleResend = async () => {
    if (!sentEmail) return;
    setOtpDigits(['', '', '', '', '', '']);
    otpForm.setValue('otp', '');
    try {
      await resendOtpMutation.mutateAsync({ email: sentEmail });
    } catch {
      // Handled
    }
  };

  const isEmailLoading = sendOtpMutation.isPending;
  const isOtpLoading = verifyOtpMutation.isPending;

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
            <>
              <h1 className="text-2xl sm:text-[28px] font-extrabold text-white tracking-tight leading-tight mb-1">
                Check your email
              </h1>
              <p className="text-xs sm:text-[13px] text-neutral-400 mb-4 sm:mb-6 leading-relaxed">
                We sent a 6-digit code to <strong className="text-amber-400 font-semibold">{sentEmail}</strong>
              </p>

              <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="flex flex-col gap-3">
                <div className="flex gap-2 justify-between my-1">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      id={`login-otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`w-11 h-12 sm:w-12 sm:h-14 text-center rounded-xl font-mono text-lg font-bold outline-none transition-all ${
                        digit
                          ? 'bg-amber-400/10 border border-amber-400 text-amber-400'
                          : 'bg-neutral-900 border border-neutral-800 text-white focus:border-amber-400'
                      }`}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                {otpForm.formState.errors.otp && (
                  <div className="flex items-center gap-1.5 text-rose-400 text-[11px] justify-center">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{otpForm.formState.errors.otp.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isOtpLoading || otpDigits.join('').length < 6}
                  className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-amber-400/20 active:scale-[0.99] flex items-center justify-center gap-2 mt-1 cursor-pointer disabled:opacity-50"
                >
                  {isOtpLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                  ) : (
                    <>
                      <span>Verify & Sign In</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-neutral-500 mt-4">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendOtpMutation.isPending}
                  className="text-amber-400 font-semibold hover:text-amber-300 cursor-pointer disabled:opacity-50"
                >
                  {resendOtpMutation.isPending ? 'Sending...' : 'Resend'}
                </button>
                {' · '}
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setOtpDigits(['', '', '', '', '', '']);
                    otpForm.setValue('otp', '');
                  }}
                  className="text-neutral-400 hover:text-white cursor-pointer"
                >
                  Change email
                </button>
              </p>
            </>
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
